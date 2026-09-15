// client.js — thin facade kept so every screen's `import { api } from
// '../api/client'` keeps working unchanged. All calls now go through the
// in-app peer-to-peer networkService (Host or Client role) instead of fetch.

const networkService = require('../net/networkService');

export const api = {
  get: (path) => networkService.request('GET', path),
  post: (path, body) => networkService.request('POST', path, body),
  put: (path, body) => networkService.request('PUT', path, body),
  del: (path) => networkService.request('DELETE', path)
};

// Re-exported for screens/components that want to react to live updates
// from other devices (Order Board, Payments, Stock, etc.).
export const onDataChanged = networkService.onDataChanged;
export const getNetworkRole = networkService.getRole;
export const getHostInfo = networkService.getHostInfo;
