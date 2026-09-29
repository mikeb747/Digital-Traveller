const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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

// Automatic Native Background WiRE Key Fetcher
// Uses an invisible, offscreen BrowserWindow that automatically shares the Windows/NTLM user credentials
ipcMain.handle('fetch-wire-key', async (event, serialNumber) => {
  const cleanSn = (serialNumber || '').trim();
  if (!cleanSn) {
    return { success: false, error: 'Empty serial number provided.' };
  }

  return new Promise((resolve) => {
    let completed = false;

    // Create a hidden, off-screen window with standard user session
    const hiddenWin = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const finish = (result) => {
      if (completed) return;
      completed = true;
      try {
        if (!hiddenWin.isDestroyed()) {
          hiddenWin.destroy();
        }
      } catch (e) {
        // ignore
      }
      resolve(result);
    };

    // Timeout safety: 12 seconds
    const timeout = setTimeout(() => {
      finish({
        success: false,
        error: 'Timeout waiting for spd-apps response. Check VPN or company network connection.'
      });
    }, 12000);

    // Track navigation to extract key phrase once loaded
    hiddenWin.webContents.on('did-finish-load', async () => {
      try {
        const url = hiddenWin.webContents.getURL();

        // Check if we reached the generate response or dashboard
        const phrase = await hiddenWin.webContents.executeJavaScript(`
          (() => {
            const p = document.getElementById('phrase');
            if (p && p.innerText) return p.innerText.trim();
            const anyP = document.querySelector('#phrase, p[id="phrase"]');
            if (anyP && anyP.innerText) return anyP.innerText.trim();
            // Check text inside body if formatted as 4x6 key
            const match = document.body.innerText.match(/[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}/);
            return match ? match[0] : null;
          })()
        `);

        if (phrase) {
          clearTimeout(timeout);
          return finish({ success: true, key: phrase, source: 'spd-apps' });
        }

        // If currently on dashboard, submit the form automatically
        if (url.includes('dashboard') || url.includes('FeaturePermissions')) {
          const submitted = await hiddenWin.webContents.executeJavaScript(`
            (() => {
              const input = document.querySelector('input[name="sn"], input#sn, input[type="text"]');
              const form = document.querySelector('form[action*="generate"], form');
              if (input && form) {
                input.value = ${JSON.stringify(cleanSn)};
                form.submit();
                return true;
              }
              return false;
            })()
          `);

          if (!submitted) {
            // Alternatively post directly via fetch inside the authenticated session
            const fetchResult = await hiddenWin.webContents.executeJavaScript(`
              (async () => {
                try {
                  const fd = new URLSearchParams();
                  fd.append('sn', ${JSON.stringify(cleanSn)});
                  const res = await fetch('https://spd-apps/FeaturePermissions/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    credentials: 'include',
                    body: fd.toString()
                  });
                  const txt = await res.text();
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(txt, 'text/html');
                  const p = doc.getElementById('phrase');
                  return p ? p.innerText.trim() : null;
                } catch(e) {
                  return null;
                }
              })()
            `);

            if (fetchResult) {
              clearTimeout(timeout);
              return finish({ success: true, key: fetchResult, source: 'spd-apps' });
            }
          }
        }
      } catch (err) {
        console.warn('Electron key extraction error:', err);
      }
    });

    hiddenWin.webContents.on('did-fail-load', (e, errorCode, errorDescription) => {
      // Don't fail immediately on redirects or aborts
      if (errorCode === -3) return; // ABORTED by redirect
      console.warn('Hidden window fail load:', errorCode, errorDescription);
    });

    // Load initial dashboard to establish NTLM authentication
    hiddenWin.loadURL('https://spd-apps/FeaturePermissions/dashboard').catch((err) => {
      clearTimeout(timeout);
      finish({
        success: false,
        error: `Could not reach https://spd-apps: ${err.message || 'Host unreachable'}`
      });
    });
  });
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
