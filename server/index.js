require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_KEY'; // Need service role to bypass RLS in backend
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

// Root informative route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 50px; line-height: 1.6; max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 20px; border: 1px solid #eee; margin-top: 50px;">
      <h1 style="color: #166534; font-style: italic;">EcoTrack API Server</h1>
      <p>The backend logic layer for <strong>EcoTrack: Living Infrastructure</strong> is active.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <div style="background: white; padding: 20px; border-radius: 10px;">
        <p style="margin-top: 0;"><strong>Active Endpoints:</strong></p>
        <ul style="font-size: 14px; color: #555;">
          <li><code>GET /api/health</code> - System status</li>
          <li><code>POST /api/bins/sensor-update</code> - IoT Telemetry</li>
        </ul>
      </div>
      <p style="font-size: 13px; color: #666; margin-top: 30px;">
        💡 <strong>Looking for the Dashboard?</strong><br/>
        The React frontend usually runs on port <a href="http://localhost:5173" style="color: #4f46e5; font-weight: bold;">5173</a>.
      </p>
    </div>
  `);
});

// IoT Wokwi Webhook Endpoint — Secure bridge for ESP32 devices
app.post('/api/bins/sensor-update', async (req, res) => {
  const payload = req.body;
  const apiKey = req.headers['x-api-key'];

  // 1. Security Check
  if (apiKey !== process.env.IOT_HUB_SECRET) {
    console.warn(`Unauthorized IoT access attempt for bin: ${payload.bin_code}`);
    return res.status(401).json({ error: 'Invalid API Key' });
  }

  if (!payload.bin_code) {
    return res.status(400).json({ error: 'bin_code is required' });
  }

  try {
    // 2. Verified Lookup
    const { data: bin, error: lookupError } = await supabase
      .from('bins')
      .select('*, hospitality_profiles(business_name, primary_gcs_id)')
      .eq('bin_code', payload.bin_code)
      .single();

    if (lookupError || !bin) {
      console.error(`Unregistered bin ping: ${payload.bin_code}`);
      return res.status(404).json({ error: 'Unregistered bin device' });
    }

    // 3. Status Transition & Metrics Update
    // If bin is inactive, this first ping activates it
    const newStatus = payload.fill_level_percent >= (bin.alert_threshold || 80) ? 'alert' : 'active';
    
    const { data: updatedBin, error: updateError } = await supabase
        .from('bins')
        .update({
            fill_level_percent: payload.fill_level_percent,
            weight_kg: payload.weight_kg,
            flame_detected: payload.flame_detected,
            status: newStatus,
            last_updated: new Date().toISOString()
        })
        .eq('bin_code', payload.bin_code)
        .select()
        .single();
        
    if (updateError) throw updateError;
    
    // 4. Persistence & History snapshot
    await supabase.from('bin_history').insert({
        bin_id: bin.id,
        hospitality_id: bin.hospitality_id,
        fill_level_percent: payload.fill_level_percent,
        weight_kg: payload.weight_kg,
        flame_detected: payload.flame_detected
    });
    
    // 5. Threshold Alert Logic (Multi-Channel Notifications)
    if (payload.fill_level_percent >= (bin.alert_threshold || 80)) {
        const hiName = bin.hospitality_profiles?.business_name || 'Your Facility';
        const gcsId = bin.hospitality_profiles?.primary_gcs_id;

        // Notify Hospitality Client
        await supabase.from('notifications').insert({
            recipient_id: bin.hospitality_id,
            category: 'operation',
            title: 'Critical Bin Saturation',
            message: `Your ${bin.label || 'Unit'} is full (${payload.fill_level_percent}%). The collection service has been notified automatically.`,
            related_id: bin.id
        });

        // Notify GCS Provider (if linked)
        if (gcsId) {
            await supabase.from('notifications').insert({
                recipient_id: gcsId,
                category: 'operation',
                title: 'Urgent Collection Required',
                message: `BIN FULL: ${bin.label || 'Unit'} at ${hiName} has reached ${payload.fill_level_percent}%. Dispatch team.`,
                related_id: bin.id
            });
        }
    }

    // 6. Flame/Heat Alert Logic
    if (payload.flame_detected) {
        await supabase.from('notifications').insert({
            recipient_id: bin.hospitality_id,
            category: 'urgent',
            title: '🔥 THERMAL EMERGENCY',
            message: `SPIKE DETECTED in Bin ${bin.bin_code} (${bin.label}). Please inspect immediately.`,
            related_id: bin.id
        });
    }

    res.status(200).json({ 
        success: true, 
        message: bin.status === 'inactive' ? 'Commissioned' : 'Telemetry recorded', 
        status: newStatus 
    });
  } catch (error) {
    console.error('IoT Processing Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', platform: 'EcoTrack API' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoTrack Backend Server running on port ${PORT} (Global)`);
  });
}

// Export the Express API for Vercel Serverless
module.exports = app;
