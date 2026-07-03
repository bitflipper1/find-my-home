// Charlotte-market investment intelligence.
//
// Submarket figures are curated estimates (mid-2026) assembled from public
// market sources (MLS medians, Census/ACS, rental comps) for new-construction
// townhomes specifically — NOT an appraisal. Every number is exposed through
// /api/market so the UI can show its assumptions. Update this file as the
// market moves; everything downstream recomputes.

// Effective property-tax rates on market value. The SC investor rate is the
// single biggest gotcha for a leaseback purchase: non-owner-occupied SC
// property is assessed at a 6% ratio vs 4% primary, roughly tripling the bill.
const TAX_RATES = {
  'NC-Mecklenburg': { owner: 0.0098, investor: 0.0098 },
  'NC-Cabarrus': { owner: 0.0089, investor: 0.0089 },
  'NC-Gaston': { owner: 0.0105, investor: 0.0105 },
  'NC-Union': { owner: 0.0077, investor: 0.0077 },
  'NC-Iredell': { owner: 0.0075, investor: 0.0075 },
  'SC-Lancaster': { owner: 0.0055, investor: 0.0135 },
  'SC-York': { owner: 0.0060, investor: 0.0150 },
};

// zip → submarket key
const ZIP_SUBMARKET = {
  28202: 'uptown', 28203: 'uptown', 28204: 'uptown',
  28205: 'plaza-noda', 28206: 'plaza-noda',
  28208: 'west-clt', 28214: 'west-clt', 28216: 'west-clt',
  28209: 'southpark', 28210: 'southpark', 28211: 'southpark',
  28212: 'east-clt', 28215: 'east-clt',
  28213: 'university', 28262: 'university', 28269: 'university',
  28217: 'steele-creek', 28273: 'steele-creek', 28278: 'steele-creek',
  28226: 'ballantyne', 28277: 'ballantyne',
  28105: 'matthews', 28227: 'matthews',
  28078: 'huntersville',
  28031: 'lake-norman', 28036: 'lake-norman',
  28117: 'mooresville', 28115: 'mooresville',
  28027: 'concord-kannapolis', 28025: 'concord-kannapolis',
  28081: 'concord-kannapolis', 28083: 'concord-kannapolis',
  28054: 'gastonia', 28056: 'gastonia', 28052: 'gastonia', 28012: 'gastonia',
  29707: 'indian-land',
  29708: 'fort-mill', 29715: 'fort-mill',
  28173: 'waxhaw-monroe', 28110: 'waxhaw-monroe', 28112: 'waxhaw-monroe',
};

// City fallback when zip is missing
const CITY_SUBMARKET = {
  charlotte: 'east-clt', matthews: 'matthews', 'mint hill': 'matthews',
  huntersville: 'huntersville', cornelius: 'lake-norman', davidson: 'lake-norman',
  mooresville: 'mooresville', concord: 'concord-kannapolis', kannapolis: 'concord-kannapolis',
  gastonia: 'gastonia', belmont: 'gastonia', 'indian land': 'indian-land',
  'fort mill': 'fort-mill', 'tega cay': 'fort-mill', waxhaw: 'waxhaw-monroe',
  monroe: 'waxhaw-monroe', 'indian trail': 'waxhaw-monroe', pineville: 'steele-creek',
};

