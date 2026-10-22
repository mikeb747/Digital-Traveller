import React, { useState, useEffect } from 'react';
import { X, QrCode, Check, User, Briefcase, Hash, Tag } from 'lucide-react';
import { SystemType } from '../types/traveller';

interface BarcodeModalProps {
  isOpen: boolean;
  currentSerial: string;
  currentCustomerName?: string;
  currentJobNumber?: string;
  currentPartNumber?: string;
  currentSystem: SystemType;
  onClose: () => void;
  onUpdateDetails: (details: {
    serialNumber: string;
    customerName: string;
    jobNumber: string;
    partNumber: string;
  }) => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  currentSerial,
  currentCustomerName = '',
  currentJobNumber = '',
  currentPartNumber = '',
  currentSystem,
  onClose,
  onUpdateDetails
}) => {
  if (!isOpen) return null;

  const [inputSerial, setInputSerial] = useState(currentSerial);
  const [customerName, setCustomerName] = useState(currentCustomerName);
  const [jobNumber, setJobNumber] = useState(currentJobNumber);
  const [partNumber, setPartNumber] = useState(currentPartNumber);

  // Sync state whenever modal is opened
  useEffect(() => {
    setInputSerial(currentSerial);
    setCustomerName(currentCustomerName || '');
    setJobNumber(currentJobNumber || '');
    setPartNumber(currentPartNumber || '');
  }, [currentSerial, currentCustomerName, currentJobNumber, currentPartNumber, isOpen]);

  const prefix = currentSystem.toLowerCase() === 'invia' ? 'INV' : currentSystem.toUpperCase().slice(0, 3);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDetails({
      serialNumber: inputSerial.trim(),
      customerName: customerName.trim(),
      jobNumber: jobNumber.trim(),
      partNumber: partNumber.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              Scan Barcode / Serial Scanner
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-5 space-y-4 text-xs text-slate-300 max-h-[85vh] overflow-y-auto">
          {/* Direct hardware details form */}

          {/* Form Fields: Customer Name, Job Number, Part Number, Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Customer Name</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Renishaw Spectrometry Lab"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Job Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Job Number</span>
              </label>
              <input
                type="text"
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                placeholder="e.g. JOB-89421"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Part Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>Part Number</span>
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. PN-A700-01"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Instrument Serial Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  <span>Serial Number (S/N)</span>
                </label>

              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSerial}
                  onChange={(e) => setInputSerial(e.target.value)}
                  placeholder={`e.g. ${prefix}-102948`}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-amber-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-950/40 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
