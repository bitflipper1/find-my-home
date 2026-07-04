# Your command deck

Custom slash commands for this repo (in `.claude/commands/`). Type them in any Claude Code session opened on this project.

| Command | When to use | What it does |
|---|---|---|
| `/scan` | Every morning (or let the cron do it) | Gmail sweep → merge new signals → rebuild → morning report with fire/no-fire calls |
| `/fit` | When deciding what to tour next | Ranks all listings by Matt-Fit (plug-play · tech · unique) × investment score |
| `/builder <name>` | Before any builder conversation | Refreshes that builder's KB profile with 90-day news + gives the negotiation verdict |
| `/deal-check <address or terms>` | The moment a deal surfaces | Underwrites it against your Craig Ave benchmark + your avoid rules |
| `/outreach` | When a window opens (quarter-end!) | Drafts target emails in your voice — never sends without OK |
| `/watch` | Weekly | Re-arms the daily scan + quarter-end reminders (recurring tasks expire after 7 days) |

## The cadence that fits your goal

1. **Daily**: `/scan` (automated at 6:53 AM when a session is alive)
2. **When a signal lands**: `/deal-check` the address same-day — models clear in weeks
3. **Before calling a rep**: `/builder <name>` so you negotiate with fresh intel
4. **10 days before quarter-end** (Mar/Jun/Sep/Dec): `/outreach` with pre-staged asks
5. **Weekly**: `/watch` to keep the automation armed

## Session-start tip

Open with one line of context: "Continue the Charlotte townhome hunt — check CLAUDE.md and the Research tab data." Everything lives in `server/data/` (research.json, builders/, model-homes.json), so any fresh session can pick up cold.
