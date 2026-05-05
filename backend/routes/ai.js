import express from 'express';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();
const router = express.Router();

// Initialize Groq (runs Llama models)
const GROQ_KEY = process.env.GROQ_API_KEY;
let groq = null;

const PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';

if (GROQ_KEY) {
  groq = new Groq({ apiKey: GROQ_KEY });
  console.log(`🤖 AI initialized: Groq (${PRIMARY_MODEL})`);
} else {
  console.warn('⚠️  GROQ_API_KEY not set in .env — AI features disabled');
}

// Helper: call Groq chat completion
async function chatCompletion(systemPrompt, userPrompt, modelName = PRIMARY_MODEL) {
  const response = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });
  return response.choices[0]?.message?.content || '';
}

// POST /api/ai — Ask AI (Cyber-Coach)
router.post('/', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    console.log('Received AI prompt:', prompt);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!groq) {
      console.warn('[ai] Request received but GROQ_API_KEY is not configured — returning placeholder response.');
      return res.json({ reply: '⚠️ AI Cyber-Coach is offline. Set GROQ_API_KEY to activate this feature.' });
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

    try {
      const text = await chatCompletion(systemInstruction, prompt, PRIMARY_MODEL);
      return res.json({ reply: text });
    } catch (modelErr) {
      console.warn(`Primary model (${PRIMARY_MODEL}) failed, switching to fallback (${FALLBACK_MODEL})...`, modelErr.message);
      try {
        const text = await chatCompletion(systemInstruction, prompt, FALLBACK_MODEL);
        return res.json({ reply: text + ` [NOTE: Fallback to ${FALLBACK_MODEL} due to rate limit]` });
      } catch (fallbackErr) {
        console.error('Fallback model also failed:', fallbackErr.message);
        return res.status(500).json({ error: 'AI request failed on both primary and fallback models' });
      }
    }
  } catch (err) {
    console.error('AI endpoint error:', err);
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

// POST /api/ai/experiment — Experiment Generator
router.post('/experiment', async (req, res) => {
  try {
    const { topic = '', book = '', durationDays = 7 } = req.body;
    const days = Math.max(1, Math.min(30, parseInt(durationDays, 10) || 7));

    if (!groq) {
      console.warn('[ai] Experiment request received but GROQ_API_KEY is not configured — returning placeholder response.');
      return res.json({ summary: 'AI service offline.', plan: [], note: 'Set GROQ_API_KEY to generate experiment plans.' });
    }

    const systemPrompt = `You are a concise, practical mentor. Produce a ${days}-day, step-by-step experiment plan.

Output format: JSON with two keys:
1) "summary" — one-sentence summary of the experiment.
2) "plan" — an array of objects for each day: {"day": <n>, "goal": "<one-line>", "actions": ["step1", "step2"], "measure": "<how to measure success>"}.

Keep language simple and actionable. Make each day's actions doable in 20–90 minutes. Return strictly valid JSON (no extra commentary, no markdown).`;

    const userPrompt = `Topic: "${topic}"
${book ? `Based on ideas from the book "${book}".` : 'No book specified.'}`;

    let content = "";
    try {
      content = await chatCompletion(systemPrompt, userPrompt, PRIMARY_MODEL);
    } catch (modelErr) {
      console.warn(`Experiment: Primary model failed, switching to ${FALLBACK_MODEL}...`, modelErr.message);
      content = await chatCompletion(systemPrompt, userPrompt, FALLBACK_MODEL);
    }

    // Extract JSON safely (model might add markdown backticks)
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