// New-construction townhome submarket intel (curated estimates, mid-2026)
const SUBMARKETS = {
  'uptown': { label: 'Uptown / South End', county: 'NC-Mecklenburg', ppsf: 340, rent_psf: 1.65, yoy_appreciation: 2.5, forecast_3yr: 3.0, dom: 45, note: 'Premium core; supply-heavy condo/TH pipeline caps near-term upside.' },
  'plaza-noda': { label: 'Plaza Midwood / NoDa', county: 'NC-Mecklenburg', ppsf: 290, rent_psf: 1.45, yoy_appreciation: 4.0, forecast_3yr: 3.5, dom: 30, note: 'Strong rental demand from young professionals; your Central Living at Craig deal sits here.' },
  'west-clt': { label: 'West Charlotte / Wesley Heights', county: 'NC-Mecklenburg', ppsf: 215, rent_psf: 1.25, yoy_appreciation: 6.5, forecast_3yr: 4.5, dom: 25, note: 'Path-of-progress: Gold Line + River District spillover. Best appreciation bet inside the city.' },
  'southpark': { label: 'SouthPark / Cotswold', county: 'NC-Mecklenburg', ppsf: 310, rent_psf: 1.40, yoy_appreciation: 3.5, forecast_3yr: 3.0, dom: 28, note: 'Blue-chip; low volatility, lower yield.' },
  'east-clt': { label: 'East Charlotte', county: 'NC-Mecklenburg', ppsf: 185, rent_psf: 1.20, yoy_appreciation: 5.5, forecast_3yr: 4.0, dom: 22, note: 'Cheapest Mecklenburg entry with real rent support; watch specific pockets.' },
  'university': { label: 'University / North Charlotte', county: 'NC-Mecklenburg', ppsf: 190, rent_psf: 1.22, yoy_appreciation: 5.0, forecast_3yr: 4.0, dom: 20, note: 'UNCC + light rail anchor rents; heavy builder activity keeps prices honest.' },
  'steele-creek': { label: 'Steele Creek / Airport South', county: 'NC-Mecklenburg', ppsf: 195, rent_psf: 1.18, yoy_appreciation: 4.5, forecast_3yr: 3.8, dom: 24, note: 'Jobs corridor (airport, distribution); steady tenant pool.' },
  'ballantyne': { label: 'Ballantyne / South Charlotte', county: 'NC-Mecklenburg', ppsf: 265, rent_psf: 1.25, yoy_appreciation: 3.0, forecast_3yr: 3.0, dom: 30, note: 'Schools premium priced in; thinner cash flow.' },
  'matthews': { label: 'Matthews / Mint Hill', county: 'NC-Mecklenburg', ppsf: 215, rent_psf: 1.15, yoy_appreciation: 4.0, forecast_3yr: 3.5, dom: 26, note: 'Family-rental demand; slower resale velocity.' },
  'huntersville': { label: 'Huntersville', county: 'NC-Mecklenburg', ppsf: 220, rent_psf: 1.15, yoy_appreciation: 4.0, forecast_3yr: 3.5, dom: 27, note: 'North corridor growth; Birkdale gravity.' },
  'lake-norman': { label: 'Cornelius / Lake Norman', county: 'NC-Mecklenburg', ppsf: 250, rent_psf: 1.20, yoy_appreciation: 3.5, forecast_3yr: 3.2, dom: 33, note: 'Lifestyle premium; seasonal rental depth.' },
  'mooresville': { label: 'Mooresville', county: 'NC-Iredell', ppsf: 210, rent_psf: 1.10, yoy_appreciation: 4.5, forecast_3yr: 3.8, dom: 29, note: 'Lower Iredell taxes help cash flow.' },
  'concord-kannapolis': { label: 'Concord / Kannapolis', county: 'NC-Cabarrus', ppsf: 170, rent_psf: 1.05, yoy_appreciation: 6.0, forecast_3yr: 4.5, dom: 21, note: 'Best affordability-to-growth ratio in the metro. Sub-$300K new TH still exists here.' },
  'gastonia': { label: 'Gastonia / Belmont', county: 'NC-Gaston', ppsf: 160, rent_psf: 1.00, yoy_appreciation: 5.5, forecast_3yr: 4.2, dom: 25, note: 'Cheapest entry in the metro; I-85 corridor momentum, higher Gaston taxes.' },
  'indian-land': { label: 'Indian Land, SC', county: 'SC-Lancaster', ppsf: 185, rent_psf: 1.08, yoy_appreciation: 5.0, forecast_3yr: 4.0, dom: 26, note: 'CAUTION for leaseback/investor: SC assesses non-owner-occupied at 6% ratio — property tax roughly triples vs owner-occupied.' },
  'fort-mill': { label: 'Fort Mill / Tega Cay, SC', county: 'SC-York', ppsf: 210, rent_psf: 1.10, yoy_appreciation: 4.5, forecast_3yr: 3.8, dom: 27, note: 'Top schools; same SC 6% investor-assessment caution as Indian Land.' },
  'waxhaw-monroe': { label: 'Waxhaw / Monroe', county: 'NC-Union', ppsf: 195, rent_psf: 1.05, yoy_appreciation: 4.5, forecast_3yr: 3.8, dom: 28, note: 'Union Co. low taxes; Monroe is the value end, Waxhaw the premium end.' },
};

// Financing + operating assumptions (surfaced in the UI; tweak freely)
const ASSUMPTIONS = {
  as_of: '2026-06',
  rate_primary: 6.15,
  rate_investment: 6.65,
  down_payment_pct: 20,
  loan_term_years: 30,
  insurance_annual: 1500,
  hoa_monthly_default: 220,
  vacancy_pct: 5,
  maintenance_pct_of_rent: 5,
  disclaimer: 'Curated estimates for new-construction townhomes, mid-2026. Not an appraisal or lending quote — verify rent comps and tax bills per address before writing an offer.',
};

