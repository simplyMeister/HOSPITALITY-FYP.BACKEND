const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
  try {
    const tunnel = await localtunnel({ 
      port: 5000,
      subdomain: 'hospitality-smart-bins-2026'
    });

    console.log('URL:', tunnel.url);
    fs.writeFileSync('lt_url.txt', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Error starting tunnel:', err);
  }
})();
