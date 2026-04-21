import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const router = express.Router();

// Initialize Gemini
const GEMINI_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (GEMINI_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_KEY);
  // Using the user-requested model
  model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
} else {
  console.warn('GEMINI_API_KEY not set in .env');
}

router.post('/', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    console.log('Received AI prompt:', prompt);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!model) {
      return res.status(503).json({ reply: 'AI service not configured (Missing GEMINI_API_KEY).' });
    }

    // Construct Cyber-Coach System Prompt
    let systemInstruction = "Role: You are a ruthless but helpful 'Cyber-Coach' for a Hybrid Athlete. Keep responses concise, motivating, and actionable. Use a Terminal/Cyberpunk tone.";

    if (context) {
      systemInstruction += `\nUSER LIVE STATUS:
- Integrity Streak: ${context.streak} Days
- Protein Today: ${context.protein}g (Target: 120g)
- Last Relapse: ${context.lastRelapse}
- Today's Mission: ${context.todayMission ? context.todayMission.focus : 'Unknown'} (${context.todayMission ? context.todayMission.type : ''})
- Recent Workouts: ${context.recentWorkouts ? JSON.stringify(context.recentWorkouts) : 'None'}
`;
    }

    const finalPrompt = `${systemInstruction}\n\nUSER PROMPT: ${prompt}`;

    try {
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      const text = response.text();
      return res.json({ reply: text });
    } catch (modelErr) {
      console.warn('Primary model failed (likely 429), switching to Fallback (Flash)...', modelErr.message);
      // Fallback to Flash
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await fallbackModel.generateContent(finalPrompt);
      const response = await result.response;
      const text = response.text();
      return res.json({ reply: text + " [NOTE: Fallback to Flash-Latest due to Quota Limit]" });
    }
  } catch (err) {
    console.error('AI endpoint error:', err);
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

// Experiment Generator
router.post('/experiment', async (req, res) => {
  try {
    const { topic = '', book = '', durationDays = 7 } = req.body;
    const days = Math.max(1, Math.min(30, parseInt(durationDays, 10) || 7));

    if (!model) {
      return res.status(503).json({ raw: 'AI service not configured (Missing GEMINI_API_KEY).' });
    }

    const systemPrompt = `
You are a concise, practical mentor. Produce a ${days}-day, step-by-step experiment plan on this topic:
"${topic}"
Context / constraints: ${book ? `Based on ideas from the book "${book}".` : 'No book specified.'}

Output format: JSON with two keys:
1) "summary" — one-sentence summary of the experiment.
2) "plan" — an array of objects for each day: {"day": <n>, "goal": "<one-line>", "actions": ["step1", "step2"], "measure": "<how to measure success>"}.

Keep language simple and actionable. Make each day's actions doable in 20–90 minutes. Return strictly valid JSON (no extra commentary).
`;

    let content = "";
    try {
      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      content = response.text();
    } catch (modelErr) {
      console.warn('Experiment Primary model failed, switching to Flash...', modelErr.message);
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await fallbackModel.generateContent(systemPrompt);
      const response = await result.response;
      content = response.text();
    }

    // Extract JSON safely (Gemini might add markdown backticks)
    const jsonTextMatch = content.match(/\{[\s\S]*\}$/);
    let parsed = null;
    try {
      const toParse = jsonTextMatch ? jsonTextMatch[0] : content;
      parsed = JSON.parse(toParse);
    } catch {
      return res.json({ raw: content, note: 'failed_to_parse_json' });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('Experiment generator error', err);
    return res.status(500).json({ error: err.message || 'Experiment generator failed' });
  }
});

export default router;