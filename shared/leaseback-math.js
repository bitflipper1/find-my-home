// Model-home leaseback analyzer: the math and the red-flag engine.
//
// Pure ESM, zero dependencies, framework-agnostic. The client imports it
// directly; server tests load it via dynamic import(); the future
// deal-scoring engine consumes it from here. Money is plain dollars,
// dates are ISO strings, nothing here touches the DOM or the network.

// ---- primitives ------------------------------------------------------------

export function monthlyPI({ loanAmount, annualRatePct, termYears = 30 }) {
  if (!loanAmount || !annualRatePct) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  const f = Math.pow(1 + r, n);
  return loanAmount * r * f / (f - 1);
}

// Balance still owed after `monthsPaid` payments on a 30-year note.
export function remainingBalance({ loanAmount, annualRatePct, monthsPaid, termYears = 30 }) {
  if (!loanAmount || !annualRatePct) return loanAmount || 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  const f = Math.pow(1 + r, n);
  const m = Math.pow(1 + r, monthsPaid);
  return loanAmount * (f - m) / (f - 1);
}

export function monthsBetween(fromIso, toIso) {
  const a = new Date(fromIso + 'T00:00:00Z');
  const b = new Date(toIso + 'T00:00:00Z');
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.44)));
}

function addMonths(iso, months) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// The timeline is the builder's, not the buyer's: every timeline-dependent
// number gets computed for base term, +1 extension, and full extensions.
export function leasebackScenarios({ closingDate, baseEndDate, extensionCount = 0, extensionMonths = 0 }) {
  const scenarios = [{ id: 'base', label: 'Base term', endDate: baseEndDate }];
  for (let i = 1; i <= extensionCount; i++) {
    scenarios.push({
      id: i === extensionCount ? 'full' : `ext${i}`,
      label: i === extensionCount ? `All ${extensionCount} extensions` : `+${i} extension${i > 1 ? 's' : ''}`,
      endDate: addMonths(baseEndDate, extensionMonths * i),
    });
  }
  return scenarios.map(s => ({ ...s, months: monthsBetween(closingDate, s.endDate) }));
}

// ---- cash flow -------------------------------------------------------------

export function netMonthlyCashFlow({ rentMonthly = 0, pi = 0, taxAnnual = 0, hoaMonthly = 0, insuranceAnnual = 0 }) {
  return rentMonthly - pi - taxAnnual / 12 - hoaMonthly - insuranceAnnual / 12;
}

// ---- rate and penalty decisions -------------------------------------------

// penalty: { type: 'none' } | { type: 'flat', pct, windowMonths }
//        | { type: 'stepdown', steps: [3,2,1] }  (percent per loan year)
export function prepaymentPenaltyCost({ penalty, loanAmount, annualRatePct, refiMonths }) {
  if (!penalty || penalty.type === 'none' || !refiMonths) return 0;
  const balance = remainingBalance({ loanAmount, annualRatePct, monthsPaid: refiMonths });
  if (penalty.type === 'flat') {
    if (penalty.windowMonths != null && refiMonths > penalty.windowMonths) return 0;
    return balance * (penalty.pct || 0) / 100;
  }
  if (penalty.type === 'stepdown') {
    const year = Math.floor((refiMonths - 1) / 12); // 0-indexed loan year at refi
    const pct = (penalty.steps || [])[year] || 0;
    return balance * pct / 100;
  }
  return 0;
}

