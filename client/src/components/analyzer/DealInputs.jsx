import { Plus, X } from 'lucide-react';

// Source chips: every prefilled value says where it came from, and an edit
// flips it to "edited". Generic defaults look different from fetched values
// on purpose; a default is a guess, not a fact.
const CHIP = {
  deal: { label: 'from your deal', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  default: { label: 'generic default', cls: 'bg-gray-50 text-gray-500 border-dashed border-gray-300' },
  live: { label: 'fetched live', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  edited: { label: 'edited', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function Chip({ origin }) {
  const c = CHIP[origin];
  if (!c) return null;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${c.cls}`}>{c.label}</span>;
}

function Field({ label, path, value, onChange, sources, type = 'number', step, placeholder, note }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 flex items-center gap-1.5">{label} <Chip origin={sources?.[path]} /></span>
      <input
        type={type} step={step} value={value ?? ''} placeholder={placeholder}
        onChange={e => onChange(path, type === 'number' ? (e.target.value === '' ? null : parseFloat(e.target.value)) : e.target.value)}
        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {note && <span className="block text-[10px] text-gray-400 mt-0.5">{note}</span>}
    </label>
  );
}

function Toggle({ label, path, value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-600 py-1">
      <input type="checkbox" checked={value === true} onChange={e => onChange(path, e.target.checked)} className="rounded" />
      {label}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">{title}</h4>
      {children}
    </div>
  );
}

const PENALTY_TYPES = [['none', 'None'], ['flat', 'Flat %'], ['stepdown', 'Step-down (e.g. 3-2-1)']];

export default function DealInputs({ deal, sources, onChange }) {
  const set = onChange;
  const p = deal.purchase, lb = deal.leaseback, c = deal.carrying, x = deal.exit;

  const setOption = (i, key, value) => {
    const opts = deal.rateOptions.map((o, j) => j === i ? { ...o, [key]: value } : o);
    set('rateOptions', opts);
  };
  const setPenalty = (i, patch) => {
    const opts = deal.rateOptions.map((o, j) => j === i ? { ...o, penalty: { ...o.penalty, ...patch } } : o);
    set('rateOptions', opts);
  };
  const setCredit = (i, key, value) => {
    const credits = p.sellerCredits.map((cr, j) => j === i ? { ...cr, [key]: value } : cr);
    set('purchase.sellerCredits', credits);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Section title="The purchase">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Purchase price" path="purchase.price" value={p.price} onChange={set} sources={sources} />
          <Field label="Loan amount" path="purchase.loanAmount" value={p.loanAmount} onChange={set} sources={sources} />
          <Field label="Closing costs (est.)" path="purchase.closingCosts" value={p.closingCosts} onChange={set} sources={sources} />
          <Field label="Seller contribution" path="purchase.sellerContribution" value={p.sellerContribution} onChange={set} sources={sources} />
          <label className="block col-span-2">
            <span className="text-xs text-gray-500">Loan type</span>
            <select value={p.loanType} onChange={e => set('purchase.loanType', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg">
              <option value="conventional-investment">Conventional investment</option>
              <option value="dscr-nonqm">DSCR / non-QM</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <Toggle label="Loan type changed during the process" path="purchase.loanTypeChangedDuringProcess" value={p.loanTypeChangedDuringProcess} onChange={set} />
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Seller credits</span>
            <button onClick={() => set('purchase.sellerCredits', [...p.sellerCredits, { label: 'Credit', amount: 0, confirmedAfterReclass: false }])}
              className="text-xs text-blue-600 flex items-center gap-0.5"><Plus className="w-3 h-3" /> add</button>
          </div>
          {p.sellerCredits.map((cr, i) => (
            <div key={i} className="flex items-center gap-2 mt-1.5">
              <input value={cr.label} onChange={e => setCredit(i, 'label', e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg" />
              <input type="number" value={cr.amount ?? ''} onChange={e => setCredit(i, 'amount', parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-xs border border-gray-200 rounded-lg text-right" />
              <label className="flex items-center gap-1 text-[10px] text-gray-500" title="Written confirmation the credit survives re-underwriting">
                <input type="checkbox" checked={cr.confirmedAfterReclass === true} onChange={e => setCredit(i, 'confirmedAfterReclass', e.target.checked)} /> confirmed
              </label>
              <button onClick={() => set('purchase.sellerCredits', p.sellerCredits.filter((_, j) => j !== i))}
                className="text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="The leaseback">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Rent the builder pays /mo (gross)" path="leaseback.rentMonthly" value={lb.rentMonthly} onChange={set} sources={sources}
            note="Builders often gross this up to cover HOA and taxes; enter the gross figure" />
          <Field label="Closing date" path="leaseback.closingDate" value={lb.closingDate} onChange={set} sources={sources} type="date" />
          <Field label="Base term end" path="leaseback.baseEndDate" value={lb.baseEndDate} onChange={set} sources={sources} type="date" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Extensions" path="leaseback.extensionCount" value={lb.extensionCount} onChange={set} sources={sources} />
            <Field label="Months each" path="leaseback.extensionMonths" value={lb.extensionMonths} onChange={set} sources={sources} />
          </div>
          <label className="block">
            <span className="text-xs text-gray-500">Utilities during lease</span>
            <select value={lb.utilitiesPaidBy} onChange={e => set('leaseback.utilitiesPaidBy', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg">
              <option value="builder">Builder pays</option>
              <option value="buyer">Buyer pays</option>
            </select>
          </label>
        </div>
        <Toggle label="Lender has confirmed IN WRITING they know this is a leaseback" path="leaseback.lenderAwareInWriting" value={lb.lenderAwareInWriting} onChange={set} />
        <Toggle label="Insurance carrier has reviewed the lease's liability / subrogation language" path="leaseback.leaseReviewedByCarrier" value={lb.leaseReviewedByCarrier} onChange={set} />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <Field label="Closing per contract" path="leaseback.dates.closingPerContract" value={lb.dates?.closingPerContract} onChange={set} sources={sources} type="date" />
          <Field label="Closing per lease" path="leaseback.dates.closingPerLease" value={lb.dates?.closingPerLease} onChange={set} sources={sources} type="date" />
          <Field label="Rate lock expiry" path="leaseback.dates.rateLockExpiry" value={lb.dates?.rateLockExpiry} onChange={set} sources={sources} type="date" />
        </div>
      </Section>

      <Section title="Rate options">
        <div className="space-y-3">
          {deal.rateOptions.map((o, i) => (
            <div key={o.id} className={`rounded-lg border p-2.5 ${deal.selectedRateOptionId === o.id ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <input type="radio" name="selectedRate" checked={deal.selectedRateOptionId === o.id}
                  onChange={() => set('selectedRateOptionId', o.id)} title="Model the deal on this option" />
                <input value={o.label} onChange={e => setOption(i, 'label', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg" />
                <button onClick={() => set('rateOptions', deal.rateOptions.filter((_, j) => j !== i))}
                  className="text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <label className="block"><span className="text-[10px] text-gray-500">Rate %</span>
                  <input type="number" step="0.001" value={o.ratePct ?? ''} onChange={e => setOption(i, 'ratePct', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg" /></label>
                <label className="block"><span className="text-[10px] text-gray-500">Upfront cost $</span>
                  <input type="number" value={o.upfrontCost ?? ''} onChange={e => setOption(i, 'upfrontCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg" /></label>
                <label className="block"><span className="text-[10px] text-gray-500">Penalty</span>
                  <select value={o.penalty?.type || 'none'} onChange={e => setPenalty(i, { type: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg">
                    {PENALTY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select></label>
              </div>
              {o.penalty?.type === 'flat' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <label className="block"><span className="text-[10px] text-gray-500">Penalty %</span>
                    <input type="number" step="0.1" value={o.penalty.pct ?? ''} onChange={e => setPenalty(i, { pct: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg" /></label>
                  <label className="block"><span className="text-[10px] text-gray-500">Window (months)</span>
                    <input type="number" value={o.penalty.windowMonths ?? ''} onChange={e => setPenalty(i, { windowMonths: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg" /></label>
                </div>
              )}
              {o.penalty?.type === 'stepdown' && (
                <label className="block mt-2"><span className="text-[10px] text-gray-500">Steps, % per loan year (comma-separated, e.g. 3,2,1)</span>
                  <input value={(o.penalty.steps || []).join(',')}
                    onChange={e => setPenalty(i, { steps: e.target.value.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) })}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg" /></label>
              )}
            </div>
          ))}
          <button onClick={() => set('rateOptions', [...deal.rateOptions, { id: `opt${Date.now()}`, label: 'New option', ratePct: 6.5, upfrontCost: 0, penalty: { type: 'none' } }])}
            className="text-xs text-blue-600 flex items-center gap-0.5"><Plus className="w-3 h-3" /> add option</button>
        </div>
      </Section>

      <Section title="Carrying costs and exit">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Property taxes /yr" path="carrying.taxAnnual" value={c.taxAnnual} onChange={set} sources={sources} />
          <Field label="HOA dues /mo" path="carrying.hoaMonthly" value={c.hoaMonthly} onChange={set} sources={sources} />
          <Field label="Insurance premium /yr" path="carrying.insuranceAnnual" value={c.insuranceAnnual} onChange={set} sources={sources}
            note="Never defaulted: standard homeowners policies get DENIED for sales-office use. Enter your surplus-lines quote." />
          <label className="block">
            <span className="text-xs text-gray-500">Policy type</span>
            <select value={c.insuranceType} onChange={e => set('carrying.insuranceType', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg">
              <option value="surplus-lines">Surplus-lines dwelling</option>
              <option value="standard-ho">Standard homeowners</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Field label="Loss assessment coverage" path="carrying.lossAssessmentCoverage" value={c.lossAssessmentCoverage} onChange={set} sources={sources} />
          <Field label="HOA master policy deductible" path="carrying.masterPolicyDeductible" value={c.masterPolicyDeductible} onChange={set} sources={sources} />
        </div>
        <Toggle label="Underwriter has confirmed sales-office use IN WRITING" path="carrying.insuranceConfirmed" value={c.insuranceConfirmed} onChange={set} />
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
          <Field label="Refi at month" path="exit.refiMonths" value={x.refiMonths} onChange={set} sources={sources} />
          <Field label="Est. refi rate %" path="exit.refiRatePct" value={x.refiRatePct} onChange={set} sources={sources} step="0.001" />
          <Field label="Refi costs $" path="exit.refiCosts" value={x.refiCosts} onChange={set} sources={sources} />
        </div>
        <Toggle label="Lender promised a free or discounted refi (get it in writing; treat skeptically)" path="exit.lenderPromisedFreeRefi" value={x.lenderPromisedFreeRefi} onChange={set} />
      </Section>

      <Section title="Who's who">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Field label="Deal label / address" path="meta.address" value={deal.meta.address} onChange={set} sources={sources} type="text" placeholder="Street, City, ST ZIP" />
          <Field label="Builder" path="meta.builder" value={deal.meta.builder} onChange={set} sources={sources} type="text" />
          <Field label="Lender" path="meta.lender" value={deal.meta.lender} onChange={set} sources={sources} type="text"
            note="Builder-affiliated lenders are flagged automatically" />
        </div>
      </Section>
    </div>
  );
}
