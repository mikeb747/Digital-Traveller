const { app, BrowserWindow, ipcMain, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');

// Send the signed-in Windows user's credentials (NTLM/Kerberos) to spd-apps automatically.
// Both spellings are set because Chromium renamed this switch across versions.
app.commandLine.appendSwitch('auth-server-allowlist', 'spd-apps');
app.commandLine.appendSwitch('auth-server-whitelist', 'spd-apps');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Frameless window to match our custom Windows 11 title bar
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, 'icon.png')
  });

  // In production load web-build/index.html, in dev load local dev server
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    const indexPath = path.join(__dirname, '../web-build/index.html');
    console.log('Loading:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error('did-fail-load', code, desc, url);
  });
}

// Window control IPC handlers
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.close();
});

// Direct Network Share File System handlers (Direct UNC / Mapped drive access)
ipcMain.handle('read-network-file', async (event, filePath) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    return { success: true, data: buffer };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('write-network-file', async (event, { filePath, data }) => {
  try {
    const buffer = Buffer.from(data);
    await fs.promises.writeFile(filePath, buffer);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Native folder picker
ipcMain.handle('select-network-directory', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Automatic WiRE Key fetch.
// POSTs sn=<serial> to spd-apps using the signed-in Windows user's credentials and reads
// <p id="phrase">KEY</p> from the HTML response. Runs in the main process, so browser
// cross-origin (CORS) rules do not apply.
const WIRE_KEY_URL = 'https://spd-apps/FeaturePermissions/generate';

ipcMain.handle('fetch-wire-key', async (event, serialNumber) => {
  const cleanSn = (serialNumber || '').trim();
  if (!cleanSn) {
    return { success: false, error: 'Empty serial number provided.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await net.fetch(WIRE_KEY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `sn=${encodeURIComponent(cleanSn)}`,
      credentials: 'include',
      signal: controller.signal
    });

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        error: `Authentication failure (HTTP ${res.status}). Make sure you are signed in to Windows with your Renishaw account.`
      };
    }
    if (!res.ok) {
      return { success: false, error: `HTTP error ${res.status}: ${res.statusText}` };
    }

    const html = await res.text();
    const match = html.match(/<p[^>]*\bid=["']phrase["'][^>]*>([\s\S]*?)<\/p>/i);
    const key = match ? match[1].replace(/<[^>]+>/g, '').trim() : '';
    if (!key) {
      return { success: false, error: 'Key phrase not found in the response from spd-apps.' };
    }
    return { success: true, key, source: 'spd-apps' };
  } catch (err) {
    console.warn('fetch-wire-key failed:', err);
    return {
      success: false,
      error: `Network timeout: could not reach spd-apps (${err.message || 'no response'}). Check you are on the company network or VPN.`
    };
  } finally {
    clearTimeout(timer);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
