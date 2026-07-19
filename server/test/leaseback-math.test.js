// Pins the leaseback-math fixture outputs and the severity palette's WCAG AA
// contrast. The module is ESM in shared/; this CJS test loads it dynamically.
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const mathPath = path.join(__dirname, '..', '..', 'shared', 'leaseback-math.js');
const urlPath = path.join(__dirname, '..', '..', 'shared', 'leaseback-url.js');
const lib = () => import('file://' + mathPath);
const urlLib = () => import('file://' + urlPath);

test('monthly P&I matches known amortization', async () => {
  const { monthlyPI } = await lib();
  const pi = monthlyPI({ loanAmount: 303000, annualRatePct: 6.5 });
  assert.ok(Math.abs(pi - 1915) < 2, `expected ~$1,915, got ${pi.toFixed(2)}`);
});

test('reference buydown loses: ~89-month breakeven vs 18-month refi', async () => {
  const { REFERENCE_DEAL, compareRateOptions } = await lib();
  const cmp = compareRateOptions({
    loanAmount: REFERENCE_DEAL.purchase.loanAmount,
    refiMonths: REFERENCE_DEAL.exit.refiMonths,
    options: REFERENCE_DEAL.rateOptions,
  });
  const buydown = cmp.options.find(o => o.id === 'buydown');
  assert.ok(buydown.breakevenMonths > 85 && buydown.breakevenMonths < 93,
    `expected ~89-month breakeven, got ${buydown.breakevenMonths?.toFixed(1)}`);
  assert.match(buydown.verdict, /Loses/);
  assert.notStrictEqual(cmp.winnerId, 'buydown');
});

test('non-QM stepdown penalty costs ~2% of remaining balance at 18-month refi', async () => {
  const { REFERENCE_DEAL, prepaymentPenaltyCost } = await lib();
  const opt = REFERENCE_DEAL.rateOptions.find(o => o.id === 'nonqm-penalty');
  const cost = prepaymentPenaltyCost({
    penalty: opt.penalty,
    loanAmount: REFERENCE_DEAL.purchase.loanAmount,
    annualRatePct: opt.ratePct,
    refiMonths: 18,
  });
  // Year 2 of a 3-2-1 stepdown = 2% of ~$297.8K remaining ≈ $5,957
  assert.ok(Math.abs(cost - 5957) < 60, `expected ~$5,957, got ${cost.toFixed(0)}`);
});

test('penalty option loses to par once penalty is counted', async () => {
  const { REFERENCE_DEAL, compareRateOptions } = await lib();
  const cmp = compareRateOptions({
    loanAmount: REFERENCE_DEAL.purchase.loanAmount,
    refiMonths: 18,
    options: REFERENCE_DEAL.rateOptions,
  });
  const par = cmp.options.find(o => o.id === 'par');
  const pen = cmp.options.find(o => o.id === 'nonqm-penalty');
  assert.ok(pen.costThroughRefi - par.costThroughRefi > 5000,
    'penalty option must be > $5K worse through refi at equal rate');
  assert.strictEqual(cmp.winnerId, 'par');
});

test('all ten flags implemented; fixture fires exactly the expected four plus standing', async () => {
  const { REFERENCE_DEAL, evaluateRedFlags } = await lib();
  const flags = evaluateRedFlags(REFERENCE_DEAL);
  assert.strictEqual(flags.length, 10, 'all ten spec flags must exist');

  const fired = flags.filter(f => f.fired && f.severity !== 'standing').map(f => f.id).sort();
  assert.deepStrictEqual(fired, [
    'builder-affiliated-lender',
    'document-date-conflict',
    'insurance-commercial-use',
    'occupancy-misclassification',
  ].sort());

  const clear = flags.filter(f => !f.fired).map(f => f.id).sort();
  assert.deepStrictEqual(clear, [
    'credits-not-confirmed',
    'lease-risk-shift',
    'lender-unaware-of-leaseback',
    'loss-assessment-gap',
    'prepay-penalty-vs-refi',
  ].sort());

  const standing = flags.find(f => f.id === 'wire-fraud');
  assert.strictEqual(standing.severity, 'standing');
  assert.strictEqual(standing.fired, true);
});

test('affiliated-lender flag fires on David Weekley + Grace Home Lending', async () => {
  const { matchAffiliatedLender } = await lib();
  assert.ok(matchAffiliatedLender('David Weekley Homes', 'Grace Home Lending, LLC'));
  assert.ok(matchAffiliatedLender('Ryan Homes', 'NVR Mortgage Finance'));
  assert.strictEqual(matchAffiliatedLender('David Weekley Homes', 'Third Federal'), null);
});

test('analyzeDeal produces scenario triple and coherent headline', async () => {
  const { REFERENCE_DEAL, analyzeDeal } = await lib();
  const a = analyzeDeal(REFERENCE_DEAL);
  assert.deepStrictEqual(a.scenarios.map(s => s.id), ['base', 'ext1', 'full']);
  assert.ok(a.scenarios[0].months >= 11 && a.scenarios[0].months <= 13, 'base ~12 months');
  assert.ok(a.scenarios[2].months >= 17 && a.scenarios[2].months <= 19, 'full ~18 months');
  // Rent ($3,139) exceeds PITI+HOA+ins, so more leaseback months lower the net cost.
  assert.ok(a.monthlyCashFlow > 0);
  assert.ok(a.headline.fullExtension < a.headline.base);
  // Credit sensitivity: losing the $5K credit raises the headline by exactly $5K.
  assert.strictEqual(a.creditSensitivity[0].headlineWithout - a.headline.base, 5000);
});

test('copy-deal-summary text carries the numbers that matter', async () => {
  const { REFERENCE_DEAL, analyzeDeal, dealSummaryText } = await lib();
  const text = dealSummaryText(REFERENCE_DEAL, analyzeDeal(REFERENCE_DEAL));
  assert.match(text, /\$379,000/);
  assert.match(text, /\$3,139\/mo gross/);
  assert.match(text, /OPEN FLAGS \(4\)/);
  assert.match(text, /\[CRITICAL\] Occupancy misclassification/);
  assert.match(text, /wire instructions by phone/);
});

test('severity palette passes WCAG AA (4.5:1) for text on tinted background', async () => {
  const { SEVERITY_PALETTE } = await lib();
  const lum = hex => {
    const c = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => {
      const v = parseInt(c.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  for (const [severity, p] of Object.entries(SEVERITY_PALETTE)) {
    const ratio = contrast(p.text, p.bg);
    assert.ok(ratio >= 4.5, `${severity}: ${ratio.toFixed(2)}:1 fails AA`);
  }
});

test('deal URL codec round-trips and rejects unknown versions', async () => {
  const { REFERENCE_DEAL } = await lib();
  const { serializeDeal, deserializeDeal } = await urlLib();
  const round = deserializeDeal(serializeDeal(REFERENCE_DEAL));
  assert.deepStrictEqual(round, REFERENCE_DEAL);
  assert.throws(() => deserializeDeal('9.abcd'), /Unsupported/);
});
