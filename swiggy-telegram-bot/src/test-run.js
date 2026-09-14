require('dotenv').config();
const config = require('../config.json');
const { fetchKeywordDeals, fetchWednesdayBazaarDeals, fetchNoiceDeals } = require('./swiggyApi');
const { findAlertWorthyDeals } = require('./dealTracker');

const target = (process.argv[2] || 'keywords').toLowerCase();

async function test() {
  console.log('----------------------------------------------------');
  console.log(`Running test scrape for: ${target.toUpperCase()}`);
  console.log(`Store: ${config.store.sid} (Primary: ${config.store.pid}, Sec: ${config.store.secid})`);
  console.log('----------------------------------------------------');

  let items = [];
  let thresholds = config.campaigns?.keywordHunter?.thresholds || { essentials: 65, nonEssentials: 75 };

  if (target === 'bazaar') {
    items = await fetchWednesdayBazaarDeals(config.store);
    thresholds = config.campaigns?.wednesdayBazaar?.minDiscount || 50;
  } else if (target === 'noice') {
    items = await fetchNoiceDeals(config.store);
    thresholds = 60;
  } else {
    // Test Keyword Deal Hunter with first chunk or subset
    items = await fetchKeywordDeals(config.store, {
      totalChunks: 1,
      chunkIndex: 0
    });
  }

  console.log(`\nSuccessfully fetched ${items.length} items!`);

  // Sort by discount
  items.sort((a, b) => b.discount - a.discount);

  console.log('\nTop Deals Found:');
  console.log('----------------------------------------------------');
  items.slice(0, 15).forEach((item, idx) => {
    const typeLabel = item.dealType ? ` [${item.dealType.toUpperCase()}]` : '';
    const qLabel = item.searchQuery ? ` (Query: ${item.searchQuery})` : '';
    console.log(`${idx + 1}. [${item.discount}% OFF] ${item.name}${typeLabel}${qLabel}`);
    console.log(`   Price: ₹${item.price} (MRP: ₹${item.mrp}) | Brand: ${item.brand || 'N/A'}`);
  });

  const alerts = findAlertWorthyDeals(items, thresholds, target === 'keywords' ? 'keywordHunter' : target);
  console.log('\n----------------------------------------------------');
  if (typeof thresholds === 'object') {
    console.log(`Alert-worthy deals (Essentials >= ${thresholds.essentials}%, Treats >= ${thresholds.nonEssentials}%): ${alerts.length}`);
  } else {
    console.log(`Alert-worthy deals (>= ${thresholds}% OFF): ${alerts.length}`);
  }
  console.log('Cache saved to data/deals_cache.json.');
  console.log('----------------------------------------------------');
}

test().catch(console.error);
