// index.js
const express = require('express');
const cors = require('cors');

const app = express();

// 🔐 allow your frontend to call this API (adjust origin later if you have a specific domain)
app.use(cors());
app.use(express.json());

// ---- (optional) Supabase client if you're storing data) ----
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).send({ ok: true });
});

// Root page
app.get('/', (req, res) => {
  res.send('Scheduler backend is running ✅');
});

// Simple test endpoint you can call from your frontend
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the scheduler backend 👋' });
});

// Example: read data from Supabase table `appointments`
app.get('/api/appointments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('appointments').select('*').order('start_time', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Example: create a new appointment (expects JSON body)
app.post('/api/appointments', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
  const { title, start_time, end_time } = req.body || {};
  if (!title || !start_time || !end_time) {
    return res.status(400).json({ error: 'Missing required fields: title, start_time, end_time' });
  }
  const { data, error } = await supabase.from('appointments').insert([{ title, start_time, end_time }]).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
// ---- Google AI Studio (Gemini) route ----
const { GoogleGenerativeAI } = require('@google/generative-ai');

app.post('/api/ai', async (req, res) => {
  try {
    const prompt = (req.body && req.body.prompt) ? String(req.body.prompt) : '';
    if (!prompt) return res.status(400).json({ error: 'Missing "prompt" in JSON body' });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GOOGLE_API_KEY not set' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ prompt, output: text });
  } catch (err) {
    console.error('AI route error:', err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});
// Catch-all 404 for unknown API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// IMPORTANT: listen on Render’s provided PORT and 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
