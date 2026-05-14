const { spawn } = require('child_process');
const fs = require('fs');

const tunnel = spawn('ssh', ['-p', '443', '-o', 'StrictHostKeyChecking=no', '-R0:localhost:5000', 'a.pinggy.io']);

tunnel.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    const match = output.match(/https:\/\/[a-z0-9-]+\.a\.pinggy\.link/);
    if (match) {
        fs.writeFileSync('tunnel_url.txt', match[0]);
        console.log('URL FOUND:', match[0]);
    }
});

tunnel.stderr.on('data', (data) => {
    console.error('STDERR:', data.toString());
});
