import React from 'react';
import { DataCollectionField as FieldType } from '../types';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface DataCollectionFieldProps {
  field: FieldType;
  onChange: (value: string | number | boolean) => void;
  disabled?: boolean;
}

export const DataCollectionField: React.FC<DataCollectionFieldProps> = ({
  field,
  onChange,
  disabled = false,
}) => {
  const isNumeric = field.type === 'numeric';
  const hasValue = field.value !== undefined && field.value !== '';

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      hasValue && field.isWithinSpec === true
        ? 'bg-emerald-950/20 border-emerald-800/60'
        : hasValue && field.isWithinSpec === false
        ? 'bg-rose-950/25 border-rose-800/80'
        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <span>{field.label}</span>
            {field.required && <span className="text-amber-400 font-mono text-[10px]">*REQ</span>}
          </label>

          {/* Tolerance specs badge if numeric */}
          {isNumeric && (
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-2">
              {field.nominal !== undefined && (
                <span>Nominal: <strong className="text-slate-300">{field.nominal} {field.unit}</strong></span>
              )}
              {field.min !== undefined && field.max !== undefined && (
                <span className="text-slate-400">
                  Spec: [{field.min} .. {field.max}] {field.unit}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Spec status indicator badge */}
        {hasValue && (
          <div>
            {field.isWithinSpec === true ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                PASS
              </span>
            ) : field.isWithinSpec === false ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/60 text-rose-300 border border-rose-700/60 font-mono animate-pulse">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                OUT OF SPEC
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800">
                RECORDED
              </span>
            )}
          </div>
        )}
      </div>

      {/* Input controls based on type */}
      <div className="mt-2">
        {field.type === 'numeric' && (
          <div className="relative flex items-center">
            <input
              type="number"
              step="any"
              disabled={disabled}
              value={field.value !== undefined ? String(field.value) : ''}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                onChange(val);
              }}
              placeholder={`Enter value in ${field.unit || 'units'}...`}
              className={`w-full bg-slate-950 px-3 py-1.5 text-sm rounded font-mono border focus:outline-none transition-colors ${
                hasValue && field.isWithinSpec === false
                  ? 'border-rose-600 text-rose-200 focus:border-rose-500'
                  : hasValue && field.isWithinSpec === true
                  ? 'border-emerald-600/70 text-emerald-200 focus:border-emerald-500'
                  : 'border-slate-700 text-slate-100 focus:border-blue-500'
              } disabled:opacity-50`}
            />
            {field.unit && (
              <span className="absolute right-3 text-xs font-mono text-slate-400 pointer-events-none">
                {field.unit}
              </span>
            )}
          </div>
        )}

        {field.type === 'boolean' && (
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={disabled}
              checked={Boolean(field.value)}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <span className="text-xs text-slate-300">
              {field.value ? 'Verified conforming per SOP requirements' : 'Check to verify and sign-off milestone'}
            </span>
          </label>
        )}

        {field.type === 'select' && field.options && (
          <select
            disabled={disabled}
            value={field.value !== undefined ? String(field.value) : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-950 px-3 py-1.5 text-sm rounded border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 font-sans disabled:opacity-50"
          >
            <option value="">-- Select Conformance Result --</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {field.type === 'text' && (
          <input
            type="text"
            disabled={disabled}
            value={field.value !== undefined ? String(field.value) : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Scan barcode or type serial / lot number..."
            className="w-full bg-slate-950 px-3 py-1.5 text-sm rounded font-mono border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        )}
      </div>

      {/* Recorded by metadata line */}
      {hasValue && field.recordedBy && (
        <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Tech: {field.recordedBy}</span>
          {field.recordedAt && (
            <span>{new Date(field.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      )}
    </div>
  );
};
