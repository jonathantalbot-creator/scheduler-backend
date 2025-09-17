// index.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get('/healthz', (req, res) => {
  res.status(200).send({ ok: true });
});

// Root route (handy to verify it's up)
app.get('/', (req, res) => {
  res.send('Scheduler backend is running ✅');
});

// (Optional) Supabase init if you need it later
// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const PORT = process.env.PORT || 3000;
// IMPORTANT for Render: bind to 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
