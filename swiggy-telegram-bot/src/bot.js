require('dotenv').config();
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config.json');
const { fetchKeywordDeals, fetchWednesdayBazaarDeals, fetchCategoryDeals, INSTAMART_CATEGORIES } = require('./swiggyApi');
const { findAlertWorthyDeals, getCachedDeals, loadCache } = require('./dealTracker');
const { sendBatchAlerts } = require('./notifier');
const { resolvePincode } = require('./geo');
const { getUser, updateUser } = require('./userManager');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let minDiscount = config.minDiscount || 50;

const storeConfig = {
  sid: process.env.SWIGGY_STORE_ID || config.store.sid,
  pid: process.env.SWIGGY_PRIMARY_STORE_ID || config.store.pid,
  secid: process.env.SWIGGY_SECONDARY_STORE_ID || config.store.secid
};

const khConfig = config.campaigns?.keywordHunter || {};
const khThresholds = khConfig.thresholds || { essentials: 65, nonEssentials: 75 };

console.log('====================================================');
console.log('⚡ Instamart Telegram Deal Alert Bot');
console.log(`📍 Store ID: ${storeConfig.sid} (Primary: ${storeConfig.pid}, Secondary: ${storeConfig.secid})`);
console.log(`🎯 Minimum Alert Discounts: Essentials ≥${khThresholds.essentials}% OFF, Snacks ≥${khThresholds.nonEssentials}% OFF (Bazaar/Categories: 50%)`);
console.log('====================================================');

let bot = null;
if (token && token !== 'your_bot_token_here') {
  bot = new TelegramBot(token, { polling: true });
  console.log('🤖 Telegram Bot is connected and listening for commands!');

  // Register commands for the Telegram Menu button
  bot.setMyCommands([
    { command: 'start', description: 'Show welcome message & menu' },
    { command: 'categories', description: 'Scan categories for deals (≥50% OFF)' },
    { command: 'bazaar', description: 'Scan Wednesday Bazaar (≥50% OFF)' },
    { command: 'pincode', description: 'View or set delivery pincode' },
    { command: 'setdiscount', description: 'Change min alert % (e.g. /setdiscount 50)' },
    { command: 'myinfo', description: 'View your profile & active store' },
    { command: 'status', description: 'Check bot status & scan schedules' }
  ]).catch(err => console.error('[Bot] Failed to set menu commands:', err.message));
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not configured in .env.');
  console.warn('   Add your bot token to .env to enable Telegram alerts and interactive commands.');
  console.warn('   The scraper will still run and log deals to data/deals_cache.json!');
}

