import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './routes/ai.js';
import pushRoutes from './routes/push.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Railway assigns a PORT environment variable
const PORT = process.env.PORT || 8080; // Changed default to 8080 to match Railway's expectation
const HOST = '0.0.0.0'; // Railway requires 0.0.0.0

console.log(`🚀 Starting Legendary Productivity Server`);
console.log(`📍 PORT: ${PORT}`);
console.log(`🌐 HOST: ${HOST}`);
console.log(`🔑 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`🔑 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`🔔 VAPID_PUBLIC_KEY: ${process.env.VAPID_PUBLIC_KEY ? 'SET' : 'NOT SET'}`);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.options('*', cors({ origin: true, credentials: true }));

app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount all AI related routes here
app.use('/api/ai', aiRoutes);
app.use('/api/push', pushRoutes);

// Serve static files from frontend build
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Handle SPA routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Legendary Productivity Backend running on http://${HOST}:${PORT}`);
  console.log(`🌍 Frontend served from: ${frontendPath}`);
});
