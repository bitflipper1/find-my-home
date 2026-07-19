# Build Prompt: Model-Home Leaseback Analyzer

Drop this into Claude Code with Fable 5 selected. Suggested home: `specs/leaseback-analyzer.md` in the find-my-home repo, referenced from CLAUDE.md.

---

## ROLE

You are a senior product engineer building a financial analysis module for find-my-home, a static real estate app hosted on GitHub Pages (github.com/bitflipper1/find-my-home). You are building the Model-Home Leaseback Analyzer: a tool that evaluates new-construction deals where the builder rents the home back as a sales office or model after closing. This deal type is niche, poorly understood by lenders and insurers, and full of traps. The tool encodes hard-won knowledge from a real closing. Take it seriously.

## INTERVIEW FIRST

Before writing any code, ask me:
1. Should this live as a new route/page in find-my-home or a standalone tool linked from it?
2. Confirm the current stack of the repo (framework, styling approach) so you match it instead of inventing one.
3. Anything about the reference deal below that has changed.

Do not start building until I answer.

## CONSTRAINTS

- Static site, client-side only. No backend, no API keys, no server calls. All math runs in the browser.
- All state persists to the URL (shareable deal links) or localStorage if URL gets unwieldy. A deal I model today should survive a refresh.
- Mobile-first. I will use this standing in a model home.
- Match the existing find-my-home visual language. Dark, high-contrast, engineered feel. No template energy.
- Voice in all UI copy: direct, plain, slightly irreverent. No corporate filler. No em dashes anywhere in copy or code comments.

## DOMAIN MODEL

A model-home leaseback deal has these components. Every one is a user input with sensible defaults:

**The purchase**
- Purchase price
- Loan amount (or down payment percent)
- Interest rate options (see Rate Comparison below)
- Loan type: conventional investment, DSCR/non-QM, other
- Prepayment penalty: none, or structure (e.g., 3-2-1, flat percent, months)
- Seller contribution toward closing costs
- Additional seller credits
- Estimated closing costs

**The leaseback**
- Monthly rent the builder pays (note: builders often gross this up to cover HOA and taxes; capture gross figure)
- Initial term end date
- Optional extensions (count and length, e.g., two 3-month options, exercisable by builder)
- Who pays utilities during the lease

**Carrying costs**
- Monthly principal and interest (computed)
- Property taxes (annual)
- HOA dues (monthly)
- Insurance premium (annual). Flag: standard homeowners policies get DENIED for sales-office use. Model a surplus-lines dwelling policy instead. Include a field for the quoted premium and a note that written underwriter confirmation of commercial use is required before binding.

**The exit**
- Planned refinance date (typically right after occupancy begins)
- Estimated refi rate and costs
- Whether the current lender promises a free or discounted refi (capture but treat skeptically: verify in writing)

## CALCULATIONS

Build these as pure, tested functions in a separate module (`lib/leaseback-math.js` or equivalent). UI consumes them.

1. **Monthly P&I** from loan amount, rate, 30-year amortization.
2. **Net monthly cash flow during leaseback**: rent minus PITI minus HOA minus insurance/12. Show monthly and cumulative over base term and each extension scenario.
3. **Rate option comparison**: given two or more options (e.g., par rate vs. paying points/credits for a buydown), compute the monthly payment delta and breakeven in months. Then compare breakeven against the planned refi date. If breakeven exceeds months-to-refi, the buydown loses. Say so plainly in the output.
4. **Prepayment penalty cost**: given the penalty structure and the planned refi date, compute the actual dollar cost of refinancing on schedule. Surface this next to any rate advantage the penalty-carrying loan offers, as a single net number.
5. **Seller credit sensitivity**: model the deal with and without each credit, so I can see exactly what is at stake if a credit does not survive re-underwriting.
6. **Effective cost of ownership through the leaseback**: total out-of-pocket from closing through lease end (base and max-extension scenarios), net of rent received. This is the headline number.
7. **Extension scenarios**: builder-exercisable extensions mean the timeline is not mine. Every timeline-dependent output shows base term, +1 extension, and full-extension cases side by side.

