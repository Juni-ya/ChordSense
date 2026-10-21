import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      process.env.ALLOWED_ORIGINS?.split(',').includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ChordSense AI Server',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/analyze', analyzeRouter);

// Start server
app.listen(PORT, () => {
  console.log(`\n  🎸 ChordSense AI Server`);
  console.log(`  ────────────────────────`);
  console.log(`  ▸ Local:   http://localhost:${PORT}`);
  console.log(`  ▸ Health:  http://localhost:${PORT}/api/health`);
  console.log(`  ▸ Analyze: POST http://localhost:${PORT}/api/analyze`);
  console.log(`  ▸ Gemini:  ${process.env.GEMINI_API_KEY ? '✓ API key configured' : '✗ GEMINI_API_KEY not set'}`);
  console.log();
});
