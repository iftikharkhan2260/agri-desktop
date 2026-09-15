// server.js — OPTIONAL. Most shops never need this file: any phone can tap
// "Become Host" in the app itself (see section 1a in the README). Run this
// instead only if you want one dedicated always-on computer as the host,
// with every phone (including the owner's) joining as a Client.
//
// Usage: node server.js <token> [port]
// Example: node server.js MYSHOP2024 4050

const net = require('net');
const { encode, makeFrameParser, DEFAULT_PORT } = require('./protocol');
const { buildRouter } = require('./handlers');
const db = require('./dbAdapter');

const token = process.argv[2];
const port = Number(process.argv[3]) || DEFAULT_PORT;

if (!token) {
  console.error('Usage: node server.js <token> [port]');
  process.exit(1);
}

const router = buildRouter(db);
const sockets = new Set();

function broadcast(event) {
  const line = encode(event);
  for (const sock of sockets) {
    try { sock.write(line); } catch { /* socket may have just closed */ }
  }
}

const server = net.createServer((socket) => {
  socket.authenticated = false;
  socket.user = null;

  const feed = makeFrameParser(async (msg) => {
    if (msg.type === 'auth') {
      if (msg.token === token) {
        socket.authenticated = true;
        socket.write(encode({ type: 'auth_ok' }));
        sockets.add(socket);
        console.log('Client authenticated:', socket.remoteAddress);
      } else {
        socket.write(encode({ type: 'auth_fail' }));
        socket.destroy();
      }
      return;
    }

    if (!socket.authenticated) return;

    if (msg.type === 'request') {
      try {
        const result = await router.handleRequest({
          method: msg.method,
          path: msg.path,
          query: msg.query || {},
          body: msg.body || {},
          user: socket.user
        });

        if (msg.path === '/api/auth/login' && result && result.user) {
          socket.user = result.user;
        }

        socket.write(encode({ type: 'response', id: msg.id, status: 200, data: result }));

        if (msg.method !== 'GET') {
          const resource = msg.path.split('/')[2] || '';
          broadcast({ type: 'event', event: 'changed', resource });
        }
      } catch (err) {
        socket.write(encode({ type: 'response', id: msg.id, status: err.status || 500, error: err.message || 'Server error' }));
      }
    }
  });

  socket.on('data', feed);
  socket.on('close', () => { sockets.delete(socket); console.log('Client disconnected:', socket.remoteAddress); });
  socket.on('error', () => sockets.delete(socket));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Agri Shop relay listening on port ${port}`);
  console.log('Give every phone this device\'s local IP + the token you started it with.');
  console.log('Find the IP with `ip addr` (Linux/Termux), `ifconfig` (Mac), or `ipconfig` (Windows).');
});