## RED FLAG ENGINE

A checklist the tool evaluates automatically from inputs, each with a one-line plain-English explanation and severity. These are the ones that actually happen:

- **Occupancy misclassification (critical)**: if the property is tenant-occupied and income-producing on closing day, it must be underwritten as an investment property. A primary-residence application with a 60-day occupancy certification is a misrepresentation, even if you plan to move in after the lease. Trigger this flag whenever leaseback term > 0.
- **Builder-affiliated lender (high)**: if the lender is owned by or affiliated with the builder, flag the conflict of interest and recommend independent quotes.
- **Lender unaware of leaseback (high)**: prompt: has the lender confirmed IN WRITING that they know this is a leaseback? A quote produced without that knowledge is fiction.
- **Insurance for commercial use (high)**: standard HO policies deny sales-office use. Requires surplus-lines or specialty dwelling coverage with written confirmation of the use case. Also prompt for the builder's commercial GL certificate naming the buyer as additional insured.
- **Prepayment penalty vs. refi plan (high)**: if planned refi date falls inside the penalty window, compute and show the cost.
- **Credits not confirmed post-reclassification (medium)**: if loan type changed during the process, prompt for written confirmation that seller contributions survive.
- **Lease risk-shift clauses (medium)**: prompt: has the insurance carrier reviewed the lease's liability and subrogation-waiver language before binding?
- **Loss assessment coverage gap (medium)**: for HOA properties, prompt for the master policy deductible and flag if loss assessment coverage is below it.
- **Document date conflicts (medium)**: prompt for closing date per contract, per lease, and rate lock expiry. Flag any mismatch.
- **Wire fraud (standing)**: always-on reminder: verify wire instructions by phone using an independently sourced number, use only the closing portal, never act on emailed changes.

## REFERENCE DEAL (BUILT-IN TEST FIXTURE)

Ship with this deal preloaded as the example, and write unit tests that pin these outputs:

- Price $379,000, loan ~$303,000
- Leaseback rent $3,139/mo gross (covers HOA and taxes), base term through July 31, 2027, two builder-exercisable 3-month extensions
- Seller contribution ~$18,950 plus $5,000 credit
- Rate scenario: 6.5% par vs. spending the $5,000 credit on a buydown to 6.215%. Expected result: breakeven is roughly 89 months, refi planned at ~18 months, so the buydown loses and the credit is better taken as cash. The tool must reproduce this conclusion.
- Insurance: surplus-lines dwelling policy ~$805/yr
- Red flags that should fire on this fixture: occupancy misclassification, builder-affiliated lender, insurance commercial use, document date conflict.

## OUTPUT UI

Three zones:
1. **Verdict panel** (top): effective cost of ownership through leaseback (base and max-extension), net monthly cash flow, and a one-sentence plain-English read of the deal.
2. **Rate and credit decisions**: the comparison table with breakeven vs. refi timeline, winner clearly marked.
3. **Red flags**: fired flags first, sorted by severity, each expandable to its explanation. Unfired flags shown as a collapsed "checked and clear" list so the user knows what was evaluated.

Include a "copy deal summary" button that produces a clean plain-text summary suitable for pasting into an email to a lender or agent.

## VERIFICATION

Before declaring done:
1. Run the test suite; the reference fixture assertions must pass, especially the ~89-month breakeven.
2. Open the built page in the browser, walk the full flow on a 390px viewport, and screenshot the three output zones.
3. Lighthouse: 90+ performance and accessibility on the deployed page.
4. Confirm zero network requests after load (static, client-side only).

## WORKFLOW NOTES

- Plan mode first. Propose file structure and math-module API before writing.
- Math module and tests first, UI second. The math is the product; the UI is packaging.
- Keep the math module framework-agnostic so it can be reused by the future deal-scoring engine.
