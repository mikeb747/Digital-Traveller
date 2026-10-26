import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Database,
  FileSearch,
  Folder,
  LoaderCircle,
  RotateCcw,
  Trash2,
  Unplug
} from 'lucide-react';
import type {
  CleanupFolder,
  CleanupRegistryKey,
  WireUninstallEntry
} from '../types/electron';

interface PcCleanupPanelProps {
  theme: 'dark' | 'light';
}

export const PcCleanupPanel: React.FC<PcCleanupPanelProps> = ({ theme }) => {
  const [folders, setFolders] = useState<CleanupFolder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [archiveFolders, setArchiveFolders] = useState<CleanupFolder[]>([]);
  const [selectedArchiveFolders, setSelectedArchiveFolders] = useState<string[]>([]);
  const [restoreInstallDirectory, setRestoreInstallDirectory] = useState('');
  const [registryKeys, setRegistryKeys] = useState<CleanupRegistryKey[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [uninstallEntries, setUninstallEntries] = useState<WireUninstallEntry[]>([]);
  const [selectedUninstall, setSelectedUninstall] = useState('');
  const [restoreTarget, setRestoreTarget] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toolbarConflict, setToolbarConflict] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const isDesktop = Boolean(window.desktopAPI);
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const panel = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const input = isDark
    ? 'bg-slate-950 border-slate-700 text-slate-100'
    : 'bg-white border-slate-300 text-slate-900';
  const button = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50';

  const runAction = async <T,>(
    name: string,
    action: () => Promise<
      { success: true; data: T; message?: string } |
      { success: false; error: string }
    >,
    onSuccess: (data: T) => void,
    successText: string
  ) => {
    if (!window.desktopAPI) {
      setMessage({ type: 'error', text: 'PC cleanup is available in the Windows desktop app only.' });
      return;
    }
    setBusyAction(name);
    setMessage(null);
    try {
      const result = await action();
      if (!result.success) {
        setMessage({ type: 'error', text: result.error });
        return;
      }
      onSuccess(result.data);
      setMessage({ type: 'success', text: result.message || successText });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'The cleanup action failed.'
      });
    } finally {
      setBusyAction(null);
    }
  };

  const searchFolders = () => runAction(
    'search-folders',
    () => window.desktopAPI!.searchCleanupFolders(),
    (results) => {
      setFolders(results);
      setSelectedFolders([]);
      setRestoreInstallDirectory(results.find((folder) => folder.category === 'WiRE installation')?.path || '');
    },
    'Folder search completed.'
  );

  const searchArchiveFolders = () => runAction(
    'search-archive-folders',
    () => window.desktopAPI!.searchArchiveSystemResults(),
    (results) => {
      setArchiveFolders(results);
      setSelectedArchiveFolders([]);
    },
    'System results search completed.'
  );

  const archiveSelectedFolders = () => {
    if (selectedArchiveFolders.length === 0 || !window.confirm(
      `Move ${selectedArchiveFolders.length} selected system results folder(s) into Documents\\Archive?`
    )) return;
    void runAction(
      'archive-system-results',
      () => window.desktopAPI!.archiveSystemResults(selectedArchiveFolders),
      (moved) => {
        setArchiveFolders((current) => current.filter((folder) => !moved.includes(folder.path)));
        setSelectedArchiveFolders([]);
      },
      'Selected system results moved to Documents\\Archive.'
    );
  };

  const deleteFolders = () => {
    if (selectedFolders.length === 0 || !window.confirm(
      `Permanently delete ${selectedFolders.length} selected folder(s) and their contents?`
    )) return;
    void runAction(
      'delete-folders',
      () => window.desktopAPI!.deleteCleanupFolders(selectedFolders),
      (deleted) => {
        setFolders((current) => current.filter((folder) => !deleted.includes(folder.path)));
        setRestoreInstallDirectory((current) => deleted.includes(current)
          ? folders.find((folder) =>
            folder.category === 'WiRE installation' && !deleted.includes(folder.path)
          )?.path || ''
          : current
        );
        setSelectedFolders([]);
      },
      'Selected folders deleted.'
    );
  };

  const searchRegistry = () => runAction(
    'search-registry',
    () => window.desktopAPI!.searchCleanupRegistry(),
    (results) => {
      setRegistryKeys(results);
      setSelectedKeys([]);
      setRestoreTarget(results.find((key) => key.category === 'WiREInterface.exe')?.path || '');
    },
    'Registry search completed.'
  );

  const deleteRegistry = () => {
    if (selectedKeys.length === 0 || !window.confirm(
      `Permanently delete ${selectedKeys.length} selected Renishaw registry key(s)?`
    )) return;
    void runAction(
      'delete-registry',
      () => window.desktopAPI!.deleteCleanupRegistry(selectedKeys),
      (deleted) => {
        setRegistryKeys((current) => current.filter((key) => !deleted.includes(key.path)));
        setSelectedKeys([]);
      },
      'Selected registry keys deleted.'
    );
  };

  const restoreToolbar = async () => {
    if (!restoreTarget || !window.desktopAPI) return;
    setBusyAction('restore-toolbar');
    setMessage(null);
    try {
      const result = await window.desktopAPI.restoreCleanupToolbar(
        restoreTarget,
        restoreInstallDirectory,
        0,
        false
      );
      if (!result.success && result.conflict) {
        setToolbarConflict(result.message);
      } else if (!result.success) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setMessage({ type: 'success', text: result.message || 'Toolbar setting restored.' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'The toolbar setting could not be restored.'
      });
    } finally {
      setBusyAction(null);
    }
  };

  const applyToolbarChoice = (targetIndex: 0 | 1) => {
    if (!restoreTarget || !window.desktopAPI) return;
    setToolbarConflict(null);
    setBusyAction(`restore-toolbar-${targetIndex}`);
    setMessage(null);
    void window.desktopAPI.restoreCleanupToolbar(
      restoreTarget,
      restoreInstallDirectory,
      targetIndex,
      targetIndex === 0
    ).then((result) => {
      if (!result.success) {
        setMessage({
          type: 'error',
          text: result.conflict ? result.message : result.error
        });
        return;
      }
      setMessage({
        type: 'success',
        text: result.message || `Toolbar data ${targetIndex === 0 ? 'overwritten in' : 'added to'} Custom toolbar\\${targetIndex}.`
      });
    }).catch((error: unknown) => {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'The toolbar setting could not be restored.'
      });
    }).finally(() => setBusyAction(null));
  };

  const searchUninstallEntries = () => runAction(
    'search-uninstall',
    () => window.desktopAPI!.searchWireUninstallEntries(),
    (results) => {
      setUninstallEntries(results);
      setSelectedUninstall(results[0]?.registryPath || '');
    },
    'Installed WiRE programs searched.'
  );

  const launchUninstall = () => {
    const entry = uninstallEntries.find((item) => item.registryPath === selectedUninstall);
    if (!entry || !window.confirm(`Open the Windows uninstaller for "${entry.displayName}"?`)) return;
    void runAction(
      'uninstall',
      () => window.desktopAPI!.launchWireUninstall(entry.registryPath),
      () => undefined,
      'Windows uninstaller started.'
    );
  };

  const killWireProcesses = () => {
    if (!window.confirm(
      'Force close running WiRE subsystem processes? Any unsaved work in those programs will be lost.'
    )) return;
    void runAction(
      'kill-wire-processes',
      () => window.desktopAPI!.killWireProcesses(),
      () => undefined,
      'Nothing to kill.'
    );
  };

  const toggleSelected = (
    current: string[],
    value: string,
    update: (next: string[]) => void
  ) => update(current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
  );

  const renderList = (
    items: Array<{ path: string; category: string }>,
    selected: string[],
    onToggle: (path: string) => void
  ) => items.length === 0 ? (
    <p className={`text-sm ${muted}`}>No results. Run the search to check this PC.</p>
  ) : (
    <div className="max-h-48 space-y-2 overflow-y-auto">
      {items.map((item) => (
        <label key={item.path} className={`flex cursor-pointer items-start gap-2 rounded border p-2 ${input}`}>
          <input
            type="checkbox"
            checked={selected.includes(item.path)}
            onChange={() => onToggle(item.path)}
            className="mt-1 accent-blue-500"
          />
          <span className="min-w-0">
            <span className="block text-xs font-semibold">{item.category}</span>
            <code className="break-all text-xs">{item.path}</code>
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <div className={`flex-1 overflow-y-auto p-5 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <h1 className={`text-xl font-bold ${text}`}>Final PC Cleanup</h1>
          <p className={`mt-1 text-sm ${muted}`}>
            Search first, review each result, then run each cleanup action separately. Deletions are permanent.
          </p>
        </header>

        {!isDesktop && (
          <p className="rounded border border-amber-500/40 bg-amber-950/20 p-3 text-sm text-amber-500">
            PC cleanup is available in the Windows desktop app only.
          </p>
        )}
        {message && (
          <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            message.type === 'error'
              ? 'border-red-500/40 bg-red-950/20 text-red-400'
              : 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400'
          }`}>
            {message.type === 'error'
              ? <AlertTriangle className="mt-0.5 h-4 w-4" />
              : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
            <span>{message.text}</span>
          </div>
        )}

        <section className={`rounded-xl border p-4 ${panel}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`flex items-center gap-2 font-semibold ${text}`}><Unplug className="h-4 w-4" /> Uninstall WiRE</h2>
              <p className={`mt-1 text-xs ${muted}`}>Find registered WiRE uninstallers, then launch the selected Windows uninstaller.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={`${button} bg-red-700 text-white hover:bg-red-600`} disabled={!isDesktop || !!busyAction} onClick={killWireProcesses}>
                {busyAction === 'kill-wire-processes' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                Kill WiRE
              </button>
              <button className={`${button} bg-blue-600 text-white hover:bg-blue-500`} disabled={!isDesktop || !!busyAction} onClick={() => void searchUninstallEntries()}>
                {busyAction === 'search-uninstall' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                Find installed WiRE
              </button>
            </div>
          </div>
          {uninstallEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <select value={selectedUninstall} onChange={(event) => setSelectedUninstall(event.target.value)} className={`min-w-0 flex-1 rounded border px-2 py-2 text-xs ${input}`}>
                {uninstallEntries.map((entry) => (
                  <option key={entry.registryPath} value={entry.registryPath}>
                    {entry.displayName}{entry.displayVersion ? ` (${entry.displayVersion})` : ''}
                  </option>
                ))}
              </select>
              <button className={`${button} bg-amber-600 text-white hover:bg-amber-500`} disabled={!isDesktop || !!busyAction} onClick={launchUninstall}>
                <Unplug className="h-4 w-4" /> Open Windows uninstaller
              </button>
            </div>
          ) : (
            <p className={`text-sm ${muted}`}>No uninstall entries searched yet.</p>
          )}
        </section>

        <section className={`rounded-xl border p-4 ${panel}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`flex items-center gap-2 font-semibold ${text}`}><Archive className="h-4 w-4" /> Archive System Results</h2>
              <p className={`mt-1 text-xs ${muted}`}>Find system result folders in your Documents folder and move selected folders into Documents\Archive.</p>
            </div>
            <button className={`${button} bg-blue-600 text-white hover:bg-blue-500`} disabled={!isDesktop || !!busyAction} onClick={() => void searchArchiveFolders()}>
              {busyAction === 'search-archive-folders' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              Search results
            </button>
          </div>
          {renderList(archiveFolders, selectedArchiveFolders, (path) =>
            toggleSelected(selectedArchiveFolders, path, setSelectedArchiveFolders)
          )}
          <button className={`${button} mt-3 bg-amber-600 text-white hover:bg-amber-500`} disabled={!isDesktop || !!busyAction || selectedArchiveFolders.length === 0} onClick={archiveSelectedFolders}>
            <Archive className="h-4 w-4" /> Move selected to Archive
          </button>
        </section>

        <section className={`rounded-xl border p-4 ${panel}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`flex items-center gap-2 font-semibold ${text}`}><Folder className="h-4 w-4" /> WiRE folders</h2>
              <p className={`mt-1 text-xs ${muted}`}>Search the specified Renishaw install and user AppData locations.</p>
            </div>
            <button className={`${button} bg-blue-600 text-white hover:bg-blue-500`} disabled={!isDesktop || !!busyAction} onClick={() => void searchFolders()}>
              {busyAction === 'search-folders' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              Search folders
            </button>
          </div>
          {renderList(folders, selectedFolders, (path) => toggleSelected(selectedFolders, path, setSelectedFolders))}
          <button className={`${button} mt-3 bg-red-700 text-white hover:bg-red-600`} disabled={!isDesktop || !!busyAction || selectedFolders.length === 0} onClick={deleteFolders}>
            <Trash2 className="h-4 w-4" /> Delete selected folders
          </button>
        </section>

        <section className={`rounded-xl border p-4 ${panel}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`flex items-center gap-2 font-semibold ${text}`}><Database className="h-4 w-4" /> Renishaw registry keys</h2>
              <p className={`mt-1 text-xs ${muted}`}>Search the requested HKCU WiRE keys and HKLM Renishaw key.</p>
            </div>
            <button className={`${button} bg-blue-600 text-white hover:bg-blue-500`} disabled={!isDesktop || !!busyAction} onClick={() => void searchRegistry()}>
              {busyAction === 'search-registry' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              Search registry
            </button>
          </div>
          {renderList(registryKeys, selectedKeys, (path) => toggleSelected(selectedKeys, path, setSelectedKeys))}
          <button className={`${button} mt-3 bg-red-700 text-white hover:bg-red-600`} disabled={!isDesktop || !!busyAction || selectedKeys.length === 0} onClick={deleteRegistry}>
            <Trash2 className="h-4 w-4" /> Delete selected registry keys
          </button>
          {registryKeys.some((key) => key.category === 'WiREInterface.exe') && (
            <div className={`mt-5 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className={`font-semibold ${text}`}>Restore WiRE toolbar</h3>
              <p className={`my-2 text-xs ${muted}`}>Choose the discovered WiREInterface.exe key to restore the toolbar data.</p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={restoreTarget}
                  onChange={(event) => setRestoreTarget(event.target.value)}
                  className={`min-w-0 flex-1 rounded border px-2 py-2 text-xs ${input}`}
                >
                  {registryKeys.filter((key) => key.category === 'WiREInterface.exe').map((key) => (
                    <option key={key.path} value={key.path}>{key.path}</option>
                  ))}
                </select>
                <select
                  value={restoreInstallDirectory}
                  onChange={(event) => setRestoreInstallDirectory(event.target.value)}
                  className={`min-w-0 flex-1 rounded border px-2 py-2 text-xs ${input}`}
                  aria-label="WiRE installation directory used for toolbar paths"
                >
                  {folders.filter((folder) => folder.category === 'WiRE installation').map((folder) => (
                    <option key={folder.path} value={folder.path}>{folder.path}</option>
                  ))}
                </select>
                <button className={`${button} bg-emerald-700 text-white hover:bg-emerald-600`} disabled={!isDesktop || !!busyAction || !restoreTarget || !restoreInstallDirectory} onClick={() => void restoreToolbar()}>
                  <RotateCcw className="h-4 w-4" /> Restore toolbar data
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
      {toolbarConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`w-full max-w-lg rounded-xl border p-5 shadow-2xl ${panel}`}>
            <h2 className={`text-lg font-bold ${text}`}>Custom toolbar\0 already exists</h2>
            <p className={`my-3 text-sm ${muted}`}>{toolbarConflict}</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button className={`${button} bg-slate-600 text-white`} onClick={() => setToolbarConflict(null)}>Cancel</button>
              <button className={`${button} bg-amber-600 text-white`} onClick={() => applyToolbarChoice(1)}>Add data to Custom toolbar\1</button>
              <button className={`${button} bg-red-700 text-white`} onClick={() => applyToolbarChoice(0)}>Overwrite Custom toolbar\0</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
