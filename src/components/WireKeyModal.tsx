import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  WifiOff,
  Clock,
  Sparkles,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import { WireKeyService } from '../services/wireKeyService';

interface WireKeyModalProps {
  isOpen: boolean;
  initialSerialNumber?: string;
  theme?: 'dark' | 'light';
  onClose: () => void;
  onApplyKeyToNotes?: (key: string) => void;
}

export const WireKeyModal: React.FC<WireKeyModalProps> = ({
  isOpen,
  initialSerialNumber = '',
  theme = 'dark',
  onClose,
  onApplyKeyToNotes
}) => {
  if (!isOpen) return null;

  const [serialNumber, setSerialNumber] = useState(initialSerialNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    'empty' | 'network' | 'auth' | 'not_found' | 'timeout' | 'http' | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  const isDark = theme === 'dark';

  // Synchronize serial when opened
  useEffect(() => {
    if (initialSerialNumber) {
      setSerialNumber(initialSerialNumber);
    }
  }, [initialSerialNumber, isOpen]);

  const handleFetchKey = async () => {
    const cleanSn = serialNumber.trim();
    if (!cleanSn) {
      setErrorType('empty');
      setErrorMessage('Please enter an instrument serial number to generate a WiRE Key.');
      setGeneratedKey(null);
      return;
    }

    setIsLoading(true);
    setErrorType(null);
    setErrorMessage(null);
    setCopied(false);
    setApplied(false);

    try {
      // Call GetWireKey(serialNumber)
      const key = await WireKeyService.GetWireKey(cleanSn);
      setGeneratedKey(key);
      setIsSimulatedOffline(false);
      setErrorType(null);
      setErrorMessage(null);
    } catch (err: any) {
      const msg = err.message || '';
      console.warn('GetWireKey failed:', msg);

      if (msg.includes('Empty serial number')) {
        setErrorType('empty');
        setErrorMessage('Empty serial number. Please specify an instrument S/N.');
      } else if (msg.includes('Authentication failure')) {
        setErrorType('auth');
        setErrorMessage(
          'Authentication required on spd-apps. Please open the dashboard to authenticate your Windows session, then click Get WiRE Key again.'
        );
      } else if (msg.includes('Network timeout')) {
        setErrorType('timeout');
        setErrorMessage('Network timeout: spd-apps took too long to respond. Check VPN or intranet connection.');
      } else if (msg.includes('Key phrase not found')) {
        setErrorType('not_found');
        setErrorMessage('Response received from spd-apps, but <p id="phrase"> was missing or empty in the HTML.');
      } else if (msg.includes('HTTP error')) {
        setErrorType('http');
        setErrorMessage(msg);
      } else {
        // Cross-origin restriction in browser:
        setErrorType('network');
        setErrorMessage(
          'Browser security restricts background reading from spd-apps without CORS. Click the button below to submit S/N directly, or use the Desktop version for background retrieval.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Automatic clipboard listener: listens for a 4x6 key copied to clipboard
  const startClipboardListener = () => {
    if (typeof window === 'undefined' || !navigator.clipboard) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(interval);
        return;
      }
      try {
        if (document.hasFocus()) {
          const text = await navigator.clipboard.readText();
          const match = text.trim().match(/^[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$/);
          if (match) {
            setGeneratedKey(match[0]);
            setIsSimulatedOffline(false);
            setErrorType(null);
            setErrorMessage(null);
            clearInterval(interval);
          }
        }
      } catch {
        // Clipboard read permission might not be active, ignore
      }
    }, 1500);
  };

  // Helper function to programmatically submit POST form to spd-apps in a clean popup or tab
  const submitDirectForm = (snToSubmit: string) => {
    try {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://spd-apps/FeaturePermissions/generate';
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'sn';
      input.value = snToSubmit;

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      form.remove();
    } catch (e) {
      console.error('Failed to submit direct form', e);
    }
  };

  const handleGenerateFallback = () => {
    const cleanSn = serialNumber.trim();
    if (!cleanSn) return;
    const fallbackKey = WireKeyService.generateDeterministicKey(cleanSn);
    setGeneratedKey(fallbackKey);
    setIsSimulatedOffline(true);
    setErrorType(null);
    setErrorMessage(null);
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyToNotes = () => {
    if (!generatedKey || !onApplyKeyToNotes) return;
    onApplyKeyToNotes(generatedKey);
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between select-none ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Get WiRE Key
              </h3>
              <p className="text-[11px] text-slate-400">
                Generate feature permission key from spd-apps
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-black hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Instructions Banner */}
          <div
            className={`p-3.5 rounded-lg border leading-relaxed ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <p className="text-xs">
              Queries <code className="text-indigo-400 font-mono">https://spd-apps/FeaturePermissions/generate</code> with the instrument serial number (<code className="text-amber-400 font-mono">sn={serialNumber || '...'}</code>) and extracts the generated phrase key from <code className="text-emerald-400 font-mono">&lt;p id="phrase"&gt;</code>.
            </p>
          </div>

          {/* Serial Number Input & Action */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
              System Serial Number (S/N)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                placeholder="e.g. G42J99 or INV-892401"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-300 placeholder-slate-600 focus:outline-hidden focus:border-indigo-500 tracking-wider"
              />
              <button
                type="button"
                onClick={handleFetchKey}
                disabled={isLoading || !serialNumber.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow transition-colors"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying spd-apps...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Get WiRE Key</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-2 animate-in fade-in ${
                errorType === 'auth'
                  ? 'bg-rose-950/70 border-rose-800 text-rose-200'
                  : errorType === 'timeout'
                  ? 'bg-amber-950/70 border-amber-800 text-amber-200'
                  : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {errorType === 'auth' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                {errorType === 'network' && <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                {errorType === 'timeout' && <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                {errorType !== 'auth' && errorType !== 'network' && errorType !== 'timeout' && (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>

              {/* Offline Intranet Fallback Options */}
              {errorType === 'network' && (
                <div className="pt-2 border-t border-rose-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-300">
                    Testing on bench outside company network or previewing without intranet DNS?
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateFallback}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Generate WiRE Key Offline</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Generated Key Result Section */}
          {generatedKey && (
            <div
              className={`p-4 rounded-xl border space-y-3 animate-in zoom-in-95 duration-150 ${
                isDark ? 'bg-slate-950 border-emerald-500/50' : 'bg-emerald-50/50 border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WiRE Feature Permission Key</span>
                </span>
                {isSimulatedOffline && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    Offline Algorithm
                  </span>
                )}
              </div>

              {/* Large Key Display Box */}
              <div
                className={`p-3 rounded-lg border font-mono font-bold text-center text-sm sm:text-base select-all tracking-wider ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-emerald-300 shadow-inner'
                    : 'bg-white border-slate-300 text-emerald-700 shadow-inner'
                }`}
              >
                {generatedKey}
              </div>

              {/* Copy Key and Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  S/N: {serialNumber}
                </span>

                <div className="flex items-center space-x-2">
                  {onApplyKeyToNotes && (
                    <button
                      type="button"
                      onClick={handleApplyToNotes}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                    >
                      {applied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Added to Notes!</span>
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Save to Step Notes</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Intranet Reference Info & One-Click Dashboard Helper */}
          <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/40 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Renishaw Intranet (spd-apps)</span>
              </span>
              <a
                href="https://spd-apps/FeaturePermissions/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1"
              >
                Open Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Submit your serial number directly to <code className="text-slate-300 font-mono">spd-apps</code>:
            </p>

            <form
              action="https://spd-apps/FeaturePermissions/generate"
              method="POST"
              target="_blank"
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1"
            >
              <input type="hidden" name="sn" value={serialNumber} />
              <button
                type="submit"
                disabled={!serialNumber.trim()}
                className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in spd-apps with S/N ({serialNumber || '...'})</span>
              </button>
            </form>

            <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
              <div>
                <strong className="text-slate-300">Note:</strong> If the first click opens the dashboard, this initializes your intranet session; clicking a second time will display the generated key directly.
              </div>
              <div className="text-amber-400/90">
                ⚠️ Avoid <em>InPrivate/Incognito</em> mode when opening spd-apps (causes <strong>HTTP 401.2</strong> because private windows block Windows domain authentication).
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex justify-end ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isDark ? 'bg-slate-800 text-slate-200 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-black'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
