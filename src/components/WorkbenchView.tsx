import React, { useState } from 'react';
import { useTraveller } from '../context/TravellerContext';
import { DataCollectionField } from './DataCollectionField';
import { SignatureModal } from './SignatureModal';
import { NCRModal } from './NCRModal';
import { PrintableRunSheetModal } from './PrintableRunSheetModal';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Wrench,
  FileSignature,
  FileText,
  ChevronRight,
  ChevronLeft,
  Info,
  Layers,
  ArrowUpRight,
  Check,
  AlertCircle
} from 'lucide-react';

export const WorkbenchView: React.FC = () => {
  const {
    activeTraveller,
    currentStepIndex,
    setCurrentStepIndex,
    currentStep,
    updateDataField,
    tools,
    verifyBOMItem,
  } = useTraveller();

  // Modals state
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isNCRModalOpen, setIsNCRModalOpen] = useState(false);
  const [isRunSheetOpen, setIsRunSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'data' | 'bom' | 'tools'>('instructions');

  if (!activeTraveller || !currentStep) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No active traveler selected. Select a traveler from the dashboard.</p>
      </div>
    );
  }

  // Calculate completion percentage
  const completedStepsCount = activeTraveller.steps.filter((s) => s.status === 'passed').length;
  const progressPercent = Math.round((completedStepsCount / activeTraveller.steps.length) * 100);

  // Calibrated tools for this step
  const stepTools = tools.filter((t) => currentStep.toolIds?.includes(t.id));

  // Check if step is signable
  const isStepPassed = currentStep.status === 'passed';
  const isStepBlocked = currentStep.status === 'ncr_blocked';

  return (
    <div className="space-y-4">
      {/* Unit & Traveler Master Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Unit Identification */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {activeTraveller.workOrderNumber}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                S/N: {activeTraveller.serialNumber}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {activeTraveller.revision}
              </span>
              <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                activeTraveller.status === 'completed'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : activeTraveller.status === 'quality_hold'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                  : activeTraveller.status === 'rework'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-blue-950 text-blue-300 border border-blue-700'
              }`}>
                {activeTraveller.status.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                LOT: {activeTraveller.lotNumber}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {activeTraveller.partName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>P/N: <strong className="text-slate-200 font-mono">{activeTraveller.partNumber}</strong></span>
              <span>Customer: <strong className="text-slate-200">{activeTraveller.customer}</strong></span>
              <span>Program: <strong className="text-slate-200">{activeTraveller.program}</strong></span>
            </div>
          </div>

          {/* Action Buttons & Progress */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:w-44 space-y-1">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Routing Progress</span>
                <span className="text-white font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-right">
                {completedStepsCount} of {activeTraveller.steps.length} ops signed
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsRunSheetOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="View printable Certificate of Conformance and traveler routing sheet"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Run Sheet</span>
              </button>

              <button
                onClick={() => setIsNCRModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold border border-rose-800/80 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Raise NCR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quality Hold Notice Banner */}
        {activeTraveller.status === 'quality_hold' && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong>TRAVELER ON QUALITY HOLD:</strong> Unit cannot advance until open Non-Conformance Reports (NCRs) are formally dispositioned by QA/MRB.
              </div>
            </div>
            <button
              onClick={() => setIsNCRModalOpen(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold shrink-0 transition-colors"
            >
              Review NCR
            </button>
          </div>
        )}
      </div>

      {/* Step Sequence Timeline Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {activeTraveller.steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isPassed = step.status === 'passed';
            const isBlocked = step.status === 'ncr_blocked';

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  isCurrent
                    ? 'bg-blue-600/30 text-white border-blue-500 shadow-sm ring-1 ring-blue-500/50'
                    : isPassed
                    ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/50 hover:bg-emerald-950/50'
                    : isBlocked
                    ? 'bg-rose-950/30 text-rose-300 border-rose-800/50 hover:bg-rose-950/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full font-mono text-[10px] font-bold">
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isBlocked ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <span className={isCurrent ? 'text-blue-400' : 'text-slate-500'}>{idx + 1}</span>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-mono text-[11px] font-bold">{step.opCode}</div>
                  <div className="text-[10px] text-slate-300 truncate max-w-[120px] sm:max-w-[160px]">
                    {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Step Execution Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {/* Step Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                {currentStep.opCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {currentStep.workCenter}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-blue-400 font-mono">
                Req: {currentStep.requiredSkill}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {currentStep.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Est: {currentStep.estimatedMinutes} min
            </span>

            {isStepPassed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                STAMPED &amp; COMPLETE
              </span>
            )}
          </div>
        </div>

        {/* Step Sub-tabs */}
        <div className="border-b border-slate-800 bg-slate-950/40 px-4 flex gap-4">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'instructions'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Work Instructions &amp; SOP
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Data Collection</span>
            {currentStep.dataFields.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 font-mono">
                {currentStep.dataFields.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bom')}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'bom'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Traceability / BOM</span>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Calibrated Tools</span>
            {stepTools.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {stepTools.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5">
          {activeTab === 'instructions' && (
            <div className="space-y-4">
              {/* Safety Cautions Alert if applicable */}
              {currentStep.safetyCautions && currentStep.safetyCautions.length > 0 && (
                <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    SAFETY / ESD WARNING:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-slate-200">
                    {currentStep.safetyCautions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Numbered SOP list */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Standard Operating Procedures:
                </h4>
                <div className="space-y-2">
                  {currentStep.instructions.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-start gap-3 text-xs leading-relaxed text-slate-200"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center font-mono font-bold shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span>{inst}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data fields preview hint */}
              {currentStep.dataFields.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300 flex items-center justify-between">
                  <span>This step requires {currentStep.dataFields.length} parametric / verification entries.</span>
                  <button
                    onClick={() => setActiveTab('data')}
                    className="text-xs font-bold underline hover:text-blue-200"
                  >
                    Switch to Data Collection →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Parametric Measurements &amp; Data Collection:
                </h4>
                <span className="text-[11px] text-slate-400">
                  Tolerance limits enforced in real-time
                </span>
              </div>

              {currentStep.dataFields.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950 rounded-lg border border-slate-800">
                  No parametric measurements required for this operation. Complete visual instructions and sign off.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentStep.dataFields.map((field) => (
                    <DataCollectionField
                      key={field.id}
                      field={field}
                      disabled={isStepPassed}
                      onChange={(val) => updateDataField(currentStep.id, field.id, val)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Assembly Bill of Materials &amp; Lot Traceability:
                </h4>
                <span className="text-[11px] text-slate-400">
                  Verify manufacturer lot codes against incoming kit
                </span>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 font-mono text-slate-400 text-[11px]">
                      <th className="p-2.5">Ref Des</th>
                      <th className="p-2.5">Manufacturer Part #</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Lot Number</th>
                      <th className="p-2.5 text-center">Traceability Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {activeTraveller.bom.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-950/40">
                        <td className="p-2.5 font-bold text-blue-400">{item.referenceDesignator}</td>
                        <td className="p-2.5 text-slate-200">{item.partNumber}</td>
                        <td className="p-2.5 text-slate-400 font-sans max-w-xs">{item.description}</td>
                        <td className="p-2.5 text-amber-400">{item.lotNumber || '—'}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => verifyBOMItem(item.id, !item.verified)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              item.verified
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {item.verified ? '✓ VERIFIED' : 'CLICK TO VERIFY'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Assigned Calibrated Equipment for this Operation:
              </h4>

              {stepTools.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-950 rounded-lg border border-slate-800">
                  Standard hand tools only; no NIST-calibrated instrumentation required for this step.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stepTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-blue-400">{tool.toolNumber}</div>
                        <div className="text-white font-semibold">{tool.name}</div>
                        <div className="text-slate-400 text-[11px]">Model: {tool.model}</div>
                        <div className="text-slate-400 text-[11px]">Location: {tool.location}</div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          tool.status === 'valid'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : tool.status === 'expiring_soon'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {tool.status.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Cal Due: {tool.calibrationDueDate}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stamped electronic signature card if already passed */}
          {currentStep.signature && (
            <div className="mt-5 p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Step Certified by {currentStep.signature.technicianName} ({currentStep.signature.badgeId})
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Stamped: {new Date(currentStep.signature.timestamp).toLocaleString()} | Station: {currentStep.signature.stationId || currentStep.signature.station || 'Bench 04'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                AUDIT RECORD # {currentStep.signature.signatureDataUrl?.slice(0, 24)}
              </span>
            </div>
          )}
        </div>

        {/* Step Action Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 text-xs font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Op</span>
            </button>
            <button
              disabled={currentStepIndex === activeTraveller.steps.length - 1}
              onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 text-xs font-medium transition-colors"
            >
              <span>Next Op</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNCRModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-800/80 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Flag Non-Conformance</span>
            </button>

            {!isStepPassed ? (
              <button
                disabled={isStepBlocked}
                onClick={() => setIsSignModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold shadow-md transition-colors"
              >
                <FileSignature className="w-4 h-4" />
                <span>Sign Off Operation</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                COMPLETED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureModal
        step={currentStep}
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSuccess={() => setIsSignModalOpen(false)}
      />

      {/* NCR Modal */}
      <NCRModal
        step={currentStep}
        isOpen={isNCRModalOpen}
        onClose={() => setIsNCRModalOpen(false)}
      />

      {/* Printable Run Sheet Modal */}
      <PrintableRunSheetModal
        traveller={activeTraveller}
        isOpen={isRunSheetOpen}
        onClose={() => setIsRunSheetOpen(false)}
      />
    </div>
  );
};
