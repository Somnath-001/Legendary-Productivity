import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './routes/ai.js';
import pushRoutes from './routes/push.js';

dotenv.config();
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.options('*', cors({ origin: true, credentials: true }));

app.use(express.json());

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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