// Builder model-home / leaseback program intel for the Charlotte division.
// likelihood: 'active' = marketed program, 'case-by-case' = happens on ask,
// 'rare' = mostly closeout sales without leaseback.
const LEASEBACK_PROGRAMS = [
  { builder: 'Tri Pointe Homes', likelihood: 'active', furnished: 'yes — furniture conveys on decorated models', terms: 'CONFIRMED from your own threads: sold the Grahym at Southbridge (Fort Mill) York model HS24 turnkey with all decor; released the Archer Row decorated Beau model (Lot 1) furniture-and-all at $479,990 with $10K closing; offered free furniture on the Oakhurst Rockwell HS13. Quarter-end flexibility explicitly signaled. ⚠ RISK (your own research doc): local Southbridge reviews average 1.15/5 — workmanship, materials, warranty-response complaints despite the #2 national trust rank. Mitigate with independent inspection + written warranty terms.', contact: 'the sales rep ***REDACTED-PHONE*** (Archer Row) · the sales rep ***REDACTED-PHONE*** (Fort Mill/Southbridge) · the sales rep (Oakhurst)', tip: '"If there is a specific scenario that is perfect for you… let me know and I will do my best to get you there" — Taylor put the custom-deal door in writing. Name your structure: price + leaseback + furniture + independent inspection contingency.' },
  { builder: 'David Weekley Homes', likelihood: 'active', furnished: 'negotiable', terms: 'Sells models with leaseback; builder pays rent + HOA until closing/community build-out. Your Central Living at Craig deal is exactly this program — washer/dryer/blinds were negotiable in lieu of commission. Jon mentioned "my other model" had interest (May 29) — he manages more than one.', contact: 'the sales consultant (your existing rep) — ***REDACTED-EMAIL***', tip: 'You are already a repeat buyer; ask Jon which Charlotte models are next to be released.' },
  { builder: 'Taylor Morrison', likelihood: 'active', furnished: 'often included', terms: 'Marketed model-home sale-leaseback program to investors; typical 12–24 mo leaseback at ~5-7% yield on price, builder maintains the home.', contact: 'Charlotte division sales office', tip: 'Ask for the "model home investment program" sheet — it is a standing program, not a favor.' },
  { builder: 'Lennar', likelihood: 'active', furnished: 'often included', terms: 'Sells models with leaseback through community completion (commonly 9–18 mo); furniture packages frequently convey on closeout models.', contact: 'Charlotte division — internet sales team', tip: 'Closeout communities (last phase) are where furnished models get priced to move.' },
  { builder: 'Meritage Homes', likelihood: 'case-by-case', furnished: 'sometimes', terms: 'Model sales with leaseback happen near community closeout; energy-spec homes rent well.', contact: 'Charlotte division office', tip: 'Ask about Concord/Cabarrus communities to stay under $350K.' },
  { builder: 'D.R. Horton', likelihood: 'case-by-case', furnished: 'sometimes at closeout', terms: 'Largest builder = most model inventory. Models typically sold at community closeout, occasionally furnished; leaseback when the sales office still needs the space.', contact: 'Charlotte East/West division offices', tip: 'Volume means deals: ask each community "when does this model release, and will you lease it back?"' },
  { builder: 'Mattamy Homes', likelihood: 'case-by-case', furnished: 'sometimes', terms: 'Does model leasebacks in Carolinas communities, mostly at grand-opening phases of the next community.', contact: 'Charlotte division', tip: 'Indian Land presence — remember the SC 6% investor tax before chasing these.' },
  { builder: 'True Homes', likelihood: 'case-by-case', furnished: 'ask', terms: 'Large local builder (Monroe/Gastonia/Concord heavy); sells models at closeout, leaseback negotiable at grand openings.', contact: 'True Homes Charlotte region', tip: 'Local decision-makers = faster yes/no than nationals.' },
  { builder: 'Ryan Homes (NVR)', likelihood: 'rare', furnished: 'rarely', terms: 'NVR runs asset-light and rarely owns models long; closeout model sales happen (often unfurnished), leaseback uncommon.', contact: 'carolinasteam@ryanhomes.com (already emails you)', tip: 'Their value is price, not leaseback — e.g. Cherry Grove Juniper at $269,990.' },
  { builder: 'Smith Douglas Homes', likelihood: 'rare', furnished: 'ask at closeout', terms: 'Affordable-segment models sold at closeout; furniture occasionally negotiable, leaseback unusual.', contact: 'Charlotte division', tip: 'Best raw price-per-foot if leaseback is optional for you.' },
  { builder: 'Century Communities', likelihood: 'rare', furnished: 'rarely', terms: 'Closeout model sales, usually unfurnished.', contact: 'Charlotte division', tip: 'Gastonia communities are the value pocket.' },
  { builder: 'Pulte Homes', likelihood: 'case-by-case', furnished: 'sometimes', terms: 'Periodic model leasebacks, usually in larger master-planned communities.', contact: 'Charlotte division', tip: 'Most Pulte TH product runs above $350K — watch for incentives.' },
  { builder: 'Toll Brothers', likelihood: 'active', furnished: 'usually included', terms: 'Regular model leasebacks with designer furnishings — but Charlotte TH product starts well above $350K.', contact: 'Charlotte division', tip: 'Out of budget for this hunt; listed for completeness.' },
];