// Baseline is the cheapest option to enter (lowest upfront cost; ties break
// toward the higher rate, i.e. the true "par" option). Every option gets its
// all-in cost through the planned refi so penalties and buydowns land in one
// comparable number.
export function compareRateOptions({ loanAmount, refiMonths, options = [] }) {
  if (!options.length) return { options: [], winnerId: null };
  const enriched = options.map(o => ({
    ...o,
    pi: monthlyPI({ loanAmount, annualRatePct: o.ratePct }),
    upfrontCost: o.upfrontCost || 0,
    penaltyCostAtRefi: prepaymentPenaltyCost({ penalty: o.penalty, loanAmount, annualRatePct: o.ratePct, refiMonths }),
  }));
  const baseline = [...enriched].sort((a, b) => a.upfrontCost - b.upfrontCost || b.ratePct - a.ratePct)[0];
  const out = enriched.map(o => {
    const monthlyDelta = baseline.pi - o.pi; // savings per month vs baseline
    const extraCost = o.upfrontCost - baseline.upfrontCost;
    const breakevenMonths = monthlyDelta > 0 && extraCost > 0 ? extraCost / monthlyDelta : null;
    const costThroughRefi = o.upfrontCost + o.pi * refiMonths + o.penaltyCostAtRefi;
    let verdict = null;
    if (o.id !== baseline.id && breakevenMonths != null) {
      verdict = breakevenMonths > refiMonths
        ? `Loses: breakeven is ~${Math.round(breakevenMonths)} months but you refi in ${refiMonths}. Take the cash instead.`
        : `Wins by the numbers: pays for itself in ~${Math.round(breakevenMonths)} months, before your ${refiMonths}-month refi.`;
    }
    return { ...o, monthlyDelta, breakevenMonths, costThroughRefi, verdict, isBaseline: o.id === baseline.id };
  });
  const winnerId = [...out].sort((a, b) => a.costThroughRefi - b.costThroughRefi)[0].id;
  return { options: out, winnerId, baselineId: baseline.id };
}

// What is at stake if a credit dies in re-underwriting: the headline number
// with and without each credit.
export function creditSensitivity({ deal, analysis }) {
  const credits = deal.purchase?.sellerCredits || [];
  return credits.map(c => ({
    label: c.label,
    amount: c.amount,
    headlineWithout: (analysis?.headline?.base ?? 0) + c.amount,
  }));
}

// ---- headline: effective cost of ownership through the leaseback ----------

export function effectiveCostOfOwnership({ deal, scenarioMonths, pi }) {
  const p = deal.purchase;
  const c = deal.carrying;
  const credits = (p.sellerCredits || []).reduce((s, x) => s + (x.amount || 0), 0);
  const cashToClose = (p.price - p.loanAmount) + (p.closingCosts || 0) - (p.sellerContribution || 0) - credits;
  const monthlyOut = pi + (c.taxAnnual || 0) / 12 + (c.hoaMonthly || 0) + (c.insuranceAnnual || 0) / 12;
  const rentIn = (deal.leaseback.rentMonthly || 0) * scenarioMonths;
  return {
    cashToClose,
    carryingTotal: monthlyOut * scenarioMonths,
    rentReceived: rentIn,
    netCost: cashToClose + monthlyOut * scenarioMonths - rentIn,
  };
}

// ---- red flag engine -------------------------------------------------------
// All ten from the spec. Each returns fired (or null for the standing
// reminder, which is always shown), a severity, and a plain-English why.

export const SEVERITIES = ['critical', 'high', 'medium', 'standing'];

