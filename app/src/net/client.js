// client.js — runs on every device that tapped "Join as Client".
// Connects over the local WiFi/hotspot to the Host's TCP socket.

const TcpSockets = require('react-native-tcp-socket').default;
const { encode, makeFrameParser } = require('./protocol');

let socket = null;
let nextId = 1;
const pending = new Map(); // id -> { resolve, reject }
const changeListeners = new Set();

function connect(host, port, token) {
  return new Promise((resolve, reject) => {
    socket = TcpSockets.createConnection({ host, port }, () => {
      socket.write(encode({ type: 'auth', token }));
    });

    const feed = makeFrameParser((msg) => {
      if (msg.type === 'auth_ok') {
        resolve();
      } else if (msg.type === 'auth_fail') {
        reject(new Error('Incorrect host token.'));
        disconnect();
      } else if (msg.type === 'response') {
        const waiter = pending.get(msg.id);
        if (!waiter) return;
        pending.delete(msg.id);
        if (msg.status >= 200 && msg.status < 300) waiter.resolve(msg.data);
        else waiter.reject(Object.assign(new Error(msg.error || 'Request failed'), { status: msg.status }));
      } else if (msg.type === 'event') {
        changeListeners.forEach((cb) => cb(msg));
      }
    });

    socket.on('data', feed);
    socket.on('error', (err) => reject(err));
    socket.on('close', () => {
      for (const waiter of pending.values()) waiter.reject(new Error('Connection to host lost.'));
      pending.clear();
    });
  });
}

function disconnect() {
  if (socket) { try { socket.destroy(); } catch { /* noop */ } socket = null; }
  pending.clear();
}

function isConnected() {
  return !!socket;
}

function call(method, path, query = {}, body = {}) {
  if (!socket) return Promise.reject(new Error('Not connected to a host. Set up hosting/joining first.'));
  const id = nextId++;
  const message = { type: 'request', id, method, path, query, body };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.write(encode(message));
  });
}

function onChange(callback) {
  changeListeners.add(callback);
  return () => changeListeners.delete(callback);
}

module.exports = { connect, disconnect, isConnected, call, onChange };
