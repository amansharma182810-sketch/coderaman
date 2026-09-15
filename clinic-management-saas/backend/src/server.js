import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const { Pool } = pg;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5174' } });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5174' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, database: 'connected' }); }
  catch { res.status(503).json({ ok: false, database: 'unavailable' }); }
});

app.get('/api/queue', async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, token_number, patient_name, status FROM queue_entries WHERE status = 'waiting' ORDER BY token_number");
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/queue', async (req, res) => {
  const { patientName } = req.body;
  if (!patientName?.trim()) return res.status(400).json({ error: 'patientName is required' });
  try {
    const { rows } = await pool.query('INSERT INTO queue_entries (token_number, patient_name, status) SELECT COALESCE(MAX(token_number),0)+1,$1,$2 FROM queue_entries RETURNING *', [patientName.trim(), 'waiting']);
    io.emit('queue:updated', rows[0]);
    res.status(201).json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

io.on('connection', (socket) => socket.on('queue:subscribe', () => socket.join('clinic-queue')));

const port = Number(process.env.PORT || 5001);
httpServer.listen(port, () => console.log(`Clinic API running on http://localhost:${port}`));
