// hostServer.js — the TCP listener here only ever runs on a device that
// tapped "Become Host". The local router+database (ensureRouter) is
// separate and always available — that's what makes solo/standalone mode
// possible with zero networking at all (section A).

const TcpSockets = require('react-native-tcp-socket').default;
const { encode, makeFrameParser, DEFAULT_PORT } = require('./protocol');
const { buildRouter } = require('../localapi/handlers');
const db = require('../localapi/dbAdapter');

let server = null;
let router = null;
const sockets = new Set(); // every connected client socket, each carries socket.user once logged in
const localListeners = new Set(); // this device's own UI subscribes here for live refresh

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

// Builds the local database + router once, WITHOUT starting the TCP
// listener. This is what runs by default (Standalone mode) and whenever
// this device's own UI needs to read/write data, regardless of whether
// "Become Host" has ever been tapped.
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

  server = TcpSockets.createServer((socket) => {
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

      if (!socket.authenticated) return; // ignore anything before auth

      if (msg.type === 'request') {
        try {
          const result = await router.handleRequest({
            method: msg.method,
            path: msg.path,
            query: msg.query || {},
            body: msg.body || {},
            user: socket.user
          });

          // A successful login on THIS socket makes subsequent requests
          // from THIS socket authenticated as that user.
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
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => sockets.delete(socket));
  });

  return new Promise((resolve, reject) => {
    server.listen({ port, host: '0.0.0.0' }, () => resolve({ port }));
    server.on('error', reject);
  });
}

// Stops the TCP listener only — the local database and router stay put,
// so the device drops back to fully-functional Standalone mode instead of
// losing anything.
function stop() {
  for (const sock of sockets) { try { sock.destroy(); } catch { /* noop */ } }
  sockets.clear();
  if (server) { server.close(); server = null; }
}

// Used whenever THIS device is the one browsing the app — whether it's
// Standalone or has become a Host — no socket round-trip needed, call the
// router directly.
async function callLocal(method, path, query, body, user) {
  const r = await ensureRouter();
  const result = await r.handleRequest({ method, path, query, body, user });
  if (method !== 'GET') {
    const resource = path.split('/')[2] || '';
    broadcast({ type: 'event', event: 'changed', resource });
  }
  return result;
}

module.exports = { start, stop, callLocal, broadcast, onLocalChange, isListening, ensureRouter };