// Handler: Run Keyword Deal Hunter scan
async function runKeywordScan(notifyChat = null) {
  const user = notifyChat ? getUser(notifyChat, storeConfig) : null;
  const userStore = user ? { sid: user.storeId, pid: user.primaryStoreId, secid: user.secondaryStoreId } : storeConfig;
  const keywordHunterConfig = config.campaigns?.keywordHunter || {};
  const keywordThresholds = keywordHunterConfig.thresholds || { essentials: 65, nonEssentials: 75 };

  console.log(`[${new Date().toLocaleTimeString()}] Starting Keyword Deal Hunter scan for store ${userStore.sid}…`);
  try {
    const items = await fetchKeywordDeals(userStore, {
      categories: keywordHunterConfig.categories,
      thresholds: keywordThresholds
    });
    console.log(`[KeywordHunter] Scanned ${items.length} total items across target queries.`);

    const alerts = findAlertWorthyDeals(items, keywordThresholds, 'keywordHunter');
    console.log(`[KeywordHunter] Found ${alerts.length} deals matching tiered thresholds (Essentials ≥${keywordThresholds.essentials}%, Snacks ≥${keywordThresholds.nonEssentials}%).`);

    const targetChat = notifyChat || chatId;
    if (bot && targetChat && alerts.length > 0) {
      await sendBatchAlerts(bot, targetChat, alerts, { workerInfo: 'Keyword Hunter' });
    } else if (bot && targetChat && alerts.length === 0) {
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const locText = user?.area ? ` in ${user.area}` : '';
      bot.sendMessage(
        targetChat,
        `ℹ️ <b>[Keyword Deal Hunter • ${timeStr}]</b>\nScanned essentials & snacks${locText}. No deals found above thresholds (Essentials ≥<b>${keywordThresholds.essentials}%</b>, Snacks ≥<b>${keywordThresholds.nonEssentials}%</b>) right now.`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (err) {
    console.error('[KeywordHunter] Scan error:', err);
    const targetChat = notifyChat || chatId;
    if (bot && targetChat) bot.sendMessage(targetChat, '❌ Error during Keyword Deal Hunter scan: ' + err.message);
  }
}

// Handler: Run Wednesday Bazaar scan
async function runWednesdayBazaarScan(notifyChat = null) {
  const user = notifyChat ? getUser(notifyChat, storeConfig) : null;
  const userStore = user ? { sid: user.storeId, pid: user.primaryStoreId, secid: user.secondaryStoreId } : storeConfig;
  const bazaarMinDiscount = config.campaigns?.wednesdayBazaar?.minDiscount || 50;

  console.log(`[${new Date().toLocaleTimeString()}] Starting Wednesday Bazaar scan for store ${userStore.sid}…`);
  try {
    const items = await fetchWednesdayBazaarDeals(userStore);
    console.log(`[Bazaar] Scanned ${items.length} total items.`);

    const alerts = findAlertWorthyDeals(items, bazaarMinDiscount, 'wednesdayBazaar');
    console.log(`[Bazaar] Found ${alerts.length} deals matching >= ${bazaarMinDiscount}% OFF threshold.`);

    const targetChat = notifyChat || chatId;
    if (bot && targetChat && alerts.length > 0) {
      await sendBatchAlerts(bot, targetChat, alerts);
    } else if (bot && targetChat && alerts.length === 0) {
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const locText = user?.area ? ` in ${user.area}` : '';
      bot.sendMessage(
        targetChat,
        `ℹ️ <b>[Wednesday Bazaar Scan • ${timeStr}]</b>\nScanned <b>${items.length} items</b>${locText}. No deals found above <b>${bazaarMinDiscount}% OFF</b> right now.`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (err) {
    console.error('[Bazaar] Scan error:', err);
    const targetChat = notifyChat || chatId;
    if (bot && targetChat) bot.sendMessage(targetChat, '❌ Error during Wednesday Bazaar scan: ' + err.message);
  }
}

// Scheduled Jobs
// 1. Keyword Deal Hunter: Hourly between 10:00 AM and 9:05 PM (at minute 5)
const keywordCron = config.campaigns?.keywordHunter?.cron || '5 10-21 * * *';
cron.schedule(keywordCron, () => {
  console.log('⏰ Scheduled Trigger: Keyword Deal Hunter Hourly Scan');
  runKeywordScan();
});
console.log(`📅 Scheduled: Keyword Deal Hunter (${config.campaigns?.keywordHunter?.description || 'Hourly'}) [${keywordCron}]`);

// 2. Wednesday Bazaar: Every Wednesday at 12:02 AM
const bazaarCron = config.campaigns.wednesdayBazaar.cron || '2 0 * * 3';
cron.schedule(bazaarCron, () => {
  console.log('⏰ Scheduled Trigger: Wednesday Bazaar Scan');
  runWednesdayBazaarScan();
});
console.log(`📅 Scheduled: Wednesday Bazaar scan (${config.campaigns.wednesdayBazaar.description}) [${bazaarCron}]`);

// Telegram Bot Interactive Commands & Event Handlers
if (bot) {
  // Reject media/file uploads
  const rejectMedia = (msg) => {
    bot.sendMessage(
      msg.chat.id,
      '⚠️ <b>Uploads are disabled.</b>\n\nPlease choose an option from the <b>Menu</b> button or send your 6-digit pincode (e.g. <code>560032</code>).',
      { parse_mode: 'HTML' }
    );
  };
  bot.on('photo', rejectMedia);
  bot.on('document', rejectMedia);
  bot.on('audio', rejectMedia);
  bot.on('video', rejectMedia);
  bot.on('voice', rejectMedia);
  bot.on('sticker', rejectMedia);

  // Welcome & Help
  bot.onText(/\/start|\/help/, (msg) => {
    const text = 
`👋 <b>Welcome to Instamart Hunter Deal Bot!</b>

I monitor <b>Keyword Deals</b> (Essentials & Snacks), <b>Wednesday Bazaar</b>, and all <b>Grocery Categories</b> on Swiggy Instamart to find you maximum discounts!

📍 <b>Location & Store:</b>
• Send your 6-digit pincode (e.g. <code>560032</code>) or <code>/pincode 560032</code>
• <code>/setstore &lt;id&gt; [secId]</code> — Link your exact Swiggy dark store pod ID
• <code>/myinfo</code> — View your current location, assigned store, and discount filter

🛍️ <b>Deal Scanners:</b>
• <code>/categories</code> — Browse categories (Vegetables, Fruits, Staples, etc.) for deals <b>≥ 50% OFF</b>
• <code>/bazaar</code> — Scan Wednesday Bazaar Top Deals (≥ 50% OFF)
• <i>Keyword Deal Hunter</i> — Scanned automatically <b>every hour</b> (Essentials ≥ 65%, Snacks ≥ 75%)
• <code>/setdiscount &lt;num&gt;</code> — Change your alert threshold (e.g. <code>/setdiscount 50</code>)
• <code>/status</code> — Check bot configuration and last run stats

<i>💡 Tap the <b>Menu</b> button at the bottom left to quickly pick any command!</i>`;

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  });

  // Reusable pincode handler
  async function handlePincodeInput(chatId, pin) {
    bot.sendMessage(chatId, `🔍 Looking up location for pincode <b>${pin}</b>…`, { parse_mode: 'HTML' });
    const geo = await resolvePincode(pin);
    if (!geo) {
      return bot.sendMessage(
        chatId,
        `❌ Could not find location for pincode <b>${pin}</b>. Please ensure it is a valid 6-digit Indian postal code.`,
        { parse_mode: 'HTML' }
      );
    }

    const user = getUser(chatId, storeConfig);
    updateUser(chatId, {
      pincode: geo.pincode,
      area: geo.area,
      lat: geo.lat,
      lng: geo.lng
    });

    bot.sendMessage(
      chatId,
      `✅ Location set to: <b>${geo.area}</b> (PIN: ${geo.pincode})\n` +
      `🏪 Active Store Pod: <code>${user.storeId}</code>\n\n` +
      `💡 <i>Note: Instamart dark stores serve hyper-local 2-3km radii. If your neighborhood uses a specific warehouse pod, you can link it directly with <code>/setstore &lt;id&gt;</code>.</i>`,
      { parse_mode: 'HTML' }
    );
  }

  // Direct 6-digit pincode message (e.g. user just types "560032")
  bot.onText(/^\s*(\d{6})\s*$/, async (msg, match) => {
    await handlePincodeInput(msg.chat.id, match[1]);
  });

  // /pincode command
  bot.onText(/\/pincode(?:\s+(\d{6}))?/, async (msg, match) => {
    const pin = match[1];
    if (!pin) {
      const user = getUser(msg.chat.id, storeConfig);
      const loc = user.area ? `<b>${user.area}</b> (PIN: <code>${user.pincode}</code>)` : 'Not set (using default store)';
      return bot.sendMessage(
        msg.chat.id,
        `📍 <b>Your Current Location</b>: ${loc}\n` +
        `🏪 <b>Store ID</b>: <code>${user.storeId}</code>\n\n` +
        `To update your delivery pincode, simply send your 6-digit PIN code:\n` +
        `Example: <code>560038</code> or <code>/pincode 560038</code>`,
        { parse_mode: 'HTML' }
      );
    }
    await handlePincodeInput(msg.chat.id, pin);
  });

  bot.onText(/\/setstore\s+(\d+)(?:\s+(\d+))?/, (msg, match) => {
    const sid = match[1];
    const secid = match[2] || sid;
    updateUser(msg.chat.id, {
      storeId: sid,
      primaryStoreId: sid,
      secondaryStoreId: secid
    });
    bot.sendMessage(
      msg.chat.id,
      `✅ <b>Store configuration updated:</b>\n• <b>Primary Store ID</b>: <code>${sid}</code>\n• <b>Secondary Store ID</b>: <code>${secid}</code>\n\nLive scans will now pull catalogs directly from this warehouse pod!`,
      { parse_mode: 'HTML' }
    );
  });

  bot.onText(/\/myinfo/, (msg) => {
    const user = getUser(msg.chat.id, storeConfig);
    const loc = user.area ? `${user.area} (${user.pincode})` : 'Default';
    bot.sendMessage(
      msg.chat.id,
      `👤 <b>Your Profile & Preferences</b>:\n` +
      `• <b>Chat ID</b>: <code>${msg.chat.id}</code>\n` +
      `• <b>Location</b>: ${loc}\n` +
      `• <b>Store ID</b>: <code>${user.storeId}</code> (Primary: <code>${user.primaryStoreId}</code>, Sec: <code>${user.secondaryStoreId}</code>)\n` +
      `• <b>Minimum Discount</b>: <b>${user.minDiscount}% OFF</b>`,
      { parse_mode: 'HTML' }
    );
  });

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  bot.onText(/\/noice/, (msg) => {
    const kh = config.campaigns?.keywordHunter || {};
    const eCut = kh.thresholds?.essentials || 65;
    const nCut = kh.thresholds?.nonEssentials || 75;
    bot.sendMessage(
      msg.chat.id,
      'ℹ️ <b>Keyword Deal Hunter (Hourly Automatic Scan):</b>\n\n' +
      'The NOICE scan has been upgraded to the more comprehensive <b>Keyword Deal Hunter</b>!\n\n' +
      `The bot automatically searches essential groceries (≥ <b>${eCut}% OFF</b>) and snacks & treats (≥ <b>${nCut}% OFF</b>) <b>every hour</b> (10:00 AM – 9:05 PM) across your dark store pod and alerts you immediately.\n\n` +
      '💡 <i>On-demand keyword scans are disabled to conserve API calls and avoid rate limits. Tap <b>/categories</b> to scan specific grocery departments on demand.</i>',
      { parse_mode: 'HTML' }
    );
  });

  // /categories command: Interactive inline keyboard for departments
  bot.onText(/\/categories/, (msg) => {
    const inline_keyboard = [];
    const keys = Object.keys(INSTAMART_CATEGORIES);
    for (let i = 0; i < keys.length; i += 2) {
      const row = [];
      const k1 = keys[i];
      const c1 = INSTAMART_CATEGORIES[k1];
      row.push({ text: `${c1.icon} ${c1.name}`, callback_data: `cat:${k1}` });

      if (i + 1 < keys.length) {
        const k2 = keys[i + 1];
        const c2 = INSTAMART_CATEGORIES[k2];
        row.push({ text: `${c2.icon} ${c2.name}`, callback_data: `cat:${k2}` });
      }
      inline_keyboard.push(row);
    }

    bot.sendMessage(
      msg.chat.id,
      '🛒 <b>Instamart Category Deals:</b>\n\n' +
      'Choose any category below to scan all its subcategories for deals with <b>≥ 50% OFF</b>:',
      {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard }
      }
    );
  });

  // Handle category button click with live progress loop
  bot.on('callback_query', async (query) => {
    const data = query.data || '';
    if (!data.startsWith('cat:')) return;

    const catKey = data.split(':')[1];
    const catObj = INSTAMART_CATEGORIES[catKey];
    if (!catObj) {
      return bot.answerCallbackQuery(query.id, { text: 'Category not found' });
    }

    await bot.answerCallbackQuery(query.id, { text: `Scanning ${catObj.name}…` });

    const chatId = query.message.chat.id;
    const user = getUser(chatId, storeConfig);
    const userStore = { sid: user.storeId, pid: user.primaryStoreId, secid: user.secondaryStoreId };
    const cutoff = 50; // User requirement: >= 50% off for categories

    const statusMsg = await bot.sendMessage(
      chatId,
      `🔄 <b>Preparing scan for ${catObj.icon} ${catObj.name}…</b>\n<i>Connecting to warehouse pod ${userStore.sid}…</i>`,
      { parse_mode: 'HTML' }
    );

    let lastEditTime = Date.now();
    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    const onProgress = async (current, total, subName) => {
      const now = Date.now();
      if (now - lastEditTime > 1400 || current === total) {
        lastEditTime = now;
        const spinner = spinnerFrames[current % spinnerFrames.length];
        const progressText =
          `🔄 <b>Scanning ${catObj.icon} ${catObj.name}</b>\n` +
          `${spinner} [${current}/${total}] <i>${escapeHtml(subName)}</i>…`;
        await bot.editMessageText(progressText, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: 'HTML'
        }).catch(() => {});
      }
    };

    try {
      const items = await fetchCategoryDeals(catKey, userStore, onProgress);
      const deals = items.filter((item) => item.discount >= cutoff);

      if (deals.length > 0) {
        await bot.editMessageText(
          `✅ <b>Found ${deals.length} deals ≥ ${cutoff}% OFF in ${catObj.icon} ${catObj.name}!</b>`,
          { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' }
        ).catch(() => {});

        const formattedDeals = deals.map((d) => ({
          ...d,
          alertType: 'NEW_DEAL',
          campaignKey: `category:${catKey}`,
          categoryTitle: `${catObj.icon} ${catObj.name}`
        }));

        await sendBatchAlerts(bot, chatId, formattedDeals);
      } else {
        await bot.editMessageText(
          `ℹ️ <b>${catObj.icon} ${catObj.name}</b>\nScanned all subcategories. No items found above <b>${cutoff}% OFF</b> right now.`,
          { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'HTML' }
        ).catch(() => {});
      }
    } catch (err) {
      console.error(`[CategoryScan] Error scanning ${catKey}:`, err);
      bot.editMessageText(
        `❌ Error scanning ${catObj.name}: ${err.message}`,
        { chat_id: chatId, message_id: statusMsg.message_id }
      ).catch(() => {});
    }
  });

  bot.onText(/\/bazaar/, (msg) => {
    bot.sendMessage(msg.chat.id, '🔍 Scanning <b>Wednesday Bazaar Top Deals</b> across all pages… please wait ~10-15s.', { parse_mode: 'HTML' });
    runWednesdayBazaarScan(msg.chat.id);
  });

  bot.onText(/\/setdiscount\s+(\d+)/, (msg, match) => {
    const val = parseInt(match[1], 10);
    if (val >= 5 && val <= 90) {
      updateUser(msg.chat.id, { minDiscount: val });
      bot.sendMessage(msg.chat.id, `✅ Your personal alert threshold updated to <b>${val}% OFF</b>.`, { parse_mode: 'HTML' });
    } else {
      bot.sendMessage(msg.chat.id, '❌ Please enter a percentage between 5 and 90 (e.g. <code>/setdiscount 40</code>).', { parse_mode: 'HTML' });
    }
  });

  bot.onText(/\/status/, (msg) => {
    const cache = loadCache();
    const user = getUser(msg.chat.id, storeConfig);
    const khRun = (cache.lastRuns?.keywordHunter || cache.lastRuns?.noice)
      ? new Date((cache.lastRuns?.keywordHunter || cache.lastRuns?.noice).timestamp).toLocaleString()
      : 'Never';
    const bazaarRun = cache.lastRuns?.wednesdayBazaar
      ? new Date(cache.lastRuns.wednesdayBazaar.timestamp).toLocaleString()
      : 'Never';
    const kh = config.campaigns?.keywordHunter || {};
    const eCut = kh.thresholds?.essentials || 65;
    const nCut = kh.thresholds?.nonEssentials || 75;

    const statusText = 
`📊 <b>Bot Status</b>:
• <b>Status</b>: 🟢 Running
• <b>Default Store ID</b>: <code>${storeConfig.sid}</code>
• <b>Your Store ID</b>: <code>${user.storeId}</code>
• <b>Keyword Cutoffs</b>: Essentials ≥ <b>${eCut}% OFF</b> | Snacks ≥ <b>${nCut}% OFF</b>
• <b>Total Tracked Items</b>: ${Object.keys(cache.items || {}).length}
• <b>Last Keyword Scan</b>: ${khRun}
• <b>Last Bazaar Scan</b>: ${bazaarRun}
• <b>Schedules</b>:
  - Keyword Hunter: Every hour (10:00 AM – 9:05 PM)
  - Wednesday Bazaar: Every Wednesday at 12:02 AM`;

    bot.sendMessage(msg.chat.id, statusText, { parse_mode: 'HTML' });
  });
}
