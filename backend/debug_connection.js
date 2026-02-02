const fs = require('fs');
const net = require('net');
const tls = require('tls');
const dns = require('dns');
const path = require('path');

async function main() {
  // 1. Read .env
  console.log('--- Reading .env ---');
  let envContent;
  try {
    envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  } catch (err) {
    console.error('Failed to read .env:', err.message);
    process.exit(1);
  }

  // Match DATABASE_URL that is NOT commented out
  // We look for optional whitespace, then DATABASE_URL=..., ensuring no preceding #
  const lines = envContent.split('\n');
  let dbUrlLine = lines.find(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('DATABASE_URL=') && !trimmed.startsWith('#');
  });

  if (!dbUrlLine) {
    console.error('Active DATABASE_URL not found in .env');
    process.exit(1);
  }

  const dbUrlMatch = dbUrlLine.match(/DATABASE_URL="?([^"\s]+)"?/);
  if (!dbUrlMatch) {
     console.error('Could not parse DATABASE_URL value');
     process.exit(1);
  }
  
  const originalUrl = dbUrlMatch[1];
  console.log('DATABASE_URL found (length):', originalUrl.length);
  
  let u;
  try {
    u = new URL(originalUrl);
    console.log('Protocol:', u.protocol);
    console.log('Hostname:', u.hostname);
    console.log('Port:', u.port || '5432 (default)');
    console.log('Search params:', u.search);
  } catch (err) {
    console.error('Invalid URL:', err.message);
    process.exit(1);
  }

  const hostname = u.hostname;
  const port = u.port || 5432;

  // 2. DNS Resolution
  console.log('\n--- DNS Resolution ---');
  try {
    const addresses = await dns.promises.resolve(hostname);
    console.log('Resolved addresses:', addresses);
  } catch (err) {
    console.error('DNS Resolution failed:', err.message);
  }

  // 3. TCP Connect
  console.log('\n--- TCP Connection Test ---');
  await new Promise((resolve) => {
    const socket = net.createConnection(port, hostname, () => {
      console.log('TCP connect success!');
      socket.end();
      resolve();
    });
    socket.on('error', (err) => {
      console.error('TCP connect error:', err.message);
      resolve();
    });
    socket.setTimeout(5000, () => {
      console.error('TCP connect timeout');
      socket.destroy();
      resolve();
    });
  });

  // 4. TLS Connect
  console.log('\n--- TLS Connection Test ---');
  await new Promise((resolve) => {
    const socket = tls.connect(port, hostname, {
      servername: hostname, // SNI is often required
      rejectUnauthorized: false // Relax SSL for testing
    }, () => {
      console.log('TLS connect success! Authorized:', socket.authorized);
      if (!socket.authorized) {
          console.log('Authorization error:', socket.authorizationError);
      }
      socket.end();
      resolve();
    });
    socket.on('error', (err) => {
      console.error('TLS connect error:', err.message);
      resolve();
    });
    socket.setTimeout(8000, () => {
        console.error('TLS connect timeout');
        socket.destroy();
        resolve();
    });
  });
}

main();
