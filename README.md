# 🛒 Swiggy Instamart Deal Hunter & Scout Suite

A comprehensive toolkit for discovering hidden deals, clearance discounts, and high-saving offers on **Swiggy Instamart**:

1. **⚡ Deal Scout (Browser Bookmarklet & Web Portal)**: Interactive in-browser overlay to cherry-pick subcategories and scan live deals directly within your active Swiggy session.
2. **🤖 3-Worker Parallel Deal Hunter (Telegram Bot)**: Automated 24/7 background scraper powered by GitHub Actions matrix runners that tracks 110 curated aisles and sends instant Telegram alerts for deals **≥ 70% OFF** with smart duplicate suppression.

---

## 🌟 Features at a Glance

| Feature | ⚡ Deal Scout Bookmarklet | 🤖 Telegram Bot Deal Hunter |
| :--- | :--- | :--- |
| **Interface** | Visual in-page modal on Swiggy Instamart | Consolidated Telegram channel/chat alerts |
| **Execution** | Client-side (Runs inside your browser) | Cloud-based (3 Parallel GitHub Actions VMs) |
| **Catalog Coverage** | Pre-mapped **36 categories & all subcategories** | **110 Curated Aisles** across 3 parallel workers |
| **Threshold** | User-selected via UI chips (e.g. 50%, 60%, 70%) | **Strict ≥ 70% OFF** (customizable in `config.json`) |
| **Speed** | 1–2 seconds per selected subcategory | ~15–25 seconds total for 110 aisles in parallel |
| **Rate-Limit Safety** | Zero risk (uses your authentic browser cookies) | Independent VM IPs with CloudFront backoff |
| **Spam Prevention** | Interactive table with search & sorting | Consecutive run suppression & morning reset |

---

## ⚡ 1. Deal Scout (Browser Bookmarklet)

