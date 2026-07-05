Run a full deal scan and give me the morning report:
1. Search my Gmail (last 2 days) for builder emails, price cuts, model releases, and fall-throughs across Zillow/Redfin/Realtor alerts and builder reps (Tri Pointe, David Weekley, Ryan Homes, Lennar, Mungo).
2. Merge anything new into the gitignored local files `server/data/gmail-listings.json` and `server/data/gmail-leads.json` (dedupe by address, never fabricate prices).
3. Reseed the local database and verify the public snapshot excludes all private sources. Never commit or push Gmail output, tracked places, research, contracts, or buyer-specific model leads.
4. Report: new signals found, any price cuts on tracked targets, and whether any pre-staged offer should fire today. Flag quarter-end windows (last 10 days of Mar/Jun/Sep/Dec) explicitly.
