const { app, BrowserWindow, ipcMain, dialog, net, Tray, Menu, nativeImage, powerSaveBlocker } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Send the signed-in Windows user's credentials (NTLM/Kerberos) to spd-apps automatically.
// Both spellings are set because Chromium renamed this switch across versions.
app.commandLine.appendSwitch('auth-server-allowlist', 'spd-apps');
app.commandLine.appendSwitch('auth-server-whitelist', 'spd-apps');

// Explicit Windows Application User Model ID:
// Required for Windows to correctly display the app in the Taskbar and in
// Windows "Taskbar Settings > Other system tray icons"
if (process.platform === 'win32') {
  app.setAppUserModelId('com.digitaltraveller.app');
}

let mainWindow = null;
let tray = null;
let keepAwakeEnabled = false;
let keepAwakeInterval = null;
let powerSaveBlockerId = null;

// Helper to reliably load the application icon with embedded fallback
function getAppIcon() {
  const iconPath = path.join(__dirname, 'icon.png');
  if (fs.existsSync(iconPath)) {
    const img = nativeImage.createFromPath(iconPath);
    if (!img.isEmpty()) return img;
  }
  // High-contrast SVG Renishaw probe icon fallback if file is ever missing
  return nativeImage.createFromDataURL(
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%232563eb"/><circle cx="32" cy="18" r="8" fill="%23f43f5e"/><rect x="29" y="18" width="6" height="30" rx="3" fill="white"/><rect x="18" y="44" width="28" height="6" rx="2" fill="white"/></svg>'
  );
}

// Silently nudges the mouse cursor 1 pixel and returns to reset Windows screensaver/lock timer
function nudgeMouse() {
  if (process.platform === 'win32') {
    const psCmd = 'Add-Type -AssemblyName System.Windows.Forms; $p = [System.Windows.Forms.Cursor]::Position; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(($p.X + 1), $p.Y); Start-Sleep -Milliseconds 40; [System.Windows.Forms.Cursor]::Position = $p';
    exec(`powershell -NoProfile -NonInteractive -WindowStyle Hidden -Command "${psCmd}"`, { windowsHide: true }, (err) => {
      if (err) {
        console.warn('Mouse nudge notice:', err.message);
      }
    });
  }
}

function setKeepAwake(enabled) {
  keepAwakeEnabled = enabled;

  if (keepAwakeInterval) {
    clearInterval(keepAwakeInterval);
    keepAwakeInterval = null;
  }

  if (powerSaveBlockerId !== null) {
    if (powerSaveBlocker.isStarted(powerSaveBlockerId)) {
      powerSaveBlocker.stop(powerSaveBlockerId);
    }
    powerSaveBlockerId = null;
  }

  if (keepAwakeEnabled) {
    // Prevent display and system sleep
    powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');

    // Nudge mouse immediately once, then every 5 minutes (300,000 ms)
    nudgeMouse();
    keepAwakeInterval = setInterval(() => {
      nudgeMouse();
    }, 5 * 60 * 1000);
  }

  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Digital Traveller',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Keep PC awake',
      type: 'checkbox',
      checked: keepAwakeEnabled,
      click: (menuItem) => {
        setKeepAwake(menuItem.checked);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Digital Traveller',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(keepAwakeEnabled ? 'Digital Traveller (Keep PC Awake: ON)' : 'Digital Traveller');
}

function createTray() {
  if (tray) return;

  const appIcon = getAppIcon();
  const trayIcon = appIcon.resize({ width: 32, height: 32 });

  tray = new Tray(trayIcon);
  updateTrayMenu();

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          mainWindow.focus();
        }
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Frameless window to match our custom Windows 11 title bar
    titleBarStyle: 'hidden',
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    }
  });

  if (process.platform === 'win32') {
    mainWindow.setIcon(appIcon);
  }

  createTray();

  // Closing the window hides it to the persistent tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
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

ipcMain.on('window-minimize-to-tray', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (!tray) {
      createTray();
    }
    win.hide();
  }
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
  // Hide to persistent system tray instead of closing app
  win?.hide();
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

ipcMain.handle('create-laser-grating-files', async (event, request) => {
  try {
    const serialNumber = typeof request?.serialNumber === 'string'
      ? request.serialNumber.trim()
      : '';
    const invalidFolderCharacters = /[<>:"/\\|?*\u0000-\u001f]/;
    if (
      !serialNumber ||
      serialNumber === '.' ||
      serialNumber === '..' ||
      invalidFolderCharacters.test(serialNumber) ||
      /[. ]$/.test(serialNumber)
    ) {
      return { success: false, error: 'Enter a valid system serial number before creating files.' };
    }

    if (!Array.isArray(request?.combinations) || request.combinations.length === 0) {
      return { success: false, error: 'Add at least one laser and grating combination first.' };
    }

    const fileNames = new Set();
    for (const combination of request.combinations) {
      const wavelength = Number(combination?.wavelengthNm);
      const gratingDensity = Number(combination?.gratingDensityLinesPerMm);
      if (
        !Number.isFinite(wavelength) ||
        wavelength <= 0 ||
        !Number.isInteger(gratingDensity) ||
        gratingDensity <= 0
      ) {
        return {
          success: false,
          error: 'Each row must have a positive wavelength and a positive whole-number grating density.'
        };
      }
      fileNames.add(`${wavelength}nm_${gratingDensity}.txt`);
    }

    const extraDataDirectory = path.join(app.getPath('documents'), serialNumber, 'Extra Data');
    const targetPaths = [...fileNames].map((fileName) => path.join(extraDataDirectory, fileName));
    const conflicts = [];

    for (const targetPath of targetPaths) {
      try {
        await fs.promises.access(targetPath, fs.constants.F_OK);
        conflicts.push(targetPath);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }

    if (conflicts.length > 0 && request.overwrite !== true) {
      return { success: false, conflicts };
    }

    await fs.promises.mkdir(extraDataDirectory, { recursive: true });
    for (const targetPath of targetPaths) {
      await fs.promises.writeFile(targetPath, '', {
        flag: request.overwrite === true ? 'w' : 'wx'
      });
    }

    return { success: true, files: targetPaths };
  } catch (err) {
    console.error('Failed to create laser/grating files:', err);
    return { success: false, error: `Could not create the files: ${err.message}` };
  }
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

  const querySpdApps = async () => {
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
          authError: true,
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
        return { success: false, missingPhrase: true, error: 'Key phrase not found in the response from spd-apps.' };
      }
      return { success: true, key, source: 'spd-apps' };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    // Attempt 1: First request establishes/negotiates NTLM/Kerberos session credentials
    let result = await querySpdApps();
    if (result.success) {
      return result;
    }

    // If <p id="phrase"> was missing/empty on initial handshake, automatically retry second request
    if (result.missingPhrase) {
      await new Promise((r) => setTimeout(r, 400));
      result = await querySpdApps();
      if (result.success) {
        return result;
      }
    }

    return result;
  } catch (err) {
    console.warn('fetch-wire-key failed:', err);
    return {
      success: false,
      error: `Network timeout: could not reach spd-apps (${err.message || 'no response'}). Check you are on the company network or VPN.`
    };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (app.isQuitting) {
    app.quit();
  }
});
