import React from 'react';
import { useTraveller } from '../context/TravellerContext';
import { Gauge, AlertTriangle, CheckCircle2, Calendar, MapPin, Wrench } from 'lucide-react';

export const ToolCribView: React.FC = () => {
  const { tools } = useTraveller();

  const expiredCount = tools.filter((t) => t.status === 'expired').length;
  const expiringSoonCount = tools.filter((t) => t.status === 'expiring_soon').length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-400" />
            <span>Calibrated Tool &amp; Instrumentation Crib</span>
          </h2>
          <p className="text-xs text-slate-400">
            NIST Traceable calibration verification per ISO 17025 &amp; AS9100 requirements
          </p>
        </div>

        <div className="flex items-center gap-2">
          {expiredCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              {expiredCount} EXPIRED (LOCKOUT)
            </span>
          )}
          {expiringSoonCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-800 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {expiringSoonCount} EXPIRING &lt; 30 DAYS
            </span>
          )}
        </div>
      </div>

      {/* Warning lockout notice if expired tools present */}
      {expiredCount > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong>QUALITY LOCKOUT ACTIVE:</strong> Instruments with expired calibration must not be used on production hardware. Remove from bench and return to metrology calibration laboratory.
          </div>
        </div>
      )}

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              tool.status === 'expired'
                ? 'bg-rose-950/15 border-rose-800/80 shadow-rose-950/10'
                : tool.status === 'expiring_soon'
                ? 'bg-amber-950/15 border-amber-800/80 shadow-amber-950/10'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {tool.toolNumber}
                </span>

                <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                  tool.status === 'valid'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : tool.status === 'expiring_soon'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                }`}>
                  {tool.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white leading-tight">
                {tool.name}
              </h3>

              <div className="text-xs text-slate-400 space-y-1">
                <div>Type: <strong className="text-slate-300">{tool.type}</strong></div>
                <div>Model: <strong className="text-slate-300">{tool.model}</strong></div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{tool.location}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Last Calibrated:</span>
                <span>{tool.lastCalibrated}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Cal Due Date:</span>
                <span className={`font-bold ${
                  tool.status === 'expired'
                    ? 'text-rose-400'
                    : tool.status === 'expiring_soon'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {tool.calibrationDueDate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
