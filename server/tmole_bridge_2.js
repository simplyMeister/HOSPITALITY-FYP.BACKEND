const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Initializing SECONDARY Tunnelmole Bridge...');

// This spawns a separate tunnel instance for the same local port (5000)
// Tunnelmole will provide a unique URL for this instance
const tmole = spawn('npx', ['tunnelmole', '5000'], { shell: true });

tmole.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);

    // Extract the HTTPS URL
    const match = output.match(/https:\/\/[a-z0-9-]+\.tunnelmole\.net/);
    if (match) {
        const baseUrl = match[0];
        const iotEndpoint = `${baseUrl}/api/bins/sensor-update`;
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ SECONDARY TUNNEL ACTIVE');
        console.log(`Base URL: ${baseUrl}`);
        console.log(`IOT ENDPOINT FOR SECOND BIN: ${iotEndpoint}`);
        console.log('='.repeat(50) + '\n');

        // Save for reference
        fs.writeFileSync('tmole_url_secondary.txt', baseUrl);
    }
});

tmole.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    if (!errorMsg.includes('npm notice')) {
        console.error('DEBUG:', errorMsg);
    }
});

tmole.on('close', (code) => {
    console.log(`Secondary Tunnelmole process exited with code ${code}`);
});

process.on('SIGINT', () => {
    tmole.kill();
    process.exit();
});
