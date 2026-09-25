import React from 'react';
import { DigitalTraveller } from '../types';
import { Printer, X, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

interface PrintableRunSheetModalProps {
  traveller: DigitalTraveller;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableRunSheetModal: React.FC<PrintableRunSheetModalProps> = ({
  traveller,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isComplete = traveller.status === 'completed';
  const openNCRs = traveller.ncrs.filter((n) => n.status === 'open' || n.status === 'under_review');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden text-slate-100 max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:w-full print:bg-white print:text-black print:max-h-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-sm">
              Certificate of Conformance &amp; Digital Traveler Run Sheet
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 font-sans bg-slate-950 text-slate-100 print:bg-white print:text-black print:p-6 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b-2 border-slate-700 print:border-black pb-4 mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold tracking-tight text-white print:text-black font-mono">
                PRECISION HARDWARE MANUFACTURING
              </div>
              <div className="text-xs text-slate-400 print:text-gray-600">
                Quality Management System certified to AS9100D / ISO 9001:2015
              </div>
              <div className="text-sm font-semibold mt-2 text-blue-400 print:text-blue-800">
                DIGITAL TRAVELLER &amp; ROUTING RUN SHEET
              </div>
            </div>

            <div className="text-right font-mono text-xs space-y-1">
              <div>WO #: <strong className="text-white print:text-black text-sm">{traveller.workOrderNumber}</strong></div>
              <div>SERIAL #: <strong className="text-blue-400 print:text-blue-900 text-sm">{traveller.serialNumber}</strong></div>
              <div>DATE: {new Date().toISOString().slice(0, 10)}</div>
            </div>
          </div>

          {/* Unit Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/80 border border-slate-800 print:bg-gray-50 print:border-gray-300 text-xs mb-6">
            <div>
              <span className="text-slate-400 print:text-gray-500 block uppercase text-[10px] font-mono">Part Number</span>
              <strong className="text-white print:text-black font-mono">{traveller.partNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-500 block uppercase text-[10px] font-mono">Revision</span>
              <strong className="text-white print:text-black font-mono">{traveller.revision}</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-500 block uppercase text-[10px] font-mono">Lot Number</span>
              <strong className="text-white print:text-black font-mono">{traveller.lotNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 print:text-gray-500 block uppercase text-[10px] font-mono">Customer</span>
              <strong className="text-white print:text-black">{traveller.customer}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 print:text-gray-500 block uppercase text-[10px] font-mono">Nomenclature</span>
              <strong className="text-white print:text-black">{traveller.partName}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 print:text-gray-500 block uppercase text-[10px] font-mono">Program</span>
              <strong className="text-white print:text-black">{traveller.program}</strong>
            </div>
          </div>

          {/* Conformance Certification Statement */}
          <div className="p-3 rounded-lg border border-slate-700 print:border-gray-400 bg-slate-900/40 print:bg-white text-xs mb-6">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 print:text-emerald-800 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Certificate of Conformance (CoC)</span>
            </div>
            <p className="text-slate-300 print:text-gray-700 leading-relaxed text-[11px]">
              This certifies that the article identified above has been manufactured, inspected, and tested in full accordance with the approved engineering drawings, specifications, and purchase order requirements. All materials utilized conform to specified chemical and physical properties, and test equipment employed maintains current NIST-traceable calibration.
            </p>
          </div>

          {/* Sequential Operations Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider mb-2 font-mono">
              Manufacturing &amp; Test Routing History:
            </h4>
            <div className="border border-slate-800 print:border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 print:bg-gray-200 border-b border-slate-800 print:border-gray-300 font-mono text-[11px] text-slate-300 print:text-black">
                    <th className="p-2.5">Op Code</th>
                    <th className="p-2.5">Operation Description</th>
                    <th className="p-2.5">Work Center</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Electronic Stamp</th>
                    <th className="p-2.5">Completed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                  {traveller.steps.map((step) => (
                    <tr key={step.id} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                      <td className="p-2.5 font-mono font-bold text-blue-400 print:text-blue-900">
                        {step.opCode}
                      </td>
                      <td className="p-2.5">
                        <div className="font-semibold text-white print:text-black">{step.title}</div>
                        {/* Parametric Data summary */}
                        {step.dataFields.length > 0 && (
                          <div className="mt-1 space-y-0.5 text-[10px] font-mono text-slate-400 print:text-gray-600">
                            {step.dataFields.map((f) => (
                              <div key={f.id}>
                                • {f.label}:{' '}
                                <strong className="text-slate-200 print:text-black">
                                  {f.value !== undefined ? String(f.value) : 'PENDING'}
                                </strong>
                                {f.unit ? ` ${f.unit}` : ''}
                                {f.isWithinSpec === true && ' [PASS]'}
                                {f.isWithinSpec === false && ' [FAIL]'}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-300 print:text-gray-700">{step.workCenter}</td>
                      <td className="p-2.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          step.status === 'passed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 print:text-green-800 print:bg-green-100'
                            : step.status === 'in_progress'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : step.status === 'ncr_blocked'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {step.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">
                        {step.signature ? (
                          <div>
                            <span className="font-semibold text-emerald-400 print:text-emerald-800">
                              {step.signature.technicianName}
                            </span>
                            <span className="text-[10px] text-slate-400 print:text-gray-600 block">
                              ID: {step.signature.badgeId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Not stamped</span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-300 print:text-gray-700">
                        {step.completedAt ? step.completedAt.slice(0, 16).replace('T', ' ') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discrepancies / NCR Section if any */}
          {traveller.ncrs.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-amber-400 print:text-amber-900 uppercase tracking-wider mb-2 font-mono">
                Discrepancy &amp; NCR History:
              </h4>
              <div className="space-y-2">
                {traveller.ncrs.map((ncr) => (
                  <div key={ncr.id} className="p-2.5 rounded border border-amber-800/80 bg-amber-950/20 print:bg-amber-50 print:border-amber-300 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <strong>{ncr.id} (Op {ncr.stepOpCode})</strong>
                      <span className="uppercase text-[10px] font-bold text-amber-300 print:text-amber-800">
                        Status: {ncr.status} | Severity: {ncr.severity}
                      </span>
                    </div>
                    <div className="text-slate-300 print:text-gray-800 mt-1">{ncr.description}</div>
                    {ncr.disposition && (
                      <div className="mt-1 pt-1 border-t border-amber-800/40 text-[11px] text-slate-400 print:text-gray-600">
                        Disposition: <strong className="text-amber-200 print:text-black uppercase">{ncr.disposition}</strong> by {ncr.dispositionedBy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures & Stamps Footer */}
          <div className="border-t-2 border-slate-700 print:border-black pt-4 grid grid-cols-2 gap-8 text-xs font-mono">
            <div>
              <div className="text-slate-400 print:text-gray-600 mb-6 uppercase text-[10px]">Quality Inspector Signature:</div>
              <div className="border-b border-slate-600 print:border-black pb-1">
                {isComplete ? 'Sarah Chen (QA-209) [E-STAMPED]' : '_______________________'}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500 mt-1">AS9100 Authorized Inspector</div>
            </div>
            <div>
              <div className="text-slate-400 print:text-gray-600 mb-6 uppercase text-[10px]">Lead Manufacturing Tech Signature:</div>
              <div className="border-b border-slate-600 print:border-black pb-1">
                {traveller.assignedTechnician || 'Mike Brown (TECH-747) [E-STAMPED]'}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-500 mt-1">IPC-A-610 Class 3 Lead</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
