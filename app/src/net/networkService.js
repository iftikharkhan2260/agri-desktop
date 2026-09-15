// networkService.js — section A: the app is fully functional Standalone by
// default (its own local database, zero networking) and only becomes a
// Host or a Client when the person explicitly chooses that from the Sync
// Settings screen in the drawer. Nothing here blocks login or app startup.

const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const hostServer = require('./hostServer');
const client = require('./client');
const { DEFAULT_PORT } = require('./protocol');

const CONFIG_KEY = 'network_config';

let role = 'standalone'; // 'standalone' | 'host' | 'client'
let hostToken = null;
let hostIp = null;
let hostPort = DEFAULT_PORT;
let localUser = null; // this device's own logged-in user, used for 'standalone' and 'host'
const changeListeners = new Set();

async function persist(config) {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

async function clearPersisted() {
  await AsyncStorage.removeItem(CONFIG_KEY);
}

async function becomeHost(token) {
  const { port } = await hostServer.start(token, DEFAULT_PORT);
  role = 'host';
  hostToken = token;
  hostPort = port;
  await persist({ role: 'host', token, port });
  return { port };
}

// Stops broadcasting to the network but KEEPS all local data — the device
// simply drops back to Standalone, per section A ("fully functional even
// if no network is joined").
async function stopHosting() {
  hostServer.stop();
  role = 'standalone';
  hostToken = null;
  await clearPersisted();
}

async function joinAsClient(ip, token, port = DEFAULT_PORT) {
  await client.connect(ip, port, token);
  role = 'client';
  hostIp = ip;
  hostToken = token;
  hostPort = port;
  await persist({ role: 'client', ip, token, port });
}

async function disconnectClient() {
  client.disconnect();
  role = 'standalone';
  hostIp = null;
  hostToken = null;
  await clearPersisted();
}

// Called once at app startup. Never blocks the UI — Standalone works
// immediately regardless of outcome. If this device was previously a Host,
// it quietly resumes hosting in the background. If it was a Client and the
// Host isn't reachable right now, it falls back to Standalone rather than
// leaving the app unusable; reconnecting can be retried any time from Sync
// Settings.
async function resume() {
  const raw = await AsyncStorage.getItem(CONFIG_KEY);
  if (!raw) return { role: 'standalone' };
  const cfg = JSON.parse(raw);

  try {
    if (cfg.role === 'host') {
      await becomeHost(cfg.token);
      return { role: 'host' };
    }
    if (cfg.role === 'client') {
      await joinAsClient(cfg.ip, cfg.token, cfg.port);
      return { role: 'client' };
    }
  } catch (err) {
    role = 'standalone';
    return { role: 'standalone', resumeError: err.message };
  }
  return { role: 'standalone' };
}

function setLocalUser(user) {
  localUser = user;
}

function getRole() {
  return role;
}

function getHostInfo() {
  return { ip: hostIp, port: hostPort, token: hostToken };
}

function onDataChanged(callback) {
  changeListeners.add(callback);
  let underlyingUnsub = null;
  if (role === 'client') underlyingUnsub = client.onChange(callback);
  else underlyingUnsub = hostServer.onLocalChange(callback); // standalone or host both dispatch locally
  return () => {
    changeListeners.delete(callback);
    if (underlyingUnsub) underlyingUnsub();
  };
}

function parseQueryString(path) {
  const [cleanPath, qs] = path.split('?');
  const query = {};
  if (qs) {
    new URLSearchParams(qs).forEach((v, k) => { query[k] = v; });
  }
  return { cleanPath, query };
}

async function request(method, path, body) {
  const { cleanPath, query } = parseQueryString(path);

  if (role === 'client') {
    return client.call(method, cleanPath, query, body);
  }

  // 'standalone' and 'host' both dispatch to the local database directly —
  // becoming a Host only adds a TCP listener on top, it never changes how
  // this device's own screens read/write data.
  const result = await hostServer.callLocal(method, cleanPath, query, body, localUser);
  if (cleanPath === '/api/auth/login' && result && result.user) {
    localUser = result.user;
  }
  return result;
}

module.exports = {
  becomeHost, stopHosting, joinAsClient, disconnectClient, resume,
  setLocalUser, getRole, getHostInfo, onDataChanged, request
};