function submarketFor(listing) {
  const zip = parseInt(listing.zip);
  if (zip && ZIP_SUBMARKET[zip]) return ZIP_SUBMARKET[zip];
  const city = (listing.city || '').toLowerCase().trim();
  return CITY_SUBMARKET[city] || null;
}

function monthlyPI(principal, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// Compute the full investment picture for one listing. Pure function.
function enrichListing(listing) {
  const key = submarketFor(listing);
  const sub = key ? SUBMARKETS[key] : null;
  if (!sub || !listing.price || listing.price <= 0) {
    return { submarket: key, submarket_label: sub?.label || null, score: null };
  }

  const sqft = listing.sqft || Math.round(listing.price / sub.ppsf);
  const ppsf = listing.price / sqft;
  const ppsfVsMarket = (ppsf / sub.ppsf - 1) * 100; // negative = cheaper than market

  const rentMonthly = Math.round(sqft * sub.rent_psf);
  const grossYield = (rentMonthly * 12 / listing.price) * 100;

  const taxes = TAX_RATES[sub.county];
  const taxAnnualInvestor = listing.price * taxes.investor;
  const loan = listing.price * (1 - ASSUMPTIONS.down_payment_pct / 100);
  const pi = monthlyPI(loan, ASSUMPTIONS.rate_investment, ASSUMPTIONS.loan_term_years);
  const hoa = ASSUMPTIONS.hoa_monthly_default;
  const piti = pi + taxAnnualInvestor / 12 + ASSUMPTIONS.insurance_annual / 12 + hoa;

  const effectiveRent = rentMonthly * (1 - ASSUMPTIONS.vacancy_pct / 100) - rentMonthly * (ASSUMPTIONS.maintenance_pct_of_rent / 100);
  const cashFlow = effectiveRent - piti;

  const opEx = taxAnnualInvestor + ASSUMPTIONS.insurance_annual + hoa * 12 + rentMonthly * 12 * ((ASSUMPTIONS.vacancy_pct + ASSUMPTIONS.maintenance_pct_of_rent) / 100);
  const capRate = ((rentMonthly * 12 - opEx) / listing.price) * 100;

  const hasCut = listing.original_price > 0 && listing.price < listing.original_price;
  const cutPct = hasCut ? (listing.original_price - listing.price) / listing.original_price * 100 : 0;

  // 0–100 score: value vs market (25), yield (25), growth (15), cut momentum (15),
  // model/furnished/leaseback fit (20)
  let score = 0;
  score += Math.max(0, Math.min(25, 12.5 - ppsfVsMarket * 1.5));
  score += Math.max(0, Math.min(25, (grossYield - 4.5) * 8));
  score += Math.max(0, Math.min(15, sub.forecast_3yr * 3.2));
  score += Math.min(15, cutPct * 3);
  if (listing.is_model) score += 8;
  if (listing.is_furnished) score += 6;
  if (listing.leaseback) score += 6;
  score = Math.round(Math.max(0, Math.min(100, score)));

  return {
    submarket: key,
    submarket_label: sub.label,
    county: sub.county,
    ppsf: Math.round(ppsf),
    market_ppsf: sub.ppsf,
    ppsf_vs_market_pct: Math.round(ppsfVsMarket * 10) / 10,
    rent_estimate: rentMonthly,
    gross_yield_pct: Math.round(grossYield * 100) / 100,
    cap_rate_pct: Math.round(capRate * 100) / 100,
    piti_monthly: Math.round(piti),
    cash_flow_monthly: Math.round(cashFlow),
    tax_annual_investor: Math.round(taxAnnualInvestor),
    sc_investor_tax_warning: sub.county.startsWith('SC-'),
    yoy_appreciation: sub.yoy_appreciation,
    forecast_3yr: sub.forecast_3yr,
    score,
  };
}

function getMarketIntel() {
  return {
    submarkets: Object.entries(SUBMARKETS).map(([id, s]) => {
      const taxes = TAX_RATES[s.county];
      return {
        id, ...s,
        gross_yield_pct: Math.round((s.rent_psf * 12 / s.ppsf) * 10000) / 100,
        tax_rate_owner: taxes.owner, tax_rate_investor: taxes.investor,
      };
    }),
    leaseback_programs: LEASEBACK_PROGRAMS,
    assumptions: ASSUMPTIONS,
  };
}

module.exports = { enrichListing, getMarketIntel, SUBMARKETS, LEASEBACK_PROGRAMS, ASSUMPTIONS };
