require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config.json');
const { fetchKeywordDeals, fetchWednesdayBazaarDeals, fetchNoiceDeals } = require('./swiggyApi');
const { findAlertWorthyDeals } = require('./dealTracker');
const { sendBatchAlerts } = require('./notifier');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const minDiscount = parseInt(process.env.MIN_DISCOUNT_PERCENT, 10) || config.minDiscount || 50;

const storeConfig = {
  sid: process.env.SWIGGY_STORE_ID || config.store.sid,
  pid: process.env.SWIGGY_PRIMARY_STORE_ID || config.store.pid,
  secid: process.env.SWIGGY_SECONDARY_STORE_ID || config.store.secid
};

// Parse command line arguments
const args = process.argv.slice(2);
let mode = 'auto';
let chunkIndex = 0;
let totalChunks = 1;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--chunk' && args[i + 1] !== undefined) {
    chunkIndex = parseInt(args[i + 1], 10) || 0;
    i++;
  } else if (arg === '--total-chunks' && args[i + 1] !== undefined) {
    totalChunks = parseInt(args[i + 1], 10) || 1;
    i++;
  } else if (!arg.startsWith('--')) {
    mode = arg.toLowerCase();
  }
}

async function main() {
  console.log(`[CronRunner] Mode: ${mode.toUpperCase()} | Store: ${storeConfig.sid} | Chunk: ${chunkIndex + 1}/${totalChunks}`);

  let bot = null;
  if (token && token !== 'your_bot_token_here') {
    // Non-polling instance for single-shot execution
    bot = new TelegramBot(token, { polling: false });
  } else {
    console.warn('[CronRunner] No TELEGRAM_BOT_TOKEN configured. Will scrape and cache without sending Telegram alerts.');
  }

  const now = new Date();
  // Check day and hour in IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const istDay = istDate.getUTCDay(); // 3 = Wednesday
  const istHours = istDate.getUTCHours();
  const istMinutes = istDate.getUTCMinutes();

  console.log(`[CronRunner] Current IST Time: ${istDate.toUTCString()} (Day: ${istDay}, Hour: ${istHours}:${istMinutes})`);

  let shouldRunKeywords = false;
  let shouldRunBazaar = false;
  let shouldRunNoice = false;

  if (mode === 'keywords') {
    shouldRunKeywords = true;
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
    // 2. Keyword Deal Hunter between 10:00 AM and 9:05 PM IST
    if (istHours >= 10 && (istHours < 21 || (istHours === 21 && istMinutes <= 15))) {
      shouldRunKeywords = true;
    }
  }

  const keywordHunterConfig = config.campaigns?.keywordHunter || {};
  const keywordThresholds = keywordHunterConfig.thresholds || {
    essentials: 65,
    nonEssentials: 75
  };

  if (shouldRunKeywords) {
    console.log(`\n--- Running Keyword Deal Hunter (Chunk ${chunkIndex + 1}/${totalChunks}) ---`);
    try {
      const items = await fetchKeywordDeals(storeConfig, {
        chunkIndex,
        totalChunks,
        categories: keywordHunterConfig.categories,
        thresholds: keywordThresholds
      });
      console.log(`[KeywordHunter] Scraped ${items.length} relevant items across target queries.`);
      const alerts = findAlertWorthyDeals(items, keywordThresholds, 'keywordHunter');
      console.log(`[KeywordHunter] Found ${alerts.length} alert-worthy deals (Essentials ≥ ${keywordThresholds.essentials}%, Snacks/Treats ≥ ${keywordThresholds.nonEssentials}%).`);
      if (bot && chatId && alerts.length > 0) {
        await sendBatchAlerts(bot, chatId, alerts);
      }
    } catch (e) {
      console.error('[KeywordHunter] Error:', e.message);
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
