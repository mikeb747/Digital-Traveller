const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const REGISTRY_APP_NAMES = new Set([
  'WiRE2',
  'WiREInterface.exe',
  'WiREVideoViewer',
  'WiRE'
].map((name) => name.toLowerCase()));
const REGISTRY_VENDORS = ['Renishaw', 'Renishaw plc'];
const UNINSTALL_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$roots = @(",
  "  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',",
  "  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',",
  "  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall'",
  ')',
  '$items = foreach ($root in $roots) {',
  '  if (Test-Path -LiteralPath $root) {',
  '    Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue | ForEach-Object {',
  '      $entry = Get-ItemProperty -LiteralPath $_.PSPath -ErrorAction SilentlyContinue',
  "      if ($entry.DisplayName -match 'WiRE') {",
  '        $productCode = $null',
  "        if ($_.PSChildName -match '^\\{[0-9A-Fa-f-]{36}\\}$') { $productCode = $_.PSChildName }",
  '        [PSCustomObject]@{',
  '          registryPath = $_.Name',
  '          displayName = [string]$entry.DisplayName',
  '          displayVersion = [string]$entry.DisplayVersion',
  '          publisher = [string]$entry.Publisher',
  '          uninstallString = [string]$entry.UninstallString',
  '          productCode = $productCode',
  '          windowsInstaller = [bool]$entry.WindowsInstaller',
  '        }',
  '      }',
  '    }',
  '  }',
  '}',
  'ConvertTo-Json -InputObject @($items) -Compress'
].join('\n');

function requireWindows() {
  if (process.platform !== 'win32') {
    throw new Error('PC cleanup is available in the Windows desktop app only.');
  }
}

