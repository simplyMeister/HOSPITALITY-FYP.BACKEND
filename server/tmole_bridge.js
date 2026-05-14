const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Initializing Tunnelmole Bridge...');

// Use npx to run tunnelmole without global installation
// We target port 5000 where the EcoTrack backend runs
const tmole = spawn('npx', ['tunnelmole', '5000'], { shell: true });

tmole.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);

    // Extract the HTTPS URL
    // Format is usually: https://xxxx.tunnelmole.net is forwarding to localhost:5000
    const match = output.match(/https:\/\/[a-z0-9-]+\.tunnelmole\.net/);
    if (match) {
        const baseUrl = match[0];
        const iotEndpoint = `${baseUrl}/api/bins/sensor-update`;
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ TUNNEL ACTIVE');
        console.log(`Base URL: ${baseUrl}`);
        console.log(`PROPER IOT PATH: ${iotEndpoint}`);
        console.log('='.repeat(50) + '\n');

        // Save for reference
        fs.writeFileSync('tmole_url.txt', baseUrl);
    }
});

tmole.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    if (!errorMsg.includes('npm notice')) {
        console.error('DEBUG:', errorMsg);
    }
});

tmole.on('close', (code) => {
    console.log(`Tunnelmole process exited with code ${code}`);
});

process.on('SIGINT', () => {
    tmole.kill();
    process.exit();
});
