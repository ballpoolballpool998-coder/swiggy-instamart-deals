# ⚡ Swiggy Instamart Deal Alert Bot (Telegram)

An automated Telegram bot and crawler that tracks **Keyword Deals** (Grocery Essentials & Snacks) and **Wednesday Bazaar** on Swiggy Instamart, alerting you immediately to high-discount flash deals, price drops, and restocks.

---

## 🎯 Tiered Discount Thresholds

- 🥛 **Grocery Essentials (≥ 65% OFF)**: Dairy (Milk, Curd, Butter, Paneer), Staples (Atta, Rice, Dal), Oils & Ghee, Masalas, Cleaning (Detergents, Dishwash, Toilet Cleaners), Personal Care (Skincare, Haircare, Baby Care).
- 🍿 **Snacks & Treats (≥ 75% OFF)**: Chips, Namkeens, Biscuits, Cookies, Chocolates, Sweets, Cold Drinks, Instant Foods.
- 🛍️ **Wednesday Bazaar (≥ 50% OFF)**: Weekly midnight top deals catalog.

All thresholds and search queries are fully customizable in `config.json`.

---

## 📅 Configured Schedules (IST)

- **Keyword Deal Hunter**: Runs **every hour between 10:00 AM and 9:05 PM** (`5 10-21 * * *`).
- **Wednesday Bazaar**: Runs **every Wednesday at 12:02 AM** (`2 0 * * 3`).

---

## 🚀 High-Efficiency Early-Exit Search Architecture

Instead of crawling 50+ individual subcategories (which takes minutes and causes rate limits), the bot uses Swiggy's search endpoint with `sortAttribute: "discountPercentHighToLow"`:
1. Queries each keyword with high-to-low discount ordering.
2. If the maximum discount on Page 1 is below the category threshold (65% or 75%), it **immediately exits** and moves to the next keyword without paginating further.
3. Total scan across ~29 keywords finishes in only **~12–15 seconds** with negligible API load.

---

## 📱 24/7 Hosting Options

### 🌟 Option 1: Mobile Phone (Termux + PM2) — Recommended Free Setup
Running on an Android phone gives you an authentic **Indian residential / mobile IP** (Jio/Airtel), bypassing cloud datacenter blocks completely.

1. Install **Termux** from [F-Droid](https://f-droid.org/packages/com.termux/).
2. In Termux:
   ```bash
   pkg update && pkg upgrade -y
   pkg install nodejs-lts git -y
   npm install -g pm2
   termux-wake-lock
   ```
3. Copy or clone the project folder, install dependencies, and start:
   ```bash
   cd swiggy-telegram-bot
   npm install
   pm2 start src/bot.js --name "swiggy-bot"
   pm2 save
   ```

---

### 🌐 Option 2: GitHub Actions Matrix (3 Parallel Runner VMs)
A workflow is configured in `.github/workflows/keyword-hunter.yml`:
- Runs automatically every hour via GitHub Actions cron.
- Uses `matrix: chunk: [0, 1, 2]` to run 3 parallel runner VMs, each processing 1/3 of the keywords simultaneously.
- Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and optional `SWIGGY_COOKIE` in your GitHub Repository Secrets.

---

### 💻 Option 3: Local PC (Windows / Mac / Linux)
1. In `swiggy-telegram-bot/`, ensure `.env` has your `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
2. Start the interactive bot:
   ```bash
   npm start
   ```

---

## 🤖 Interactive Telegram Commands

- `/start` — Show welcome message & menu
- `/categories` — Browse and scan specific grocery departments on demand (≥50% OFF)
- `/bazaar` — Scan Wednesday Bazaar Top Deals (≥50% OFF)
- `/pincode <6-digits>` — Set your delivery pincode (e.g. `/pincode 560038`)
- `/setstore <storeId> [secId]` — Link your exact Swiggy dark store pod ID
- `/myinfo` — View your configured location and active store
- `/status` — View last Keyword Hunter and Bazaar scan stats
- `/noice` — View information about the automated hourly keyword scanner

---

## 🧪 Testing & Verification

- **Test Keyword Deals**:
  ```bash
  npm run test:keywords
  ```
- **Test Specific Chunk (1 of 3)**:
  ```bash
  node src/cron-runner.js keywords --chunk 0 --total-chunks 3
  ```
- **Test Wednesday Bazaar**:
  ```bash
  npm run test:bazaar
  ```
- **Run Single-Shot Cron**:
  ```bash
  npm run cron
  ```

---

## 🔖 Standalone Browser Bookmarklets

For scanning deals directly in your browser without running Node.js or Telegram:
1. Open `index.html` in your browser (or visit your GitHub Pages URL).
2. Drag either or both buttons (**Keyword Deal Hunter** and **Category Scout**) to your bookmarks bar.
3. Visit [swiggy.com/instamart](https://www.swiggy.com/instamart) and click the bookmark anytime you want to shop.