async function isDirectory(directory) {
  try {
    const stat = await fs.promises.lstat(directory);
    return stat.isDirectory() && !stat.isSymbolicLink();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
}

function getProfilesRoot() {
  return path.win32.join(process.env.SystemDrive || 'C:', 'Users');
}

async function findWireInterfaceExecutable(installDirectory) {
  const pending = [{ directory: installDirectory, depth: 0 }];
  let visited = 0;
  while (pending.length > 0 && visited < 10000) {
    const current = pending.pop();
    visited += 1;
    let entries;
    try {
      entries = await fs.promises.readdir(current.directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'EACCES' || error.code === 'EPERM' || error.code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of entries) {
      const fullPath = path.win32.join(current.directory, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === 'wireinterface.exe') {
        return fullPath;
      }
      if (entry.isDirectory() && current.depth < 6) {
        pending.push({ directory: fullPath, depth: current.depth + 1 });
      }
    }
  }
  return null;
}

async function getFolderCandidates() {
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const candidates = new Map();
  const add = (candidatePath, category) => {
    candidates.set(path.win32.normalize(candidatePath).toLowerCase(), {
      path: path.win32.normalize(candidatePath),
      category
    });
  };

  add(path.win32.join(programFiles, 'Renishaw', 'wdfshell'), 'wdfshell');
  add(path.win32.join(programFilesX86, 'Renishaw', 'wdfshell'), 'wdfshell');

  const wireRoot = path.win32.join(programFilesX86, 'Renishaw');
  if (await isDirectory(wireRoot)) {
    for (const entry of await fs.promises.readdir(wireRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && /^WiRE/i.test(entry.name)) {
        add(path.win32.join(wireRoot, entry.name), 'WiRE installation');
      }
    }
  }

  const profilesRoot = getProfilesRoot();
  if (await isDirectory(profilesRoot)) {
    const ignoredProfiles = new Set(['All Users', 'Default', 'Default User', 'Public']);
    for (const profile of await fs.promises.readdir(profilesRoot, { withFileTypes: true })) {
      if (!profile.isDirectory() || ignoredProfiles.has(profile.name)) continue;
      const appData = path.win32.join(profilesRoot, profile.name, 'AppData');
      add(path.win32.join(appData, 'Roaming', 'Renishaw'), 'Roaming Renishaw data');
      add(path.win32.join(appData, 'Roaming', 'Renishaw_PLC'), 'Roaming Renishaw PLC data');
      add(path.win32.join(appData, 'Local', 'Renishaw', 'WiRE2'), 'Local WiRE2 data');
      add(path.win32.join(appData, 'Local', 'Renishaw_PLC'), 'Local Renishaw PLC data');
    }
  }

  return [...candidates.values()];
}

async function searchCleanupFolders() {
  requireWindows();
  const candidates = await getFolderCandidates();
  const results = [];
  for (const candidate of candidates) {
    if (await isDirectory(candidate.path)) results.push(candidate);
  }
  return results;
}

async function deleteCleanupFolders(requestedPaths) {
  requireWindows();
  if (!Array.isArray(requestedPaths) || requestedPaths.length === 0) {
    throw new Error('Select at least one discovered folder to delete.');
  }
  const candidates = await getFolderCandidates();
  const approved = new Map(candidates.map((item) => [item.path.toLowerCase(), item.path]));
  const deleted = [];
  for (const requestedPath of requestedPaths) {
    if (typeof requestedPath !== 'string') {
      throw new Error('Invalid folder path received.');
    }
    const approvedPath = approved.get(path.win32.normalize(requestedPath).toLowerCase());
    if (!approvedPath) {
      throw new Error(`Refusing to delete a folder outside the approved cleanup locations: ${requestedPath}`);
    }
    if (!(await isDirectory(approvedPath))) {
      throw new Error(`The selected folder no longer exists: ${approvedPath}`);
    }
    try {
      await fs.promises.rm(approvedPath, { recursive: true, force: false });
      deleted.push(approvedPath);
    } catch (error) {
      throw new Error(
        `Deleted ${deleted.length} folder(s), then failed to delete "${approvedPath}": ${error.message}`
      );
    }
  }
  return deleted;
}

async function runReg(args) {
  try {
    const { stdout } = await execFileAsync('reg.exe', args, {
      windowsHide: true,
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024
    });
    return stdout;
  } catch (error) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}`;
    if (/unable to find the specified registry key or value|system was unable to find/i.test(output)) {
      return null;
    }
    throw new Error(`Registry command failed: ${output.trim() || error.message}`);
  }
}

async function listRegistryChildren(registryPath) {
  const output = await runReg(['query', registryPath]);
  if (output === null) return [];
  const root = registryPath
    .replace(/^HKCU\\/i, 'HKEY_CURRENT_USER\\')
    .replace(/^HKLM\\/i, 'HKEY_LOCAL_MACHINE\\')
    .toLowerCase();
  const children = new Map();
  for (const line of output.split(/\r?\n/)) {
    const match = line.trim().match(/^(HKEY_[^\r\n]+)$/i);
    if (!match) continue;
    const candidate = match[1].trim();
    const parent = candidate.slice(0, candidate.lastIndexOf('\\')).toLowerCase();
    if (parent === root) children.set(candidate.toLowerCase(), candidate);
  }
  return [...children.values()];
}

function getMachineRenishawKey() {
  const architecture = process.env.PROCESSOR_ARCHITEW6432 || process.env.PROCESSOR_ARCHITECTURE || '';
  const is64Bit = /64/i.test(architecture) || Boolean(process.env['ProgramFiles(x86)']);
  return is64Bit
    ? 'HKLM\\SOFTWARE\\WOW6432Node\\Renishaw'
    : 'HKLM\\SOFTWARE\\Renishaw';
}

async function searchCleanupRegistry() {
  requireWindows();
  const results = [];
  for (const vendor of REGISTRY_VENDORS) {
    const root = `HKCU\\Software\\${vendor}`;
    for (const child of await listRegistryChildren(root)) {
      const name = child.slice(child.lastIndexOf('\\') + 1);
      if (REGISTRY_APP_NAMES.has(name.toLowerCase())) {
        results.push({ path: child, category: name });
      }
    }
  }
  const machineKey = getMachineRenishawKey();
  if ((await runReg(['query', machineKey])) !== null) {
    results.push({ path: machineKey, category: 'HKLM Renishaw' });
  }
  return results;
}

function readToolbarTemplateHex() {
  const templatePath = path.join(__dirname, '..', 'OrderSortingFilterButtons.reg');
  const registryText = fs.readFileSync(templatePath, 'utf16le').replace(/^\uFEFF/, '');
  const targetKey = '[HKEY_CURRENT_USER\\Software\\Renishaw\\WiREInterface.exe\\Custom toolbar\\0]';
  if (!registryText.toLowerCase().includes(targetKey.toLowerCase())) {
    throw new Error('The toolbar registry template does not contain the expected Custom toolbar\\0 key.');
  }
  const unfolded = registryText.replace(/\\\r?\n\s*/g, '');
  const dataMatch = unfolded.match(/^"data"=hex:([0-9a-f,\s]+)$/im);
  if (!dataMatch) {
    throw new Error('The toolbar registry template does not contain a REG_BINARY data value.');
  }
  const hex = dataMatch[1].replace(/[^0-9a-f]/gi, '').toLowerCase();
  if (!hex || hex.length % 2 !== 0) {
    throw new Error('The toolbar registry template contains invalid binary data.');
  }
  return hex;
}

async function findWireInstallation(requestedDirectory) {
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const wireRoot = path.win32.join(programFilesX86, 'Renishaw');
  if (!(await isDirectory(wireRoot))) {
    throw new Error('No WiRE installation directory was found in Program Files (x86)\\Renishaw.');
  }
  const directories = (await fs.promises.readdir(wireRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^WiRE/i.test(entry.name))
    .map((entry) => path.win32.join(wireRoot, entry.name));
  const installDirectory = directories.find((directory) =>
    directory.toLowerCase() === path.win32.normalize(requestedDirectory || '').toLowerCase()
  );
  if (!installDirectory) {
    throw new Error('Select a WiRE installation folder found by the folder search.');
  }
  const executable = await findWireInterfaceExecutable(installDirectory);
  if (!executable) {
    throw new Error(`WiREInterface.exe was not found inside "${installDirectory}".`);
  }
  return { installDirectory, executable };
}

function relocateToolbarPaths(hex, installedDirectory) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    throw new Error('The bundled toolbar data is not valid hexadecimal data.');
  }
  const newRoot = path.win32.normalize(installedDirectory);
  let data = Buffer.from(hex, 'hex');
  let offset = 0;
  let replacements = 0;
  while (offset + 4 <= data.length) {
    const isStringMarker =
      data[offset] === 0xff &&
      data[offset + 1] === 0xfe &&
      data[offset + 2] === 0xff;
    if (!isStringMarker) {
      offset += 1;
      continue;
    }
    const characterCount = data[offset + 3];
    const stringEnd = offset + 4 + characterCount * 2;
    if (stringEnd > data.length) {
      throw new Error('The bundled toolbar data contains a truncated string.');
    }
    const originalText = data.subarray(offset + 4, stringEnd).toString('utf16le');
    const updatedText = originalText.replace(
      /[A-Z]:\\Program Files \(x86\)\\Renishaw\\WiRE [^\\]+/gi,
      newRoot
    );
    if (updatedText !== originalText) {
      if (updatedText.length > 255) {
        throw new Error('The discovered WiRE installation path is too long for this toolbar data format.');
      }
      const updatedString = Buffer.concat([
        Buffer.from([0xff, 0xfe, 0xff, updatedText.length]),
        Buffer.from(updatedText, 'utf16le')
      ]);
      data = Buffer.concat([
        data.subarray(0, offset),
        updatedString,
        data.subarray(stringEnd)
      ]);
      offset += updatedString.length;
      replacements += 1;
    } else {
      offset = stringEnd;
    }
  }
  if (replacements !== 8) {
    throw new Error(`Expected 8 version-specific WiRE paths in the toolbar template; found ${replacements}.`);
  }
  return data.toString('hex');
}

async function restoreCleanupToolbar({ registryPath, installDirectory, targetIndex, overwrite }) {
  requireWindows();
  if (targetIndex !== 0 && targetIndex !== 1) throw new Error('Invalid toolbar target index.');
  if (typeof registryPath !== 'string') throw new Error('Select a discovered WiREInterface.exe registry key.');
  const found = await searchCleanupRegistry();
  const key = found.find((item) =>
    item.category === 'WiREInterface.exe' &&
    item.path.toLowerCase() === registryPath.toLowerCase()
  );
  if (!key) throw new Error('The WiREInterface.exe registry key was not found. Search the registry again.');

  const { installDirectory: foundInstallDirectory } = await findWireInstallation(installDirectory);
  const keyPath = `${key.path}\\Custom toolbar\\${targetIndex}`;
  const currentValue = await runReg(['query', keyPath, '/v', 'data']);
  if (currentValue !== null && !overwrite) {
    if (targetIndex === 0) {
      return {
        success: false,
        conflict: true,
        message: 'Custom toolbar\\0 already contains a data value. Choose whether to add it to slot 1, overwrite slot 0, or cancel.'
      };
    }
    throw new Error('Custom toolbar\\1 already contains a data value. It was not overwritten.');
  }

  const dataHex = relocateToolbarPaths(readToolbarTemplateHex(), foundInstallDirectory);
  await runReg([
    'add',
    keyPath,
    '/v',
    'data',
    '/t',
    'REG_BINARY',
    '/d',
    dataHex,
    '/f'
  ]);
}

async function deleteCleanupRegistry(requestedPaths) {
  requireWindows();
  if (!Array.isArray(requestedPaths) || requestedPaths.length === 0) {
    throw new Error('Select at least one discovered registry key to delete.');
  }
  const found = await searchCleanupRegistry();
  const approved = new Map(found.map((item) => [item.path.toLowerCase(), item.path]));
  const deleted = [];
  for (const requestedPath of requestedPaths) {
    if (typeof requestedPath !== 'string') throw new Error('Invalid registry path received.');
    const approvedPath = approved.get(requestedPath.toLowerCase());
    if (!approvedPath) {
      throw new Error(`Refusing to delete a registry key that was not found in the approved search: ${requestedPath}`);
    }
    try {
      await runReg(['delete', approvedPath, '/f']);
      deleted.push(approvedPath);
    } catch (error) {
      throw new Error(
        `Deleted ${deleted.length} registry key(s), then failed to delete "${approvedPath}": ${error.message}`
      );
    }
  }
  return deleted;
}

async function searchWireUninstallEntries() {
  requireWindows();
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    UNINSTALL_SCRIPT
  ], { windowsHide: true, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
  const parsed = stdout.trim() ? JSON.parse(stdout) : [];
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  return entries.filter((entry) => entry && /WiRE/i.test(entry.displayName || ''));
}

function parseWindowsArguments(value) {
  const args = [];
  const expression = /"((?:[^"\\]|\\.)*)"|(\S+)/g;
  let match;
  while ((match = expression.exec(value))) args.push(match[1] ?? match[2]);
  return args;
}

async function launchWireUninstall(registryPath) {
  requireWindows();
  if (typeof registryPath !== 'string') throw new Error('Invalid WiRE uninstall entry.');
  const entries = await searchWireUninstallEntries();
  const entry = entries.find((candidate) =>
    candidate.registryPath.toLowerCase() === registryPath.toLowerCase()
  );
  if (!entry || !/WiRE/i.test(entry.displayName)) {
    throw new Error('The selected WiRE uninstall entry was not found. Search again before launching it.');
  }
  const productCode = entry.productCode || entry.uninstallString.match(/\{[0-9A-Fa-f-]{36}\}/)?.[0];
  if (entry.windowsInstaller && /^\{[0-9A-Fa-f-]{36}\}$/.test(productCode || '')) {
    const child = spawn('msiexec.exe', ['/x', productCode], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    child.unref();
    return;
  }
  if (!entry.uninstallString) throw new Error('The registered WiRE uninstall command is empty.');

  let executable = '';
  let argumentText = '';
  const quoted = entry.uninstallString.trim().match(/^"([^"]+)"(?:\s+(.*))?$/);
  if (quoted) {
    executable = quoted[1];
    argumentText = quoted[2] || '';
  } else {
    const unquoted = entry.uninstallString.trim();
    const parts = unquoted.split(/\s+/);
    for (let index = parts.length; index > 0; index -= 1) {
      const candidate = parts.slice(0, index).join(' ');
      try {
        await fs.promises.access(candidate, fs.constants.F_OK);
        executable = candidate;
        argumentText = parts.slice(index).join(' ');
        break;
      } catch {
        // Continue looking for the longest existing executable prefix.
      }
    }
  }
  if (!executable || !path.win32.isAbsolute(executable)) {
    throw new Error('Could not safely resolve the registered WiRE uninstall executable.');
  }
  const child = spawn(executable, parseWindowsArguments(argumentText), {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  await new Promise((resolve, reject) => {
    child.once('spawn', resolve);
    child.once('error', reject);
  });
  child.unref();
}

module.exports = {
  searchCleanupFolders,
  deleteCleanupFolders,
  searchCleanupRegistry,
  deleteCleanupRegistry,
  restoreCleanupToolbar,
  searchWireUninstallEntries,
  launchWireUninstall
};