The Deal Scout bookmarklet injects a floating control panel on [swiggy.com/instamart](https://www.swiggy.com/instamart), allowing you to scout specific aisles on demand without getting rate-limited.

### 🚀 Quick Installation
1. Visit the GitHub Pages setup portal:
   👉 **`https://jairaj26.github.io/swiggy-instamart-deals/`**
2. Drag the **"🛒 Swiggy Deal Scout"** button directly to your browser's Bookmarks bar.
3. *Alternative (Manual)*:
   - Create a new browser bookmark.
   - Name it `Swiggy Deal Scout`.
   - Copy the one-line code from [`swiggy-hunter-v4.bookmarklet.txt`](swiggy-hunter-v4.bookmarklet.txt) and paste it into the **URL / Location** field.

### 📖 How to Use
1. Navigate to [swiggy.com/instamart](https://www.swiggy.com/instamart) and ensure your delivery location is set.
2. Click the **Swiggy Deal Scout** bookmarklet from your bookmarks bar.
3. Choose a category (e.g. *Atta, Rice & Dal*, *Dairy, Bread & Eggs*, *Chips & Namkeens*):
   - You can fetch all subcategories in that category at once (`Fetch All`), or
   - Toggle individual subcategory chips (e.g. only *Atta* and *Rice*).
4. View live results sorted by highest discount with direct product links!

---

## 🤖 2. Telegram Deal Hunter Bot (3-Worker Architecture)

An automated deal hunter running on a scheduled cron. Every hour, it triggers **3 parallel worker VMs** via GitHub Actions to scan 110 dark store aisles simultaneously.

### 🌾 The 3 Workers (110 Total Aisles)

| Worker | Campaign Name | Aisles | Included Subcategories |
| :--- | :--- | :---: | :--- |
| **Worker 1** | **🌾 Daily Essentials & Fresh** | **37** | Atta, Rice, Toor/Moong/Urad Dal, Cooking Oils, Ghee, Spices, **Dairy (Milk, Paneer, Butter, Cheese, Curd, Eggs, Bread)**, Tea, Coffee, Oats, Detergents, Cleaners, Soaps, Shampoo, Sunscreen, Sanitary Pads. *(Also triggers Wednesday Bazaar at 12:00 AM midnight).* |
| **Worker 2** | **🍿 Sweets, Snacks & Treats** | **41** | Chips & Crisps, Bhujia, Nachos, Popcorn, Chocolates, Gift Boxes, Sweets (Kaju Katli, Gulab Jamun, Rasgulla), Cookies, Cream Biscuits, Ice Cream (Tubs, Cones, Sticks), Instant & Korean Noodles, Frozen Snacks, Dry Fruits (Cashews, Almonds, Pista, Dates). |
| **Worker 3** | **🛍️ Lifestyle, Home & Electronics** | **32** | Cookware, Kitchen Tools, Bottles & Flasks, Organizers, Agarbatti, Camphor, Dhoop, Earphones, Chargers & Cables, Smartwatches, LED Bulbs, Batteries, Stationery, Board Games, Innerwear, Footwear. |

---

### 🧠 Smart Consecutive Run Suppression (No Hourly Spam)

To prevent sending 140+ repeated deals every single hour:
- **10:00 AM IST (Morning Reset)**: Resets daily counters and delivers the complete morning deals catalog.
- **Subsequent Runs (11:00 AM – 10:00 PM IST + 12:00 AM Midnight)**:
  - **Same price consecutive hours**: **Suppressed** (not re-sent).
  - **Price drops**: **Alerted** immediately (`PRICE_DROP`).
  - **New deals**: **Alerted** (`NEW_DEAL`).
  - **Returning deals**: If an item went out of stock and reappears after a few hours, it alerts as `BACK_IN_STOCK`.
- **Silent when 0 deals**: If no new or price-dropped items meet the threshold, the worker exits completely silent.

---

## 🛠️ Bot Setup & GitHub Actions Deployment

### Step 1: Telegram Bot Credentials
1. Open Telegram and message [@BotFather](https://t.me/BotFather) to create a new bot (`/newbot`). Save the bot token.
2. Message [@userinfobot](https://t.me/userinfobot) to find your Telegram Chat ID (or add your bot to a channel/group and use the channel ID).

### Step 2: Configure GitHub Repository Secrets
In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions** and add:

| Secret Name | Description | Example / Required |
| :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot token from BotFather | Required |
| `TELEGRAM_CHAT_ID` | Your Telegram User ID or Channel ID | Required |
| `SWIGGY_STORE_ID` | Your local dark store pod ID (e.g. `1400216`) | Default: `1400216` |
| `SWIGGY_PRIMARY_STORE_ID` | Primary store ID (usually same as store ID) | Default: `1400216` |
| `SWIGGY_SECONDARY_STORE_ID` | Secondary fallback store ID (e.g. `1231805`) | Default: `1231805` |

*(Note: `SWIGGY_COOKIE` and `SWIGGY_DEVICE_ID` are optional; direct API requests automatically generate authentic device headers and signatures).*

### Step 3: Triggering the Hourly Hunter
- **Built-in Schedule**: [`.github/workflows/keyword-hunter.yml`](.github/workflows/keyword-hunter.yml) runs at minute `27` UTC (`4-16,18` UTC = `09:57 AM to 09:57 PM IST` + `11:57 PM IST`). It synchronizes to `:00:00` IST sharp to capture top-of-hour inventory refreshes.
- **External Webhook (`cron-job.org`)**: You can trigger the workflow via `cron-job.org` at the top of any hour using GitHub's `workflow_dispatch` endpoint.

---

## 🧪 Local Testing & Development

Clone the repository and enter the bot folder:
```bash
git clone https://github.com/jairaj26/swiggy-instamart-deals.git
cd swiggy-telegram-bot
npm install
```

Create a `.env` file (see `.env.example`):
```env
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
MIN_DISCOUNT_PERCENT=70
SWIGGY_STORE_ID=1400216
SWIGGY_PRIMARY_STORE_ID=1400216
SWIGGY_SECONDARY_STORE_ID=1231805
```

Run test scans for each worker:
```bash
# Test Worker 1 (Essentials & Fresh)
npm run test:essentials

# Test Worker 2 (Sweets, Snacks & Treats)
npm run test:treats

# Test Worker 3 (Lifestyle & Electronics)
npm run test:lifestyle

# Test Wednesday Bazaar Deals
npm run test:bazaar
```

---

## 📁 Repository Structure

```
.
├── index.html                           # GitHub Pages setup portal for the Bookmarklet
├── swiggy-hunter-v4.js                  # Bookmarklet unminified source code
├── swiggy-hunter-v4.min.js              # Bookmarklet minified production bundle
├── swiggy-hunter-v4.bookmarklet.txt     # Raw javascript:... bookmarklet link
├── .github/
│   └── workflows/
│       └── keyword-hunter.yml           # 3-Worker Parallel Deal Hunter workflow
├── swiggy-telegram-bot/
│   ├── config.json                      # 110 Subcategories & threshold configuration
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── bot.js                       # Interactive Telegram bot handler
│       ├── cron-runner.js               # CLI runner for GitHub Actions & cron jobs
│       ├── dealTracker.js               # Deal state tracking & consecutive suppression
│       ├── swiggyApi.js                 # Swiggy Instamart catalog API & browser scraper
│       ├── cipher.js                    # Dynamic request headers & device signatures
│       └── notifier.js                  # HTML-formatted Telegram batch alerts
└── README.md                            # Main project documentation
```

---

## ⚖️ License & Disclaimer

This project is built for personal productivity and deal scouting. It is not affiliated with, endorsed by, or sponsored by Bundl Technologies Private Limited (Swiggy). All trademarks belong to their respective owners.
