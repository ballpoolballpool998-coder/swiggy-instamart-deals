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

### 🚀 Desktop Installation & Usage (Chrome, Edge, Brave, Safari, Firefox)
1. Visit the GitHub Pages setup portal:
   👉 **[https://jairaj26.github.io/swiggy-instamart-deals/](https://jairaj26.github.io/swiggy-instamart-deals/)**
2. Show your browser bookmarks bar (<kbd>Ctrl+Shift+B</kbd> on Windows or <kbd>Cmd+Shift+B</kbd> on Mac).
3. Drag the orange **"🛒 Swiggy Deal Scout"** button directly to your browser's Bookmarks bar.
4. Open **[swiggy.com/instamart](https://www.swiggy.com/instamart)** and click the bookmark anytime you want to scout deals.
5. Pick your category and subcategories, then click **Fetch**!

---

### 📱 Mobile Installation & Usage (Chrome, Safari, Brave on Android & iOS)
Since mobile browsers do not feature drag-and-drop bookmark bars, set up the bookmarklet in 4 quick steps:

1. **Copy the code**:
   - Open the setup portal on your phone: 👉 **[https://jairaj26.github.io/swiggy-instamart-deals/](https://jairaj26.github.io/swiggy-instamart-deals/)**
   - Scroll down to the **"Or click to preview / copy script below"** drawer and tap **Copy Script** (or copy from [`swiggy-hunter-v4.bookmarklet.txt`](swiggy-hunter-v4.bookmarklet.txt)).
2. **Create a temporary bookmark**:
   - Tap the browser menu (<kbd>⋮</kbd> on Android or Share icon on iOS) and tap **⭐ / Add Bookmark** to bookmark this page.
3. **Edit the bookmark**:
   - Open your browser's **Bookmarks** list.
   - Tap the <kbd>⋮</kbd> menu next to the new bookmark and select **Edit**.
   - Change the **Name** to `Swiggy Deal Scout`.
   - Clear the **URL** field and paste the copied `javascript:...` code. Save changes.
4. **How to run on Mobile**:
   - Navigate to **[swiggy.com/instamart](https://www.swiggy.com/instamart)** and ensure your delivery location is set.
   - Tap your browser's **address / search bar** (URL bar) at the top.
   - Type `Swiggy Deal Scout`.
   - In the dropdown search recommendations, tap the **bookmark icon** named **Swiggy Deal Scout**.
   - The Deal Scout overlay will open directly over the mobile page!

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
| `SWIGGY_STORE_ID` | Your local dark store pod ID | Required |
| `SWIGGY_PRIMARY_STORE_ID` | Primary store ID (same as `SWIGGY_STORE_ID`) | Required |
| `SWIGGY_SECONDARY_STORE_ID` | Secondary fallback store ID (if available in URL) | Optional |

#### 🔍 How to Find Your Store IDs:
1. Navigate to **[swiggy.com/instamart](https://www.swiggy.com/instamart)** in your browser and confirm your delivery location/address is selected.
2. Click on **any category** (e.g. *Atta, Rice & Dal* or *Dairy, Bread & Eggs*).
3. Check your browser address bar URL. It will look like this:
   ```
   https://www.swiggy.com/instamart/category-listing?storeId=1400216&primaryStoreId=1400216&secondaryStoreId=1231805...
   ```
4. Extract the IDs directly from the URL:
   - `storeId` is your **`SWIGGY_STORE_ID`**.
   - `primaryStoreId` is your **`SWIGGY_PRIMARY_STORE_ID`** *(Store ID and Primary ID are identical)*.
   - `secondaryStoreId` is your **`SWIGGY_SECONDARY_STORE_ID`** *(Copy if present; if not shown in your location's URL, you can leave it blank)*.

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

# Add your Store ID and Primary Store ID (both are identical numbers from your category URL)
SWIGGY_STORE_ID=your_store_id_here
SWIGGY_PRIMARY_STORE_ID=your_store_id_here

# Add your Secondary Store ID if available in your category URL (otherwise leave blank)
SWIGGY_SECONDARY_STORE_ID=your_secondary_store_id_here
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
