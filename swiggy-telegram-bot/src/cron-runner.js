require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config.json');
const { fetchEssentialAisleDeals, fetchWednesdayBazaarDeals, fetchNoiceDeals } = require('./swiggyApi');
const { findAlertWorthyDeals } = require('./dealTracker');
const { sendBatchAlerts } = require('./notifier');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const minDiscount = parseInt(process.env.MIN_DISCOUNT_PERCENT, 10) || config.minDiscount || 45;

const storeConfig = {
  sid: process.env.SWIGGY_STORE_ID || config.store.sid,
  pid: process.env.SWIGGY_PRIMARY_STORE_ID || config.store.pid,
  secid: process.env.SWIGGY_SECONDARY_STORE_ID || config.store.secid
};

// Parse command line arguments
const args = process.argv.slice(2);
let mode = 'auto';
let skipSync = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--skip-sync') {
    skipSync = true;
  } else if (!arg.startsWith('--')) {
    mode = arg.toLowerCase();
  }
}

/**
 * Top-of-hour synchronization:
 * If the runner woke up early (e.g. at minute 55-59 in IST),
 * calculate remaining milliseconds to :00:00 sharp and wait.
 */
async function syncToHourMark(skip = false) {
  if (skip) {
    console.log('[Sync] Top-of-hour synchronization skipped via --skip-sync.');
    return;
  }

  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + istOffsetMs);
  const mins = istNow.getUTCMinutes();
  const secs = istNow.getUTCSeconds();
  const ms = istNow.getUTCMilliseconds();

  if (mins >= 55 && mins <= 59) {
    const minsLeft = 60 - mins;
    const msToWait = (minsLeft * 60 * 1000) - (secs * 1000) - ms;
    if (msToWait > 0 && msToWait <= 5 * 60 * 1000) {
      console.log(`[Sync] Runner woke up early at ${mins}:${String(secs).padStart(2, '0')} IST.`);
      console.log(`[Sync] Waiting ${(msToWait / 1000).toFixed(1)}s until :00:00 IST sharp for fresh hourly deals...`);
      await sleep(msToWait);
      console.log('[Sync] Top of the hour reached (:00:00 IST)! Commencing deal scrape.');
    }
  } else {
    console.log(`[Sync] Running immediately (minute ${mins} is outside pre-hour window 55-59).`);
  }
}

async function main() {
  console.log(`[CronRunner] Mode: ${mode.toUpperCase()} | Store: ${storeConfig.sid}`);

  // Synchronize to :00:00 IST if runner booted early in pre-hour window
  await syncToHourMark(skipSync);

  let bot = null;
  if (token && token !== 'your_bot_token_here') {
    bot = new TelegramBot(token, { polling: false });
  } else {
    console.warn('[CronRunner] No TELEGRAM_BOT_TOKEN configured. Will scrape and cache without sending Telegram alerts.');
  }

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const istDay = istDate.getUTCDay(); // 3 = Wednesday
  const istHours = istDate.getUTCHours();
  const istMinutes = istDate.getUTCMinutes();

  console.log(`[CronRunner] Active IST Time: ${istDate.toUTCString()} (Day: ${istDay}, Hour: ${istHours}:${String(istMinutes).padStart(2, '0')})`);

  let shouldRunEssentials = false;
  let shouldRunBazaar = false;
  let shouldRunNoice = false;

  // Accept 'keywords' alias for backwards compatibility with workflow triggers
  if (mode === 'keywords' || mode === 'essentials' || mode === 'aisles') {
    shouldRunEssentials = true;
  } else if (mode === 'bazaar') {
    shouldRunBazaar = true;
  } else if (mode === 'noice') {
    shouldRunNoice = true;
  } else {
    // Auto Mode:
    // 1. Wednesday midnight window (12:00 AM - 12:30 AM IST on Wednesday)
    if (istDay === 3 && istHours === 0) {
      shouldRunBazaar = true;
    }
    // 2. Essential Aisles Hunter between 9:00 AM and 10:00 PM IST
    if (istHours >= 9 && (istHours < 22 || (istHours === 22 && istMinutes <= 15))) {
      shouldRunEssentials = true;
    }
  }

  const essentialConfig = config.campaigns?.essentialAisles || {};
  const essentialThreshold = parseInt(process.env.MIN_DISCOUNT_PERCENT, 10) || essentialConfig.minDiscount || minDiscount || 45;

  if (shouldRunEssentials) {
    console.log(`\n--- Running Essential Aisles Scout (19 Subcategories) ---`);

    let items = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[EssentialAisles] Attempt ${attempts}/${maxAttempts} - Fetching deals...`);
        items = await fetchEssentialAisleDeals(storeConfig, {
          subcategories: essentialConfig.subcategories
        });

        if (items && items.length > 0) {
          console.log(`[EssentialAisles] Attempt ${attempts} succeeded: scraped ${items.length} items across 19 aisles.`);
          break;
        } else {
          console.warn(`[EssentialAisles] Attempt ${attempts} returned 0 items.`);
          if (attempts < maxAttempts) {
            console.log(`[EssentialAisles] Waiting 6s before retry ${attempts + 1}...`);
            await sleep(6000);
          }
        }
      } catch (e) {
        console.error(`[EssentialAisles] Attempt ${attempts} error:`, e.message);
        if (attempts < maxAttempts) {
          console.log(`[EssentialAisles] Waiting 6s before retry ${attempts + 1}...`);
          await sleep(6000);
        }
      }
    }

    if (items.length > 0) {
      const alerts = findAlertWorthyDeals(items, essentialThreshold, 'essentialAisles');
      console.log(`[EssentialAisles] Found ${alerts.length} alert-worthy deals (Discount ≥ ${essentialThreshold}%).`);
      if (bot && chatId && alerts.length > 0) {
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const timeString = timeFormatter.format(new Date()) + ' IST';
        await sendBatchAlerts(bot, chatId, alerts, { timeString });
      } else if (!alerts.length) {
        console.log(`[EssentialAisles] No items met the minimum discount threshold (${essentialThreshold}%) this run.`);
      }
    } else {
      console.error('[EssentialAisles] All retry attempts failed or returned 0 items.');
    }
  }

  if (shouldRunBazaar) {
    console.log('\n--- Running Wednesday Bazaar Scan ---');
    try {
      const items = await fetchWednesdayBazaarDeals(storeConfig);
      console.log(`[Bazaar] Scraped ${items.length} items.`);
      const alerts = findAlertWorthyDeals(items, minDiscount, 'wednesdayBazaar');
      console.log(`[Bazaar] Found ${alerts.length} new/improved deals >= ${minDiscount}%.`);
      if (bot && chatId && alerts.length > 0) {
        await sendBatchAlerts(bot, chatId, alerts);
      }
    } catch (e) {
      console.error('[Bazaar] Error:', e.message);
    }
  }

  if (shouldRunNoice) {
    console.log('\n--- Running Legacy NOICE Store Scan ---');
    try {
      const items = await fetchNoiceDeals(storeConfig);
      console.log(`[NOICE] Scraped ${items.length} items.`);
      const alerts = findAlertWorthyDeals(items, minDiscount, 'noice');
      console.log(`[NOICE] Found ${alerts.length} new/improved deals >= ${minDiscount}%.`);
      if (bot && chatId && alerts.length > 0) {
        await sendBatchAlerts(bot, chatId, alerts);
      }
    } catch (e) {
      console.error('[NOICE] Error:', e.message);
    }
  }

  console.log('\n[CronRunner] Execution finished successfully.');
}

main().catch((err) => {
  console.error('[CronRunner] Fatal error:', err);
  process.exit(1);
});
