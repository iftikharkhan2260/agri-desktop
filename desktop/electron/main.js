const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const desktopNetworkService = require('./desktopNetworkService');
const licenseService = require('./licenseService');
const db = require('./dbAdapter');

let mainWindow = null;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 650,
    title: 'Agri Shop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Forward live-update events (another device wrote something) to the renderer.
  desktopNetworkService.onDataChanged((event) => {
    if (mainWindow) mainWindow.webContents.send('data-changed', event);
  });
}

app.whenReady().then(async () => {
  await db.ready();
  await desktopNetworkService.resume();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- API requests (renderer never talks to the database directly) ----
ipcMain.handle('api-request', async (event, { method, path: apiPath, body }) => {
  try {
    const data = await desktopNetworkService.request(method, apiPath, body);
    if (apiPath === '/api/auth/login' && data && data.user) {
      desktopNetworkService.setLocalUser(data.user);
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, status: err.status || 500, message: err.message || 'Request failed' };
  }
});

// ---- Networking (Sync Settings) ----
ipcMain.handle('net-become-host', async (event, token) => desktopNetworkService.becomeHost(token));
ipcMain.handle('net-stop-hosting', async () => desktopNetworkService.stopHosting());
ipcMain.handle('net-join-client', async (event, { ip, token, port }) => desktopNetworkService.joinAsClient(ip, token, port));
ipcMain.handle('net-disconnect', async () => desktopNetworkService.disconnectClient());
ipcMain.handle('net-get-role', async () => desktopNetworkService.getRole());
ipcMain.handle('net-get-host-info', async () => desktopNetworkService.getHostInfo());
ipcMain.handle('net-get-local-ip', async () => getLocalIp());

// ---- Licensing ----
ipcMain.handle('license-get-cached', async () => licenseService.getCachedLicense());
ipcMain.handle('license-is-within-grace', async (event, state) => licenseService.isWithinGracePeriod(state));
ipcMain.handle('license-verify', async (event, key) => licenseService.verifyLicenseOnline(key));
ipcMain.handle('license-bypass', async () => licenseService.activateBypass());
ipcMain.handle('license-clear', async () => { licenseService.clearLicense(); return true; });

// ---- Files: image picker (items/logo), returns a base64 data-URI ----
ipcMain.handle('pick-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  const buffer = fs.readFileSync(filePath);
  return `data:image/${mime};base64,${buffer.toString('base64')}`;
});

// ---- Font embedding for print/PDF windows ----
// The hidden windows used for printing/PDF export load an isolated
// data:// URL and can't see index.html's @font-face rules, so Urdu text
// (item 2) would fall back to whatever generic font the OS has — often
// missing the Nastaliq style entirely. We read the bundled TTF files and
// inject them as base64 @font-face rules directly into the HTML before
// loading it, so both English and Urdu render with the correct font
// regardless of what's installed system-wide.
function loadFontBase64(filename) {
  const candidates = [
    path.join(__dirname, '..', 'dist', 'fonts', filename),
    path.join(__dirname, '..', 'public', 'fonts', filename)
  ];
  for (const p of candidates) {
    try { return fs.readFileSync(p).toString('base64'); } catch { /* try next */ }
  }
  return null;
}

function injectFonts(html) {
  const fonts = [
    { name: 'Noto Sans', weight: 400, file: 'NotoSans-Regular.ttf' },
    { name: 'Noto Sans', weight: 700, file: 'NotoSans-Bold.ttf' },
    { name: 'Noto Nastaliq Urdu', weight: 400, file: 'NotoNastaliqUrdu-Regular.ttf' },
    { name: 'Noto Nastaliq Urdu', weight: 700, file: 'NotoNastaliqUrdu-Bold.ttf' }
  ];
  const rules = fonts.map((f) => {
    const b64 = loadFontBase64(f.file);
    if (!b64) return '';
    return `@font-face { font-family: '${f.name}'; font-weight: ${f.weight}; src: url(data:font/ttf;base64,${b64}) format('truetype'); }`;
  }).filter(Boolean).join('\n');

  if (!rules) return html; // fonts not downloaded yet — fall back to system fonts silently
  const styleTag = `<style>${rules}</style>`;
  return html.includes('</head>') ? html.replace('</head>', `${styleTag}</head>`) : styleTag + html;
}

// ---- PDF export: renders HTML off-screen, saves via a native Save dialog ----
ipcMain.handle('export-pdf', async (event, { html, suggestedName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName || 'export.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false };

  const pdfWindow = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(injectFonts(html))}`);
  const pdfBuffer = await pdfWindow.webContents.printToPDF({});
  fs.writeFileSync(result.filePath, pdfBuffer);
  pdfWindow.destroy();
  return { ok: true, filePath: result.filePath };
});

// ---- Print receipt: opens the OS print dialog on a hidden window ----
ipcMain.handle('print-html', async (event, html) => {
  const printWindow = new BrowserWindow({ show: false });
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(injectFonts(html))}`);
  return new Promise((resolve) => {
    printWindow.webContents.print({ silent: false }, () => {
      printWindow.destroy();
      resolve(true);
    });
  });
});

// ---- Backup: copy the live DB file to a location the user picks ----
ipcMain.handle('backup-database', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `agri-shop-backup-${new Date().toISOString().slice(0, 10)}.db`,
    filters: [{ name: 'Database', extensions: ['db'] }]
  });
  if (result.canceled || !result.filePath) return { ok: false };
  fs.copyFileSync(db.getDbPath(), result.filePath);
  return { ok: true, filePath: result.filePath };
});
