// desktopNetworkService.js — same standalone-by-default model as the
// mobile app's networkService.js. Config persists to a plain JSON file in
// Electron's userData folder instead of AsyncStorage.

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const netHost = require('./netHost');
const netClient = require('./netClient');
const { DEFAULT_PORT } = require('./protocol');

const CONFIG_PATH = path.join(app.getPath('userData'), 'network_config.json');

let role = 'standalone'; // 'standalone' | 'host' | 'client'
let hostToken = null;
let hostIp = null;
let hostPort = DEFAULT_PORT;
let localUser = null;
const changeListeners = new Set();

function persist(config) {
  try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config)); } catch { /* best effort */ }
}

function clearPersisted() {
  try { fs.unlinkSync(CONFIG_PATH); } catch { /* may not exist */ }
}

function loadPersisted() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return null; }
}

async function becomeHost(token) {
  const { port } = await netHost.start(token, DEFAULT_PORT);
  role = 'host';
  hostToken = token;
  hostPort = port;
  persist({ role: 'host', token, port });
  return { port };
}

async function stopHosting() {
  netHost.stop();
  role = 'standalone';
  hostToken = null;
  clearPersisted();
}

async function joinAsClient(ip, token, port = DEFAULT_PORT) {
  await netClient.connect(ip, port, token);
  role = 'client';
  hostIp = ip;
  hostToken = token;
  hostPort = port;
  persist({ role: 'client', ip, token, port });
}

async function disconnectClient() {
  netClient.disconnect();
  role = 'standalone';
  hostIp = null;
  hostToken = null;
  clearPersisted();
}

async function resume() {
  const cfg = loadPersisted();
  if (!cfg) return { role: 'standalone' };
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
  const underlyingUnsub = role === 'client' ? netClient.onChange(callback) : netHost.onLocalChange(callback);
  return () => { changeListeners.delete(callback); if (underlyingUnsub) underlyingUnsub(); };
}

async function request(method, path, body) {
  const [cleanPath, qs] = path.split('?');
  const query = {};
  if (qs) new URLSearchParams(qs).forEach((v, k) => { query[k] = v; });

  if (role === 'client') {
    return netClient.call(method, cleanPath, query, body);
  }
  const result = await netHost.callLocal(method, cleanPath, query, body, localUser);
  if (cleanPath === '/api/auth/login' && result && result.user) localUser = result.user;
  return result;
}

module.exports = {
  becomeHost, stopHosting, joinAsClient, disconnectClient, resume,
  setLocalUser, getRole, getHostInfo, onDataChanged, request
};
