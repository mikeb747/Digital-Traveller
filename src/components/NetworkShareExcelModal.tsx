import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, Download, Upload, Folder, CheckCircle, Info, ExternalLink, HardDrive } from 'lucide-react';
import { TravellerRecord } from '../types/traveller';
import { ExcelService } from '../services/excelService';

interface NetworkShareExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  traveller: TravellerRecord;
  onUpdateTravellerFromExcel: (updated: TravellerRecord, message: string) => void;
}

const STORAGE_KEY_NETWORK_PATH = 'digital_traveller_network_share_path';

export const NetworkShareExcelModal: React.FC<NetworkShareExcelModalProps> = ({
  isOpen,
  onClose,
  traveller,
  onUpdateTravellerFromExcel
}) => {
  const [networkPath, setNetworkPath] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_KEY_NETWORK_PATH) ||
      '\\\\nas-prod\\Renishaw\\Spectroscopy\\Travellers'
    );
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NETWORK_PATH, networkPath);
  }, [networkPath]);

  if (!isOpen) return null;

  const suggestedFileName = `DigitalTraveller_${traveller.system}_${
    traveller.serialNumber ? traveller.serialNumber : 'Unassigned'
  }_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const handleExportExcel = () => {
    try {
      ExcelService.exportTravellerToExcel(traveller, suggestedFileName);
      setStatusMessage(`Successfully generated & saved "${suggestedFileName}". Copy this file directly to ${networkPath} or open in Excel.`);
      setIsError(false);
    } catch (err: any) {
      setStatusMessage(`Export failed: ${err.message || 'Unknown error'}`);
      setIsError(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const { updatedRecord, logs } = ExcelService.parseExcelFile(buffer, traveller);
        onUpdateTravellerFromExcel(
          updatedRecord,
          `Spreadsheet synced: ${logs.join(' | ')}`
        );
        setStatusMessage(`Successfully synchronized data from "${file.name}"!`);
        setIsError(false);
      } catch (err: any) {
        setStatusMessage(`Failed to read Excel file: ${err.message || 'Corrupt or unsupported format'}`);
        setIsError(true);
      }
    };
    reader.readAsArrayBuffer(file);
    setFileInputKey(Date.now());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Network Share Excel (.xlsx) Hub
              </h2>
              <p className="text-xs text-slate-400">
                Directly export, sync, and update traveler data via Excel workbooks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Network Path Config */}
          <div className="bg-slate-800/60 rounded-lg p-3.5 border border-slate-700/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                Network Share UNC Path / Drive Folder
              </label>
              <span className="text-[11px] text-slate-400">Windows UNC or Mapped Drive (e.g. Z:\)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={networkPath}
                onChange={(e) => setNetworkPath(e.target.value)}
                placeholder="\\server\share\Travellers or Z:\Production\Travellers"
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              In the packaged Electron desktop app, this folder can be directly watched and updated automatically.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Section */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
                  <Download className="w-4 h-4" />
                  Export to .xlsx Spreadsheet
                </div>
                <p className="text-xs text-slate-300">
                  Creates a multi-sheet Excel file with Overview, Workflow Steps, Measurements, Checklists, and Audit Trail.
                </p>
                <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-1.5 rounded truncate">
                  {suggestedFileName}
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Generate & Save Excel (.xlsx)
              </button>
            </div>

            {/* Import / Sync Section */}
            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs mb-1">
                  <Upload className="w-4 h-4" />
                  Import / Sync from .xlsx
                </div>
                <p className="text-xs text-slate-300">
                  Select an updated Excel file from your network share or drive to synchronize step statuses, notes, and measured values.
                </p>
              </div>
              <label className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                Load Excel File to Sync
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-md text-xs border flex items-start gap-2 ${
                isError
                  ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              }`}
            >
              {isError ? (
                <Info className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{statusMessage}</div>
            </div>
          )}

          {/* Desktop Electron Integration Info */}
          <div className="bg-slate-950/70 rounded-lg p-3.5 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <HardDrive className="w-4 h-4 text-blue-400" />
              Desktop App (.exe) Capability
            </div>
            <p className="text-[11px] leading-relaxed">
              When run as an <strong>Electron desktop application</strong> (using the included package scripts in the repo), the app gains direct operating system rights:
            </p>
            <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-300">
              <li>Directly read and write <code className="text-blue-300">.xlsx</code> files to your network shares without prompting file download dialogues.</li>
              <li>Support automatic background sync and concurrent file locking if multiple test stations share the same network folder.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
