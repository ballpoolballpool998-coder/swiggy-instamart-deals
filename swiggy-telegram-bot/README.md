# 🤖 Swiggy Instamart Deal Hunter (Telegram Bot)

The Telegram bot component of the [Swiggy Instamart Deal Hunter Suite](../README.md).

For complete documentation, architecture diagrams, and setup instructions, please see the [Main Project README](../README.md).

---

## ⚡ Quick CLI Commands

```bash
# Install dependencies
npm install

# Test Worker 1: Daily Essentials & Fresh (37 aisles)
npm run test:essentials

# Test Worker 2: Sweets, Snacks & Treats (41 aisles)
npm run test:treats

# Test Worker 3: Lifestyle, Home & Electronics (32 aisles)
npm run test:lifestyle

# Test Wednesday Bazaar Deals (Runs automatically at 12:00 AM on Wednesdays)
npm run test:bazaar

# Start interactive bot polling daemon
npm start
```

## ⚙️ Environment Variables

Create `.env` based on `.env.example`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
MIN_DISCOUNT_PERCENT=70
SWIGGY_STORE_ID=1400216
SWIGGY_PRIMARY_STORE_ID=1400216
SWIGGY_SECONDARY_STORE_ID=1231805
```
