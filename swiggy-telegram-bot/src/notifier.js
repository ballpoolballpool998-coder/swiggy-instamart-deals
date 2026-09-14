const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDealMessage(deal) {
  const isDrop = deal.alertType === 'PRICE_DROP';
  const discountLine = isDrop
    ? `📉 <b>Discount:</b> ${deal.prevDiscount}% ➔ <b>${deal.discount}% OFF</b> (Price Drop!)`
    : `🎯 <b>Discount:</b> <b>${deal.discount}% OFF</b>`;

  let campaignBadge = '✨ <i>The NOICE Store</i>';
  if (deal.campaignKey === 'wednesdayBazaar') {
    campaignBadge = '🛍️ <i>Wednesday Bazaar (Top Deals)</i>';
  } else if (deal.campaignKey === 'keywordHunter') {
    if (deal.dealType === 'essential') {
      campaignBadge = `🥛 <b>Essential Grocery Deal</b> (<i>${escapeHtml(deal.searchQuery || 'Essentials')}</i>)`;
    } else {
      campaignBadge = `🍿 <b>Snacks & Treats Deal</b> (<i>${escapeHtml(deal.searchQuery || 'Snacks')}</i>)`;
    }
  } else if (deal.campaignKey && deal.campaignKey.startsWith('category:')) {
    campaignBadge = `🛒 <i>${deal.categoryTitle || deal.category || 'Category Deals'}</i>`;
  }

  const savings = Math.max(0, Math.round(deal.mrp - deal.price));
  const packInfo = deal.pack ? ` (${escapeHtml(deal.pack)})` : '';
  const catLine = deal.subCategory
    ? `🏷️ <b>Subcategory:</b> ${escapeHtml(deal.subCategory)}`
    : (deal.category ? `🏷️ <b>Category:</b> ${escapeHtml(deal.category)}` : '');
  const ratingInfo = deal.rating ? ` ⭐ ${escapeHtml(deal.rating)}` : '';
  const safeUrl = (deal.searchLink || '').replace(/"/g, '%22');

  return (
`${campaignBadge}

📦 <b>${escapeHtml(deal.name)}</b>${packInfo}
${discountLine}
💰 <b>₹${deal.price}</b> <s>₹${deal.mrp}</s> (Save ₹${savings})${ratingInfo}
${catLine}

🛒 <a href="${safeUrl}">Search &amp; Add on Instamart</a>`
  );
}

async function sendDealAlert(bot, chatId, deal) {
  const text = formatDealMessage(deal);

  try {
    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    return true;
  } catch (err) {
    console.error('[Notifier] Failed to send alert for:', deal.name, err.message);
    return false;
  }
}

async function sendBatchAlerts(bot, chatId, deals) {
  if (!deals || !deals.length) return;
  console.log(`[Notifier] Sending ${deals.length} alerts to chat ${chatId}…`);

  for (let i = 0; i < deals.length; i++) {
    await sendDealAlert(bot, chatId, deals[i]);
    // Polite pause to stay well under Telegram rate limits
    if (i < deals.length - 1) {
      await sleep(1000);
    }
  }
}

module.exports = {
  formatDealMessage,
  sendDealAlert,
  sendBatchAlerts
};
