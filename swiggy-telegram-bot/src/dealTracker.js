const fs = require('fs');
const path = require('path');

function getCacheFilePath(campaignKey = 'default') {
  return path.join(__dirname, '..', 'data', `deals_cache_${campaignKey}.json`);
}

function ensureDataDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadCache(campaignKey = 'default') {
  const filePath = getCacheFilePath(campaignKey);
  ensureDataDir(filePath);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`[DealTracker] Could not load cache for ${campaignKey}, starting fresh:`, e.message);
  }
  return {
    lastDate: null,
    lastRunId: null,
    lastRunHour: null,
    items: {},
    lastRuns: {}
  };
}

function saveCache(cache, campaignKey = 'default') {
  const filePath = getCacheFilePath(campaignKey);
  ensureDataDir(filePath);
  try {
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error(`[DealTracker] Error saving cache for ${campaignKey}:`, e.message);
  }
}

function getIstContext(overrideDate = null, overrideHour = null) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const dateStr = overrideDate || istDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
  const hour = overrideHour !== null ? overrideHour : istDate.getUTCHours(); // 0 to 23
  const runId = `${dateStr}-${hour}`;
  return { dateStr, hour, runId, now: now.getTime() };
}

/**
 * Evaluates a list of fetched items against the minimum discount threshold.
 * 
 * Consecutive-Run Suppression Logic:
 * 1. Morning reset: At 10:00 AM IST (the first run of the day), or when calendar day changes,
 *    all deals meeting the threshold are alerted to present the day's deals catalog.
 * 2. Subsequent runs (11 AM to 10 PM IST + 12 AM midnight):
 *    - An item is alerted ONLY if:
 *        a) It is a NEW deal (never seen before), OR
 *        b) It is a PRICE DROP (cheaper than last alerted price), OR
 *        c) It RETURNED after being absent (was NOT present in the immediately preceding run).
 *    - If it was present in the immediately preceding run at the SAME price,
 *      it is suppressed so users don't see repeated items every single hour.
 */
function findAlertWorthyDeals(items, minDiscount = 70, campaignKey = 'default', options = {}) {
  const cache = loadCache(campaignKey);
  const alertList = [];
  const { dateStr, hour, runId, now } = getIstContext(options.overrideDate, options.overrideHour);

  // First run of the day: 10:00 AM IST or calendar day change
  const isFirstRunOfDay = (cache.lastDate !== dateStr) || (hour === 10 && cache.lastRunHour !== 10);
  const lastRunId = cache.lastRunId;

  for (const item of items) {
    let threshold = 70;
    if (typeof minDiscount === 'object' && minDiscount !== null) {
      threshold = item.dealType === 'essential'
        ? (minDiscount.essentials || 70)
        : (minDiscount.nonEssentials || 70);
    } else if (typeof minDiscount === 'number') {
      threshold = minDiscount;
    }

    if (item.discount < threshold) continue;

    const itemKey = `${item.skuId || item.name}`;
    const prev = cache.items[itemKey];

    const isPriceDrop = prev && (item.price < prev.lastAlertedPrice);
    const wasInPreviousRun = prev && (prev.lastSeenRunId === lastRunId);
    const alreadyAlertedToday = prev && (prev.lastAlertedDate === dateStr);

    let shouldAlert = false;
    let alertType = 'NEW_DEAL';

    if (isFirstRunOfDay) {
      // First run of the day: alert all valid deals
      shouldAlert = true;
      alertType = prev ? 'DAILY_DROP' : 'NEW_DEAL';
    } else if (!prev) {
      // Brand new item never seen before
      shouldAlert = true;
      alertType = 'NEW_DEAL';
    } else if (isPriceDrop) {
      // Price reduced further
      shouldAlert = true;
      alertType = 'PRICE_DROP';
    } else if (!wasInPreviousRun) {
      // Item was absent in the immediately preceding run and came back after a few hours
      shouldAlert = true;
      alertType = 'BACK_IN_STOCK';
    } else if (alreadyAlertedToday && wasInPreviousRun) {
      // Stays at the same price consecutively: suppress alert
      shouldAlert = false;
    } else {
      shouldAlert = true;
    }

    if (shouldAlert) {
      alertList.push({
        ...item,
        alertType,
        prevPrice: prev ? prev.lastAlertedPrice : null,
        prevDiscount: prev ? prev.discount : null,
        campaignKey,
        dealType: item.dealType || campaignKey,
        searchQuery: item.searchQuery || ''
      });

      cache.items[itemKey] = {
        name: item.name,
        price: item.price,
        mrp: item.mrp,
        discount: item.discount,
        lastAlertedPrice: item.price,
        lastAlertedDate: dateStr,
        lastSeenRunId: runId,
        firstSeen: prev ? prev.firstSeen : now,
        lastSeen: now
      };
    } else {
      // Keep tracking presence in cache without triggering Telegram alert
      cache.items[itemKey].lastSeenRunId = runId;
      cache.items[itemKey].price = item.price;
      cache.items[itemKey].discount = item.discount;
      cache.items[itemKey].lastSeen = now;
    }
  }

  // Sort deals descending by discount percentage (highest discount first)
  alertList.sort((a, b) => b.discount - a.discount);

  // Update run metadata
  cache.lastDate = dateStr;
  cache.lastRunHour = hour;
  cache.lastRunId = runId;
  cache.lastRuns[runId] = {
    timestamp: now,
    totalItems: items.length,
    alertsFound: alertList.length
  };

  saveCache(cache, campaignKey);
  return alertList;
}

function getCachedDeals(campaignKey = 'default', minDiscount = 0) {
  const cache = loadCache(campaignKey);
  const result = [];
  for (const [key, val] of Object.entries(cache.items || {})) {
    if (val.discount >= minDiscount) {
      result.push(val);
    }
  }
  result.sort((a, b) => b.discount - a.discount);
  return result;
}

module.exports = {
  loadCache,
  saveCache,
  findAlertWorthyDeals,
  getCachedDeals,
  getIstContext
};
