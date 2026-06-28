const cron = require('node-cron');
const { runAllScrapers } = require('./aggregate');

let isRunning = false;

function startScheduler() {
  // Daily at 7 AM Eastern
  cron.schedule('0 7 * * *', async () => {
    if (isRunning) {
      console.log('[Scheduler] Scrape already in progress, skipping');
      return;
    }
    console.log('[Scheduler] Starting daily scrape at', new Date().toISOString());
    isRunning = true;
    try {
      await runAllScrapers();
    } finally {
      isRunning = false;
    }
  }, { timezone: 'America/New_York' });

  // Also run at noon for price updates
  cron.schedule('0 12 * * *', async () => {
    if (isRunning) return;
    console.log('[Scheduler] Noon price refresh at', new Date().toISOString());
    isRunning = true;
    try {
      await runAllScrapers();
    } finally {
      isRunning = false;
    }
  }, { timezone: 'America/New_York' });

  console.log('[Scheduler] Scheduled daily scrapes at 7 AM and 12 PM Eastern');
}

function getIsRunning() {
  return isRunning;
}

module.exports = { startScheduler, getIsRunning };
