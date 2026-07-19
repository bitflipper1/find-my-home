import { useState } from 'react';
import { Copy, Check, Link2, AlertTriangle, X } from 'lucide-react';
import { dealSummaryText } from '../../../../shared/leaseback-math.js';
import { serializeDeal } from '../../../../shared/leaseback-url.js';

const usd = n => `$${Math.round(Math.abs(n)).toLocaleString()}`;
const signed = n => (n < 0 ? `+${usd(n)}` : `-${usd(n)}`); // cost shown as -, profit as +

function readVerdict(a) {
  const base = a.headline.base;
  const cf = a.monthlyCashFlow;
  if (cf >= 0 && base <= 0) return 'The builder pays you to own it through the leaseback. Take the deal seriously.';
  if (cf >= 0) return 'Rent covers the carry with room to spare; the leaseback works for you, not against you.';
  return 'You are subsidizing the builder\'s sales office every month. Negotiate the rent or walk.';
}

// Zone 1: the headline numbers and the one-sentence read, plus the two copy
// actions. Share links get a warning first: base64url is encoding, not
// encryption, and the payload is the full deal terms.
export default function VerdictPanel({ deal, analysis }) {
  const [copied, setCopied] = useState(null);
  const [shareWarn, setShareWarn] = useState(false);

  async function copySummary() {
    await navigator.clipboard.writeText(dealSummaryText(deal, analysis));
    setCopied('summary'); setTimeout(() => setCopied(null), 2000);
  }

  async function copyShareLink() {
    const url = `${location.origin}${location.pathname}#/analyzer?d=${serializeDeal(deal)}`;
    await navigator.clipboard.writeText(url);
    setShareWarn(false);
    setCopied('link'); setTimeout(() => setCopied(null), 2000);
  }

  const h = analysis.headline;
  return (
    <section className="bg-slate-900 text-white rounded-xl p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400">Effective cost, base term</p>
          <p className="text-3xl font-bold mt-1">{signed(h.base)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400">All extensions exercised</p>
          <p className="text-3xl font-bold mt-1">{signed(h.fullExtension)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400">Net cash flow during lease</p>
          <p className={`text-3xl font-bold mt-1 ${h.netMonthly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {h.netMonthly >= 0 ? '+' : '-'}{usd(h.netMonthly)}<span className="text-base font-normal text-slate-400">/mo</span>
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-300 mt-4">{readVerdict(analysis)}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={copySummary}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-200">
          {copied === 'summary' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy deal summary
        </button>
        <button onClick={() => setShareWarn(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-800">
          {copied === 'link' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} Copy share link
        </button>
      </div>

      {shareWarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShareWarn(false)}>
          <div className="bg-white text-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold">This link carries the whole deal</h3>
              </div>
              <button onClick={() => setShareWarn(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Price, loan amount, lender quotes, and credits are all in the link, readable by anyone you send it to.
              It is encoded, not encrypted. Share it like you would share the numbers themselves.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={copyShareLink} className="flex-1 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700">
                Copy anyway
              </button>
              <button onClick={() => setShareWarn(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