export function evaluateRedFlags(deal) {
  const lb = deal.leaseback || {};
  const p = deal.purchase || {};
  const c = deal.carrying || {};
  const x = deal.exit || {};
  const selected = (deal.rateOptions || []).find(o => o.id === deal.selectedRateOptionId) || (deal.rateOptions || [])[0];
  const leaseMonths = lb.closingDate && lb.baseEndDate ? monthsBetween(lb.closingDate, lb.baseEndDate) : 0;
  const affiliation = matchAffiliatedLender(deal.meta?.builder, deal.meta?.lender);
  const dates = lb.dates || {};
  const dateConflict = Boolean(
    (dates.closingPerContract && dates.closingPerLease && dates.closingPerContract !== dates.closingPerLease)
    || (dates.rateLockExpiry && dates.closingPerContract && dates.rateLockExpiry < dates.closingPerContract),
  );
  const penaltyWindowMonths = selected?.penalty?.type === 'stepdown'
    ? (selected.penalty.steps || []).length * 12
    : selected?.penalty?.type === 'flat' ? (selected.penalty.windowMonths ?? Infinity) : 0;

  return [
    {
      id: 'occupancy-misclassification', severity: 'critical',
      title: 'Occupancy misclassification',
      fired: leaseMonths > 0,
      why: 'Tenant-occupied and income-producing on closing day means investment-property underwriting. A primary-residence application with a 60-day occupancy certification is a misrepresentation, even if you plan to move in after the lease.',
    },
    {
      id: 'builder-affiliated-lender', severity: 'high',
      title: 'Builder-affiliated lender',
      fired: Boolean(affiliation),
      why: affiliation
        ? `${affiliation.lender} is affiliated with ${affiliation.builder} (${affiliation.basis}). Their quote serves the builder's close, not your rate. Get independent quotes.`
        : 'The lender is not a known builder affiliate. Still worth one independent quote.',
    },
    {
      id: 'lender-unaware-of-leaseback', severity: 'high',
      title: 'Lender not confirmed aware of leaseback',
      fired: lb.lenderAwareInWriting !== true,
      why: 'A quote produced without written acknowledgement that this is a leaseback is fiction. Get it in writing before trusting any terms.',
    },
    {
      id: 'insurance-commercial-use', severity: 'high',
      title: 'Insurance for commercial use unconfirmed',
      fired: c.insuranceType !== 'surplus-lines' || c.insuranceConfirmed !== true,
      why: 'Standard homeowners policies get DENIED for sales-office use. You need surplus-lines or specialty dwelling coverage with the underwriter confirming the commercial use in writing before binding, plus the builder\'s commercial GL certificate naming you as additional insured.',
    },
    {
      id: 'prepay-penalty-vs-refi', severity: 'high',
      title: 'Prepayment penalty inside the refi window',
      fired: Boolean(selected?.penalty && selected.penalty.type !== 'none' && x.refiMonths && x.refiMonths <= penaltyWindowMonths),
      why: 'Refinancing on schedule triggers the penalty. The dollar cost is computed in the rate comparison; weigh it against whatever rate advantage this loan offers, as one net number.',
    },
    {
      id: 'credits-not-confirmed', severity: 'medium',
      title: 'Credits not reconfirmed after loan reclassification',
      fired: Boolean(p.loanTypeChangedDuringProcess) && (p.sellerCredits || []).some(cr => !cr.confirmedAfterReclass),
      why: 'The loan type changed during the process. Every seller contribution and credit needs written confirmation that it survives re-underwriting.',
    },
    {
      id: 'lease-risk-shift', severity: 'medium',
      title: 'Lease risk-shift language not carrier-reviewed',
      fired: lb.leaseReviewedByCarrier !== true,
      why: 'The lease\'s liability and subrogation-waiver clauses shift risk onto you. Your insurance carrier must review that language before you bind coverage.',
    },
    {
      id: 'loss-assessment-gap', severity: 'medium',
      title: 'Loss assessment coverage below master policy deductible',
      fired: (c.hoaMonthly || 0) > 0 && (c.lossAssessmentCoverage == null || c.masterPolicyDeductible == null
        || c.lossAssessmentCoverage < c.masterPolicyDeductible),
      why: 'If the HOA master policy has a big deductible, a special assessment lands on owners. Your loss assessment coverage should meet or exceed it. Get the master policy deductible and check.',
    },
    {
      id: 'document-date-conflict', severity: 'medium',
      title: 'Document dates conflict',
      fired: dateConflict || !dates.closingPerContract || !dates.closingPerLease || !dates.rateLockExpiry,
      why: 'Closing date per contract, per lease, and the rate-lock expiry must agree. A mismatch means someone re-papers at the table, on their terms.',
    },
    {
      id: 'wire-fraud', severity: 'standing',
      title: 'Wire fraud (standing reminder)',
      fired: true,
      why: 'Verify wire instructions by phone using an independently sourced number. Use only the closing portal. Never act on emailed changes.',
    },
  ];
}

// ---- builder ⇄ lender affiliations ----------------------------------------
// Public, citable relationships only. Every entry carries its basis; anything
// that cannot be sourced from public records stays out.

