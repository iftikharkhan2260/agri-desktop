// netHost.js — same protocol as the mobile app's hostServer.js and the
// Node relay, using Node's built-in 'net' module directly since Electron's
// main process IS Node.js.

const net = require('net');
const { encode, makeFrameParser, DEFAULT_PORT } = require('./protocol');
const { buildRouter } = require('./handlers');
const db = require('./dbAdapter');

let server = null;
let router = null;
const sockets = new Set();
const localListeners = new Set();

function broadcast(event) {
  const line = encode(event);
  for (const sock of sockets) {
    try { sock.write(line); } catch { /* socket may have just closed */ }
  }
  localListeners.forEach((cb) => cb(event));
}

function onLocalChange(callback) {
  localListeners.add(callback);
  return () => localListeners.delete(callback);
}

async function ensureRouter() {
  if (!router) {
    await db.ready();
    router = buildRouter(db);
  }
  return router;
}

function isListening() {
  return !!server;
}

async function start(token, port = DEFAULT_PORT) {
  if (server) return { port };
  await ensureRouter();

  server = net.createServer((socket) => {
    socket.authenticated = false;
    socket.user = null;

    const feed = makeFrameParser(async (msg) => {
      if (msg.type === 'auth') {
        if (msg.token === token) {
          socket.authenticated = true;
          socket.write(encode({ type: 'auth_ok' }));
          sockets.add(socket);
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
            method: msg.method, path: msg.path, query: msg.query || {}, body: msg.body || {}, user: socket.user
          });
          if (msg.path === '/api/auth/login' && result && result.user) socket.user = result.user;
          socket.write(encode({ type: 'response', id: msg.id, status: 200, data: result }));
          if (msg.method !== 'GET') {
            broadcast({ type: 'event', event: 'changed', resource: msg.path.split('/')[2] || '' });
          }
        } catch (err) {
          socket.write(encode({ type: 'response', id: msg.id, status: err.status || 500, error: err.message || 'Server error' }));
        }
      }
    });

    socket.on('data', feed);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => sockets.delete(socket));
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => resolve({ port }));
    server.on('error', reject);
  });
}

function stop() {
  for (const sock of sockets) { try { sock.destroy(); } catch { /* noop */ } }
  sockets.clear();
  if (server) { server.close(); server = null; }
}

async function callLocal(method, path, query, body, user) {
  const r = await ensureRouter();
  const result = await r.handleRequest({ method, path, query, body, user });
  if (method !== 'GET') broadcast({ type: 'event', event: 'changed', resource: path.split('/')[2] || '' });
  return result;
}

module.exports = { start, stop, callLocal, broadcast, onLocalChange, isListening };
