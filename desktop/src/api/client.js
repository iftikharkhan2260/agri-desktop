// client.js (desktop) — same shape as the mobile facade so every screen's
// `import { api } from '../api/client'` keeps working unchanged. Calls go
// through window.desktopAPI (exposed by preload.js) to the Electron main
// process, which holds the real database and any Host/Client networking.

export const api = {
  get: (path) => window.desktopAPI.request('GET', path),
  post: (path, body) => window.desktopAPI.request('POST', path, body),
  put: (path, body) => window.desktopAPI.request('PUT', path, body),
  del: (path) => window.desktopAPI.request('DELETE', path)
};

export const onDataChanged = (callback) => window.desktopAPI.onDataChanged(callback);