export const AFFILIATED_LENDERS = [
  {
    builder: 'David Weekley Homes', builderMatch: /david\s*weekley/i,
    lender: 'Grace Home Lending', lenderMatch: /grace\s*home\s*lending/i,
    basis: 'David Weekley Homes discloses a 75% ownership interest in Grace Home Lending, LLC on its financing pages',
  },
  {
    builder: 'Ryan Homes', builderMatch: /ryan\s*homes|nvr/i,
    lender: 'NVR Mortgage', lenderMatch: /nvr\s*mortgage/i,
    basis: 'Ryan Homes and NVR Mortgage are both subsidiaries of NVR, Inc. (SEC filings)',
  },
  {
    builder: 'Lennar', builderMatch: /lennar/i,
    lender: 'Lennar Mortgage', lenderMatch: /lennar\s*mortgage|eagle\s*home\s*mortgage/i,
    basis: 'Lennar Mortgage (formerly Eagle Home Mortgage) is Lennar\'s wholly owned financial services subsidiary',
  },
  {
    builder: 'D.R. Horton', builderMatch: /d\.?\s*r\.?\s*horton/i,
    lender: 'DHI Mortgage', lenderMatch: /dhi\s*mortgage/i,
    basis: 'DHI Mortgage is D.R. Horton\'s affiliated mortgage subsidiary, disclosed on dhimortgage.com',
  },
  {
    builder: 'Pulte Homes', builderMatch: /pulte/i,
    lender: 'Pulte Mortgage', lenderMatch: /pulte\s*mortgage/i,
    basis: 'Pulte Mortgage is PulteGroup\'s wholly owned financing subsidiary',
  },
  {
    builder: 'Taylor Morrison', builderMatch: /taylor\s*morrison/i,
    lender: 'Taylor Morrison Home Funding', lenderMatch: /taylor\s*morrison\s*home\s*funding/i,
    basis: 'Taylor Morrison Home Funding is Taylor Morrison\'s affiliated lender, disclosed on taylormorrison.com',
  },
];

export function matchAffiliatedLender(builderName, lenderName) {
  if (!builderName || !lenderName) return null;
  return AFFILIATED_LENDERS.find(a => a.builderMatch.test(builderName) && a.lenderMatch.test(lenderName)) || null;
}

// ---- severity palette ------------------------------------------------------
// Light-theme colors for the flag UI. The contrast test in server/test pins
// every text/background pair at WCAG AA (4.5:1) so a tweak here cannot
// silently break accessibility.

