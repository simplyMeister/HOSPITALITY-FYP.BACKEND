require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBins() {
    console.log('🔍 Checking registered bins in Supabase...');
    const { data, error } = await supabase.from('bins').select('bin_code, label');
    
    if (error) {
        console.error('❌ Error fetching bins:', error.message);
        return;
    }

    if (data.length === 0) {
        console.log('⚠️  The "bins" table is EMPTY. You need to add at least one bin in the Supabase Dashboard!');
    } else {
        console.log('✅ Found the following bins:');
        data.forEach(bin => {
            console.log(` - Code: "${bin.bin_code}" (Label: ${bin.label || 'No Label'})`);
        });
        console.log('\n💡 Tip: Make sure your ESP32 code matches the "Code" exactly (including CAPS).');
    }
}

checkBins();
