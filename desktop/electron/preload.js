const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  request: async (method, apiPath, body) => {
    const result = await ipcRenderer.invoke('api-request', { method, path: apiPath, body });
    if (!result.ok) {
      const err = new Error(result.message);
      err.status = result.status;
      throw err;
    }
    return result.data;
  },

  onDataChanged: (callback) => {
    const listener = (event, payload) => callback(payload);
    ipcRenderer.on('data-changed', listener);
    return () => ipcRenderer.removeListener('data-changed', listener);
  },

  becomeHost: (token) => ipcRenderer.invoke('net-become-host', token),
  stopHosting: () => ipcRenderer.invoke('net-stop-hosting'),
  joinAsClient: (ip, token, port) => ipcRenderer.invoke('net-join-client', { ip, token, port }),
  disconnectClient: () => ipcRenderer.invoke('net-disconnect'),
  getRole: () => ipcRenderer.invoke('net-get-role'),
  getHostInfo: () => ipcRenderer.invoke('net-get-host-info'),
  getLocalIp: () => ipcRenderer.invoke('net-get-local-ip'),

  licenseGetCached: () => ipcRenderer.invoke('license-get-cached'),
  licenseIsWithinGrace: (state) => ipcRenderer.invoke('license-is-within-grace', state),
  licenseVerify: (key) => ipcRenderer.invoke('license-verify', key),
  licenseBypass: () => ipcRenderer.invoke('license-bypass'),
  licenseClear: () => ipcRenderer.invoke('license-clear'),

  pickImage: () => ipcRenderer.invoke('pick-image'),
  exportPdf: (html, suggestedName) => ipcRenderer.invoke('export-pdf', { html, suggestedName }),
  printHtml: (html) => ipcRenderer.invoke('print-html', html),
  backupDatabase: () => ipcRenderer.invoke('backup-database')
});