export const SEVERITY_PALETTE = {
  critical: { text: '#991B1B', bg: '#FEF2F2', border: '#DC2626', tailwind: { text: 'text-red-800', bg: 'bg-red-50', border: 'border-red-600' } },
  high: { text: '#9A3412', bg: '#FFF7ED', border: '#EA580C', tailwind: { text: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-600' } },
  medium: { text: '#92400E', bg: '#FFFBEB', border: '#D97706', tailwind: { text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-600' } },
  standing: { text: '#334155', bg: '#F8FAFC', border: '#64748B', tailwind: { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-500' } },
};

// ---- the whole thing -------------------------------------------------------

export function analyzeDeal(deal) {
  const selected = (deal.rateOptions || []).find(o => o.id === deal.selectedRateOptionId) || (deal.rateOptions || [])[0];
  const pi = selected ? monthlyPI({ loanAmount: deal.purchase.loanAmount, annualRatePct: selected.ratePct }) : 0;
  const scenarios = leasebackScenarios(deal.leaseback);
  const monthly = netMonthlyCashFlow({
    rentMonthly: deal.leaseback.rentMonthly, pi,
    taxAnnual: deal.carrying.taxAnnual, hoaMonthly: deal.carrying.hoaMonthly,
    insuranceAnnual: deal.carrying.insuranceAnnual,
  });
  const perScenario = scenarios.map(s => ({
    ...s,
    cumulativeCashFlow: monthly * s.months,
    ownership: effectiveCostOfOwnership({ deal, scenarioMonths: s.months, pi }),
  }));
  const rateComparison = compareRateOptions({
    loanAmount: deal.purchase.loanAmount,
    refiMonths: deal.exit?.refiMonths || 0,
    options: deal.rateOptions || [],
  });
  const flags = evaluateRedFlags(deal);
  const analysis = {
    pi,
    monthlyCashFlow: monthly,
    scenarios: perScenario,
    rateComparison,
    flags,
    headline: {
      base: perScenario[0]?.ownership.netCost ?? 0,
      fullExtension: perScenario[perScenario.length - 1]?.ownership.netCost ?? 0,
      netMonthly: monthly,
    },
  };
  analysis.creditSensitivity = creditSensitivity({ deal, analysis });
  return analysis;
}

// ---- plain-text summary (the email you actually send) ----------------------

const usd = n => `$${Math.round(Math.abs(n)).toLocaleString()}`;
const signed = n => (n >= 0 ? usd(n) : `-${usd(n)}`);

export function dealSummaryText(deal, analysis) {
  const a = analysis || analyzeDeal(deal);
  const fired = a.flags.filter(f => f.fired && f.severity !== 'standing');
  const winner = a.rateComparison.options.find(o => o.id === a.rateComparison.winnerId);
  const lines = [
    `LEASEBACK DEAL SUMMARY — ${deal.meta?.label || deal.meta?.address || 'unnamed deal'}`,
    '',
    `Purchase: ${usd(deal.purchase.price)} | Loan: ${usd(deal.purchase.loanAmount)} | Type: ${deal.purchase.loanType || 'n/a'}`,
    `Leaseback: ${usd(deal.leaseback.rentMonthly)}/mo gross through ${deal.leaseback.baseEndDate}`
      + (deal.leaseback.extensionCount ? ` plus ${deal.leaseback.extensionCount} x ${deal.leaseback.extensionMonths}-month builder options` : ''),
    '',
    `Net cash flow during leaseback: ${signed(a.monthlyCashFlow)}/mo`,
    `Effective cost of ownership through leaseback: ${signed(a.headline.base)} (base term), ${signed(a.headline.fullExtension)} (all extensions)`,
    winner ? `Rate decision: ${winner.label} wins through the planned refi (${deal.exit?.refiMonths || '?'} months). ${a.rateComparison.options.map(o => o.verdict).filter(Boolean).join(' ')}` : null,
    '',
    fired.length ? `OPEN FLAGS (${fired.length}):` : 'OPEN FLAGS: none',
    ...fired.map(f => `- [${f.severity.toUpperCase()}] ${f.title}: ${f.why}`),
    '',
    'Standing reminder: verify wire instructions by phone via an independently sourced number; never act on emailed changes.',
  ].filter(l => l !== null);
  return lines.join('\n');
}

// ---- the reference deal (built-in test fixture) ---------------------------
// 3912 Craig Ave as actually negotiated. Closing 2026-07-31; the lender
// question is live (non-QM with a stepdown penalty vs a no-penalty option)
// and the surplus-lines premium is quoted but NOT yet confirmed in writing
// for sales-office use, so the insurance flag must fire.

export const REFERENCE_DEAL = {
  meta: {
    label: '3912 Craig Ave (reference)',
    address: '3912 Craig Ave, Charlotte, NC 28211',
    builder: 'David Weekley Homes',
    lender: 'Grace Home Lending',
  },
  purchase: {
    price: 379000,
    loanAmount: 303000,
    closingCosts: 9000,
    sellerContribution: 18950,
    sellerCredits: [{ label: 'Additional seller credit', amount: 5000, confirmedAfterReclass: false }],
    loanType: 'dscr-nonqm',
    loanTypeChangedDuringProcess: false,
  },
  rateOptions: [
    { id: 'par', label: '6.5% par, no points', ratePct: 6.5, upfrontCost: 0, penalty: { type: 'none' } },
    { id: 'buydown', label: '6.215% using the $5,000 credit', ratePct: 6.215, upfrontCost: 5000, penalty: { type: 'none' } },
    { id: 'nonqm-penalty', label: '6.5% non-QM with 3-2-1 prepay penalty', ratePct: 6.5, upfrontCost: 0, penalty: { type: 'stepdown', steps: [3, 2, 1] } },
  ],
  selectedRateOptionId: 'par',
  leaseback: {
    rentMonthly: 3139,
    closingDate: '2026-07-31',
    baseEndDate: '2027-07-31',
    extensionCount: 2,
    extensionMonths: 3,
    utilitiesPaidBy: 'builder',
    lenderAwareInWriting: true,
    leaseReviewedByCarrier: true,
    dates: { closingPerContract: '2026-07-31', closingPerLease: '2026-07-31', rateLockExpiry: '2026-07-30' },
  },
  carrying: {
    taxAnnual: 3100,
    hoaMonthly: 220,
    insuranceAnnual: 805,
    insuranceType: 'surplus-lines',
    insuranceConfirmed: false,
    lossAssessmentCoverage: 10000,
    masterPolicyDeductible: 10000,
  },
  exit: {
    refiMonths: 18,
    refiRatePct: 5.75,
    refiCosts: 4000,
    lenderPromisedFreeRefi: true,
  },
};
