import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/ai.js';
import pushRoutes from './routes/push.js';

dotenv.config();
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.options('*', cors({ origin: 'http://localhost:5173', credentials: true }));

app.use(express.json());

// Mount all AI related routes here
app.use('/api/ai', aiRoutes);
app.use('/api/push', pushRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
