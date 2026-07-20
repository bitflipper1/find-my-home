import { useState } from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Shield, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SEVERITY_PALETTE } from '../../../../shared/leaseback-math.js';

const ICONS = { critical: AlertOctagon, high: AlertTriangle, medium: AlertCircle, standing: Shield };
const ORDER = { critical: 0, high: 1, medium: 2, standing: 3 };

// Zone 3: fired flags first by severity, each expandable. Unfired flags
// collapse into "checked and clear" so it is visible what was evaluated.
// Colors come from SEVERITY_PALETTE, whose AA contrast is pinned by a test;
// severity is never conveyed by color alone (icon + label + border).
export default function RedFlags({ flags }) {
  const [open, setOpen] = useState({});
  const [showClear, setShowClear] = useState(false);
  const fired = flags.filter(f => f.fired).sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  const clear = flags.filter(f => !f.fired);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Red flags</h3>
      <div className="space-y-2">
        {fired.map(f => {
          const p = SEVERITY_PALETTE[f.severity].tailwind;
          const Icon = ICONS[f.severity];
          const isOpen = open[f.id];
          return (
            <div key={f.id} className={`rounded-lg border-l-4 ${p.border} ${p.bg}`}>
              <button onClick={() => setOpen(o => ({ ...o, [f.id]: !o[f.id] }))}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left ${p.text}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold flex-1">{f.title}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{f.severity}</span>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {isOpen && <p className={`px-3 pb-3 text-xs leading-relaxed ${p.text}`}>{f.why}</p>}
            </div>
          );
        })}
      </div>
      <button onClick={() => setShowClear(s => !s)}
        className="mt-3 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
        {showClear ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Checked and clear ({clear.length})
      </button>
      {showClear && (
        <ul className="mt-2 space-y-1">
          {clear.map(f => (
            <li key={f.id} className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {f.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
