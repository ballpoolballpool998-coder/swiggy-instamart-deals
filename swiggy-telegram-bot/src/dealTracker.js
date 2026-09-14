const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'deals_cache.json');

function ensureDataDir() {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadCache() {
  ensureDataDir();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn('[DealTracker] Could not load cache, starting fresh:', e.message);
  }
  return { items: {}, lastRuns: {} };
}

function saveCache(cache) {
  ensureDataDir();
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('[DealTracker] Error saving cache:', e.message);
  }
}

/**
 * Evaluates a list of fetched items against the minimum discount threshold.
 * Deduplication / spam suppression is removed: all current deals meeting the
 * threshold are returned on every scan so the user can verify them in real-time.
 */
function findAlertWorthyDeals(items, minDiscount = 30, campaignKey = 'keywordHunter') {
  const cache = loadCache();
  const alertList = [];
  const now = Date.now();

  for (const item of items) {
    let threshold = 30;
    if (typeof minDiscount === 'object' && minDiscount !== null) {
      threshold = item.dealType === 'essential'
        ? (minDiscount.essentials || 65)
        : (minDiscount.nonEssentials || 75);
    } else if (typeof minDiscount === 'number') {
      threshold = minDiscount;
    }

    if (item.discount < threshold) continue;

    const cacheKey = `${campaignKey}:${item.skuId || item.name}`;
    const prev = cache.items[cacheKey];

    const isPriceDrop = prev && item.price < prev.price;
    const alertType = isPriceDrop ? 'PRICE_DROP' : 'NEW_DEAL';

    alertList.push({
      ...item,
      alertType,
      prevPrice: prev ? prev.price : null,
      prevDiscount: prev ? prev.discount : null,
      campaignKey,
      dealType: item.dealType || 'essential',
      searchQuery: item.searchQuery || ''
    });

    cache.items[cacheKey] = {
      name: item.name,
      price: item.price,
      mrp: item.mrp,
      discount: item.discount,
      lastAlertedPrice: item.price,
      dealType: item.dealType || 'essential',
      searchQuery: item.searchQuery || '',
      firstSeen: prev ? prev.firstSeen : now,
      lastSeen: now
    };
  }

  // Sort deals descending by discount percentage (highest discount first)
  alertList.sort((a, b) => b.discount - a.discount);

  cache.lastRuns[campaignKey] = {
    timestamp: now,
    totalItems: items.length,
    alertsFound: alertList.length
  };

  saveCache(cache);
  return alertList;
}

function getCachedDeals(campaignKey = null, minDiscount = 0) {
  const cache = loadCache();
  const result = [];
  for (const [key, val] of Object.entries(cache.items)) {
    if (campaignKey && !key.startsWith(campaignKey + ':')) continue;
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
  getCachedDeals
};
