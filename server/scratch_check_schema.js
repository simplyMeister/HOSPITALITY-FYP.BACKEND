const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("--- BINS TABLE ---");
    const { data: bins, error: bError } = await supabase.from('bins').select('*').limit(1);
    if (bError) console.error(bError);
    else console.log(Object.keys(bins[0] || {}).join(', '));

    console.log("\n--- COLLECTIONS TABLE ---");
    const { data: collections, error: cError } = await supabase.from('collections').select('*').limit(1);
    if (cError) console.error(cError);
    else console.log(Object.keys(collections[0] || {}).join(', '));
}

checkSchema();
