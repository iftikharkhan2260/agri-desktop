// licenseService.js (Electron main process) — same licensing model as the
// mobile app: a license key checked against your Google Sheet via Apps
// Script, cached locally with an offline grace period.

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { LICENSE_API_URL, GRACE_PERIOD_DAYS } = require('./licenseConfig');

const STORAGE_PATH = path.join(app.getPath('userData'), 'license_state.json');

function getCachedLicense() {
  try { return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8')); } catch { return null; }
}

function isWithinGracePeriod(state) {
  if (!state || !state.lastCheckedAt) return false;
  const diffDays = (Date.now() - new Date(state.lastCheckedAt).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= GRACE_PERIOD_DAYS;
}

function isConfigured() {
  return !!LICENSE_API_URL && !LICENSE_API_URL.includes('PASTE_YOUR');
}

async function verifyLicenseOnline(licenseKey) {
  if (!isConfigured()) throw new Error('License server not configured yet — see licensing/README.md.');
  const url = `${LICENSE_API_URL}?key=${encodeURIComponent(licenseKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`License server returned ${res.status}`);
  const data = await res.json();

  const state = {
    licenseKey, valid: !!data.valid, message: data.message || null,
    shopName: data.shopName || null, expiry: data.expiry || null,
    lastCheckedAt: new Date().toISOString()
  };
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(state));
  return state;
}

function activateBypass() {
  const state = {
    licenseKey: 'DEV-BYPASS', valid: true, message: null,
    shopName: 'Bypass Mode (not a real license)', expiry: null,
    lastCheckedAt: new Date().toISOString(), isBypass: true
  };
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(state));
  return state;
}

function clearLicense() {
  try { fs.unlinkSync(STORAGE_PATH); } catch { /* may not exist */ }
}

module.exports = { getCachedLicense, isWithinGracePeriod, isConfigured, verifyLicenseOnline, activateBypass, clearLicense };
