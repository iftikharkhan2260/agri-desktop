const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { LICENSE_API_URL, GRACE_PERIOD_DAYS } = require('./licenseConfig');

const STORAGE_KEY = 'license_state';
// Shape of the stored state:
// { licenseKey, valid, message, shopName, expiry, lastCheckedAt }

async function getCachedLicense() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function isWithinGracePeriod(state) {
  if (!state || !state.lastCheckedAt) return false;
  const diffDays = (Date.now() - new Date(state.lastCheckedAt).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= GRACE_PERIOD_DAYS;
}

function isConfigured() {
  return !!LICENSE_API_URL && !LICENSE_API_URL.includes('PASTE_YOUR');
}

// Calls the Apps Script Web App with the license key. Throws on network
// failure (caller decides whether the grace period covers that).
async function verifyLicenseOnline(licenseKey) {
  if (!isConfigured()) {
    throw new Error('License server not configured yet — see licensing/README.md.');
  }
  const url = `${LICENSE_API_URL}?key=${encodeURIComponent(licenseKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`License server returned ${res.status}`);
  const data = await res.json();

  const state = {
    licenseKey,
    valid: !!data.valid,
    message: data.message || null,
    shopName: data.shopName || null,
    expiry: data.expiry || null,
    lastCheckedAt: new Date().toISOString()
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

async function clearLicense() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Section 2 (support/dev use): tapping the brand title 7 times on the
// License screen calls this instead of hitting the server. Stored just
// like a normal license so it persists across restarts — visible and
// removable from the License screen in the drawer, clearly labeled so it's
// not mistaken for a real license.
async function activateBypass() {
  const state = {
    licenseKey: 'DEV-BYPASS',
    valid: true,
    message: null,
    shopName: 'Bypass Mode (not a real license)',
    expiry: null,
    lastCheckedAt: new Date().toISOString(),
    isBypass: true
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

module.exports = { getCachedLicense, isWithinGracePeriod, isConfigured, verifyLicenseOnline, clearLicense, activateBypass };
