import { Trophy } from 'lucide-react';

const usd = n => `$${Math.round(n).toLocaleString()}`;

// Zone 2: every rate option priced through the planned refi, penalties
// included, winner marked. The verdict sentences come from the math module
// so the UI cannot editorialize differently than the tests assert.
export default function RateDecisions({ analysis, refiMonths }) {
  const cmp = analysis.rateComparison;
  if (!cmp.options.length) return null;
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">Rate and credit decisions</h3>
      <p className="text-xs text-gray-500 mb-3">All-in cost through the planned refi at month {refiMonths || '—'}. Upfront costs, payment deltas, and prepayment penalties in one number.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="text-left font-medium py-2">Option</th>
              <th className="text-right font-medium">P&amp;I /mo</th>
              <th className="text-right font-medium">Upfront</th>
              <th className="text-right font-medium">Penalty at refi</th>
              <th className="text-right font-medium">Breakeven</th>
              <th className="text-right font-medium">Cost through refi</th>
            </tr>
          </thead>
          <tbody>
            {cmp.options.map(o => (
              <tr key={o.id} className={`border-b border-gray-50 ${o.id === cmp.winnerId ? 'bg-emerald-50/60' : ''}`}>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-1.5 font-medium text-gray-800">
                    {o.id === cmp.winnerId && <Trophy className="w-3.5 h-3.5 text-emerald-600" />}
                    {o.label}
                  </span>
                  {o.verdict && <span className="block text-xs text-gray-500 mt-0.5">{o.verdict}</span>}
                </td>
                <td className="text-right text-gray-700">{usd(o.pi)}</td>
                <td className="text-right text-gray-700">{o.upfrontCost ? usd(o.upfrontCost) : '—'}</td>
                <td className={`text-right ${o.penaltyCostAtRefi ? 'font-semibold text-red-700' : 'text-gray-500'}`}>
                  {o.penaltyCostAtRefi ? usd(o.penaltyCostAtRefi) : '—'}
                </td>
                <td className="text-right text-gray-700">{o.breakevenMonths ? `${Math.round(o.breakevenMonths)} mo` : '—'}</td>
                <td className={`text-right font-semibold ${o.id === cmp.winnerId ? 'text-emerald-700' : 'text-gray-900'}`}>{usd(o.costThroughRefi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {analysis.creditSensitivity.length > 0 && (
        <div className="mt-3 text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          {analysis.creditSensitivity.map(c => (
            <p key={c.label}>
              If <strong>{c.label}</strong> ({usd(c.amount)}) dies in re-underwriting, your effective cost rises to <strong>{usd(Math.abs(c.headlineWithout))}</strong>.
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
