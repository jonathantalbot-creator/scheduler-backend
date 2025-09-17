// In scheduler-backend/server.js

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// --- Middleware ---
// 1. Enable CORS. This allows your frontend (hosted on a different domain) to make requests to this server.
app.use(cors()); 
// 2. Enable the server to understand incoming requests that have a JSON body.
app.use(express.json()); 

// --- Supabase Connection ---
// 3. These lines read your secret Supabase URL and Key from the hosting environment.
//    We will set these up on Render. This is the secure way to handle secrets.
//    NEVER paste your keys directly into this file.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- API Endpoints ---

// A helper function to handle Supabase responses and errors consistently.
const handleSupabaseResponse = (res, { data, error }) => {
    if (error) {
        console.error('Supabase Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
};

// GET /api/:tableName -> Fetches all items from a table (e.g., /api/employees)
app.get('/api/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const response = await supabase.from(tableName).select('*');
    handleSupabaseResponse(res, response);
});

// GET /api/shifts/week/:startDate -> Fetches shifts for a specific week.
app.get('/api/shifts/week/:startDate', async (req, res) => {
    const { startDate } = req.params; // Expects "YYYY-MM-DD"
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const endDateString = endDate.toISOString().split('T')[0];

    const response = await supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDateString);
    handleSupabaseResponse(res, response);
});

// POST /api/:tableName -> Creates a new item in a table.
app.post('/api/:tableName', async (req, res) => {
    const { tableName } = req.params;
    const { data, error } = await supabase.from(tableName).insert([req.body]).select();
    
    if (error) {
        console.error('Supabase Insert Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data[0]); // Respond with the newly created item.
});

// PUT /api/:tableName/:id -> Updates an existing item by its ID.
app.put('/api/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const { data, error } = await supabase.from(tableName).update(req.body).eq('id', id).select();
    
    if (error) {
        console.error('Supabase Update Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
    res.json(data[0]);
});

// DELETE /api/:tableName/:id -> Deletes an item by its ID.
app.delete('/api/:tableName/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    
    if (error) {
        console.error('Supabase Delete Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
    res.status(204).send(); // "No Content" is the standard response for a successful delete.
});

// --- Start the Server ---
// 4. Render will provide a PORT environment variable. For local testing, it falls back to 3001.
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`✅ Studio Scheduler backend is live and listening on port ${port}`);
});