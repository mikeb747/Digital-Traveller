import React, { useState } from 'react';
import { useTraveller } from '../context/TravellerContext';
import { PlusCircle, X, FileSpreadsheet } from 'lucide-react';

interface NewTravellerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTravellerModal: React.FC<NewTravellerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createTraveller } = useTraveller();

  const [workOrderNumber, setWorkOrderNumber] = useState(`WO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [partNumber, setPartNumber] = useState('PN-CTRL-5500');
  const [partName, setPartName] = useState('Mission Avionics Telemetry Controller');
  const [revision, setRevision] = useState('Rev A');
  const [serialNumber, setSerialNumber] = useState(`SN-MAT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [lotNumber, setLotNumber] = useState('LOT-2026-W40');
  const [program, setProgram] = useState('Commercial Space Launch Vehicle');
  const [customer, setCustomer] = useState('Starlight Aerospace Systems');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'aog_critical'>('urgent');
  const [targetCompletionDate, setTargetCompletionDate] = useState('2026-10-05');
  const [notes, setNotes] = useState('Flight-critical hardware. Require Class 3 IPC assembly and full CoC documentation.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createTraveller({
      workOrderNumber,
      partNumber,
      partName,
      revision,
      serialNumber,
      lotNumber,
      program,
      customer,
      priority,
      targetCompletionDate,
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Release New Digital Traveler</h3>
              <p className="text-xs text-slate-400">Initialize shop floor work order routing &amp; serialization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Order # (WO)
              </label>
              <input
                type="text"
                required
                value={workOrderNumber}
                onChange={(e) => setWorkOrderNumber(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unit Serial Number (S/N)
              </label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Part Number (P/N)
              </label>
              <input
                type="text"
                required
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Drawing Revision
              </label>
              <input
                type="text"
                required
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Part Description / Nomenclature
            </label>
            <input
              type="text"
              required
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Production Lot #
              </label>
              <input
                type="text"
                required
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Routing Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="routine">Routine Standard (5-7 Days)</option>
                <option value="urgent">Urgent Expedited (48 Hours)</option>
                <option value="aog_critical">AOG Critical (Aircraft On Ground / Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer / End User
              </label>
              <input
                type="text"
                required
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Ship Date
              </label>
              <input
                type="date"
                required
                value={targetCompletionDate}
                onChange={(e) => setTargetCompletionDate(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Shop Floor Special Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Spawn Traveler Routing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
