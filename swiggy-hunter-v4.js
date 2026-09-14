javascript:(async () => {
  'use strict';

  /* ==========================================================================
     INSTAMART HUNTER v4 — Category Scout (Page 1 All Deals)
     
     Updates:
     1. Complete 36 Instamart Categories across all 5 store departments:
        - Fresh Items (Vegetables, Fruits, Dairy & Eggs, Meat & Seafood)
        - Grocery & Kitchen (Atta/Rice/Dal, Masalas, Oils & Ghee, Breakfast)
        - Snacks & Drinks (Cold Drinks, Ice Cream, Chips, Chocolates, Biscuits, Tea/Coffee, Sauces, Sweet Corner, Noodles, Frozen Food, Dry Fruits, Paan Corner)
        - Beauty & Wellness (Bath & Body, Hair Care, Skincare, Makeup, Feminine Hygiene, Sexual Wellness, Health & Pharma, Baby Care)
        - Household & Lifestyle (Home & Kitchen, Puja Store, Cleaners, Toys/Stationery, Electronics, Fashion, Pet Supplies, Sports & Fitness)
     2. Dynamic Subcategory Discovery: For any category, automatically queries
        Swiggy's NavigationCard to discover subcategories on the fly for your exact store.
     3. Minimum Discount Removed: Fetches Page 1 completely and displays all items
        regardless of discount (sorted by highest discount first).
     4. Anti-429 Jitter Pacing: Safe human-like delays (1.8s–2.8s) + 12s backoff cooldown.
     5. Standalone Results Tab: Responsive table with live progress, weights, 1-click
        Add links, search, sorting, and CSV export.
     ========================================================================== */

  const CFG = {
    itemsPerPage: 26,
    buildVersion: '2.363.0',
    pacing: { subMin: 1800, subMax: 2800 },
    sections: ['All', 'Featured', 'Fresh', 'Grocery', 'Snacks', 'Beauty', 'Household'],
    cats: {
      // 0. Featured Brand & Campaign Stores
      "✨ The NOICE Store": {
        cName: "The NOICE Store",
        section: "Featured",
        isCampaign: true,
        campaignType: "mxn",
        layoutId: "13558",
        subs: [
          { name: "Dairy, Curd & Paneer", id: "dairy" },
          { name: "Fresh Breads & Bakery", id: "bakery" },
          { name: "Snacks, Chikki & Namkeens", id: "snacks" },
          { name: "Cookies & Biscuits", id: "cookies" },
          { name: "Atta & Flours", id: "atta" },
          { name: "Ice Creams & Sweets", id: "sweets" },
          { name: "Juices, Kombucha & Coffee", id: "beverages" }
        ]
      },
      "🛍️ Wednesday Bazaar": {
        cName: "Wednesday Bazaar",
        section: "Featured",
        isCampaign: true,
        campaignType: "collection",
        collectionId: "397320",
        layoutId: "32944",
        subs: [
          { name: "Milk, Butter & Curd", id: "dairy" },
          { name: "Paneer & Tofu", id: "paneer" },
          { name: "Fresh Eggs", id: "eggs" },
          { name: "Fresh Chutneys & Dips", id: "chutney" },
          { name: "Chapatis & Parotas", id: "breads" },
          { name: "Atta & Pink Salt", id: "staples" }
        ]
      },

      // 1. Fresh Items
      "🥬 Fresh Vegetables": { cName: "Fresh Vegetables", tType: "Speciality taxonomy 1", section: "Fresh", subs: [] },
      "🍎 Fresh Fruits": { cName: "Fresh Fruits", tType: "Speciality taxonomy 1", section: "Fresh", subs: [] },
      "🥛 Dairy, Bread & Eggs": {
        cName: "Dairy, Bread and Eggs",
        tType: "Speciality taxonomy 1",
        section: "Fresh",
        subs: [
          { name: "Milk", id: "6822eeeded32000001e25abe" },
          { name: "Bread and Buns", id: "6822eeeded32000001e25abd" },
          { name: "Paneer and Tofu", id: "6822eeeded32000001e25ac2" },
          { name: "Fresh Bakery", id: "69e23025ed442900016e5d6f" },
          { name: "Cheese", id: "6822eeeded32000001e25ac3" },
          { name: "Eggs", id: "6822eeeded32000001e25abf" },
          { name: "Top Deals", id: "6966028b4f11730001f480a2" },
          { name: "Curd and Yogurts", id: "6822eeeded32000001e25ac0" },
          { name: "Butter", id: "6822eeeded32000001e25ac4" },
          { name: "Batters and Chutneys", id: "6822eeeded32000001e25ac5" },
          { name: "Lassi and Buttermilk", id: "6822eeeded32000001e25ac8" },
          { name: "Indian Breads", id: "6822eeeded32000001e25ac6" },
          { name: "Cream and Condensed Milk", id: "6970b6e9b6373a00010b3a9e" },
          { name: "Dairy Alternatives", id: "6822eeeded32000001e25ac7" },
          { name: "Milkshakes and More", id: "6822eeeded32000001e25ac9" }
        ]
      },
      "🍗 Meat & Seafood": { cName: "Meat and Seafood", tType: "Speciality taxonomy 1", section: "Fresh", subs: [] },

      // 2. Grocery & Kitchen
      "🌾 Atta, Rice & Dal": {
        cName: "Atta, Rice and Dal",
        tType: "taxonomy 5",
        section: "Grocery",
        subs: [
          { name: "Atta", id: "6903b01ed2c61b000112ba2c" },
          { name: "Rice", id: "6903b01ed2c61b000112ba2d" },
          { name: "Toor, Moong and Urad", id: "6903b01ed2c61b000112ba31" },
          { name: "High Protein Atta", id: "6a105aa35f9ab700014de9e2" },
          { name: "Top Deals", id: "6a225b6a3c3eb20001d0f54f" },
          { name: "Basmati Rice", id: "6903b01ed2c61b000112ba2b" },
          { name: "Besan, Sooji and Maida", id: "6903b01ed2c61b000112ba2e" },
          { name: "Rajma, Chola and Others", id: "6903b01ed2c61b000112ba32" },
          { name: "Poha & Puffed Rice", id: "6903b01ed2c61b000112ba33" },
          { name: "Premium Brands", id: "6903b01ed2c61b000112ba2f" },
          { name: "Soya Chunk & Badi", id: "6903b01ed2c61b000112ba37" },
          { name: "Other Flours", id: "6903b01ed2c61b000112ba36" },
          { name: "Millets & Daliya", id: "6903b01ed2c61b000112ba35" },
          { name: "Ready to Cook Flour Mix", id: "6903b01ed2c61b000112ba34" }
        ]
      },
      "🧂 Masalas": {
        cName: "Masalas",
        tType: "taxonomy 5",
        section: "Grocery",
        subs: [
          { name: "Powdered Spices", id: "693ad23e53de7a00011ff894" },
          { name: "Whole Spices", id: "693ad23e53de7a00011ff898" },
          { name: "Cold Grind", id: "6a105aa35f9ab700014de9e3" },
          { name: "Sugar and Jaggery", id: "693ad23e53de7a00011ff897" },
          { name: "Papad & Fryums", id: "693a7ac953de7a00011ff892" },
          { name: "Ready Masala", id: "693ad23e53de7a00011ff895" },
          { name: "Salt", id: "693ad23e53de7a00011ff896" },
          { name: "Paste and Puree", id: "693a9dc1eb607300012621a5" },
          { name: "Pickles & Chutney", id: "693ad23e53de7a00011ff893" },
          { name: "Herbs & Seasoning", id: "693a7ac953de7a00011ff890" },
          { name: "Coconut Milk & Powder", id: "693981bf64f19a0001f8a5b3" },
          { name: "Top Deals", id: "6a225b6a3c3eb20001d0f550" }
        ]
      },
      "🛢️ Oils & Ghee": {
        cName: "Oils and Ghee",
        tType: "taxonomy 5",
        section: "Grocery",
        subs: [
          { name: "Sunflower & Other Oils", id: "69394956ed899c0001b1aed8" },
          { name: "Mustard Oils", id: "69392fc99bd17b000135e3bd" },
          { name: "Cold Pressed", id: "6a105aa35f9ab700014de9e4" },
          { name: "Ghee", id: "69392fc99bd17b000135e3bb" },
          { name: "Top Deals", id: "6a225b6a3c3eb20001d0f551" },
          { name: "Soyabean Oils", id: "69394956ed899c0001b1aed7" },
          { name: "Rice Bran Oils", id: "69394956ed899c0001b1aed6" },
          { name: "Sunflower Oils", id: "69394956ed899c0001b1aed9" },
          { name: "Blended Oils", id: "69392fc99bd17b000135e3b9" },
          { name: "Cold-pressed Oils", id: "69392fc99bd17b000135e3ba" },
          { name: "Olive Oils", id: "69394956ed899c0001b1aed4" },
          { name: "Premium Brands", id: "69394956ed899c0001b1aed5" }
        ]
      },
      "🥣 Cereals & Breakfast": {
        cName: "Cereals and Breakfast",
        tType: "taxonomy 5",
        section: "Grocery",
        subs: [
          { name: "Muesli & Granola", id: "69492faa195bc000019a3b0a" },
          { name: "Batters", id: "69492faa195bc000019a3b1c" },
          { name: "Flakes", id: "69492faa195bc000019a3b0d" },
          { name: "Kids Cereals", id: "69492faa195bc000019a3b0c" },
          { name: "Oats", id: "69492faa195bc000019a3b0b" },
          { name: "High protein oats & museli", id: "698d7038c63f8300011b530c" },
          { name: "Pancake Mixes", id: "69492faa195bc000019a3b13" },
          { name: "Regional Favourites", id: "69492faa195bc000019a3b0e" },
          { name: "Ready Mixes", id: "69492faa195bc000019a3b11" },
          { name: "Peanut Butters", id: "69492faa195bc000019a3b14" },
          { name: "Energy Bars", id: "69492faa195bc000019a3b10" },
          { name: "Chocolate Spreads", id: "69492faa195bc000019a3b15" },
          { name: "Masala Oats", id: "698499a8e171b800015b5d68" },
          { name: "Jams", id: "69492faa195bc000019a3b1b" },
          { name: "Juices & Fruit Drinks", id: "69492faa195bc000019a3b1a" },
          { name: "Mayo & Spreads", id: "69492faa195bc000019a3b16" },
          { name: "Hot Beverages", id: "69492faa195bc000019a3b19" },
          { name: "Seeds and trail Mixes", id: "69492faa195bc000019a3b18" },
          { name: "Crazy Deals", id: "69492faa195bc000019a3b09" }
        ]
      },

      // 3. Snacks & Drinks
      "🥤 Cold Drinks & Juices": { cName: "Cold Drinks and Juices", tType: "taxonomy 10", section: "Snacks", subs: [] },
      "🍨 Ice Creams & Desserts": { cName: "Ice Creams and Frozen Desserts", tType: "taxonomy 10", section: "Snacks", subs: [] },
      "🍿 Chips & Namkeens": {
        cName: "Chips and Namkeens",
        tType: "taxonomy 10",
        section: "Snacks",
        subs: [
          { name: "Chips and Crisps", id: "6903b0c295d8230001064c99" },
          { name: "Bhujia and Namkeens", id: "6903b0c295d8230001064c9d" },
          { name: "Palm Oil Free", id: "6a1024275f9ab700014de9df" },
          { name: "Indian Snacks", id: "6903b0c295d8230001064c9e" },
          { name: "Baked and Roasted", id: "6a1024275f9ab700014de9e0" },
          { name: "Nuts", id: "6903b0c295d8230001064ca0" },
          { name: "Puffs and Crunchies", id: "6903b0c295d8230001064c9b" },
          { name: "Makhana & Dry Fruits", id: "6903b0c295d8230001064c9f" },
          { name: "Healthy Snacking", id: "6903b0c295d8230001064ca3" },
          { name: "Nachos", id: "6903b0c295d8230001064c9a" },
          { name: "Popcorn", id: "6903b0c295d8230001064ca1" },
          { name: "Fasting Snacks", id: "699428c05011b80001ede81d" },
          { name: "Regional Favourites", id: "6903b0c295d8230001064c9c" },
          { name: "Party Packs", id: "6903b0c295d8230001064ca6" },
          { name: "Gift Hampers", id: "6903b0c295d8230001064ca2" },
          { name: "Sweet Treats", id: "6903b0c295d8230001064ca7" }
        ]
      },
      "🍫 Chocolates": {
        cName: "Chocolates",
        tType: "taxonomy 10",
        section: "Snacks",
        subs: [
          { name: "Milk Chocolates", id: "693d17b2c0e8870001d2d8fd" },
          { name: "Dark Chocolates", id: "693d17b2c0e8870001d2d8f8" },
          { name: "Gift Boxes", id: "693d17b2c0e8870001d2d8f9" },
          { name: "Top Deals", id: "6a5638416009fa0001dce712" },
          { name: "Shared Packs", id: "693d448b31a0de00019cd18c" },
          { name: "Premium", id: "693d1c2031a0de00019cd18b" },
          { name: "Wafers", id: "693d82725485ff0001d3ec20" },
          { name: "Kunafa Chocolate", id: "69c2674fb2f6170001b1dd3e" },
          { name: "Gourmet collection", id: "693d17b2c0e8870001d2d8fa" },
          { name: "Candies & More", id: "693d17b2c0e8870001d2d8f7" },
          { name: "Gums & Mint", id: "693d17b2c0e8870001d2d8fb" }
        ]
      },
      "🍪 Biscuits & Cakes": { cName: "Biscuits and Cakes", tType: "taxonomy 10", section: "Snacks", subs: [] },
      "☕ Tea, Coffee & Drinks": {
        cName: "Tea, Coffee and Milk drinks",
        tType: "taxonomy 10",
        section: "Snacks",
        subs: [
          { name: "Tea", id: "6903b0c295d8230001064cfa" },
          { name: "Instant Coffee", id: "6903b0c295d8230001064cfb" },
          { name: "Filter & Ground Coffee", id: "6903b0c295d8230001064cfc" },
          { name: "Drink Mixes", id: "6903b0c295d8230001064d01" },
          { name: "Green & Herbal Tea", id: "6903b0c295d8230001064cfd" },
          { name: "Cold Coffee", id: "6903b0c295d8230001064d00" },
          { name: "Regional Favourites", id: "6903b0c295d8230001064cfe" },
          { name: "Syrups & Mixes", id: "69b17a805011b80001ede85d" },
          { name: "Milkshake & Smoothie", id: "6903b0c295d8230001064d04" },
          { name: "Cookies and Rusks", id: "6903b0c295d8230001064d07" },
          { name: "Premixes", id: "6903b0c295d8230001064d06" },
          { name: "Adult Nutrition", id: "6903b0c295d8230001064d03" },
          { name: "Top Deals", id: "69662b2901da4f00010080db" },
          { name: "Imported", id: "696e372795eb7700017f9a2b" }
        ]
      },
      "🥫 Sauces & Spreads": { cName: "Sauces and Spreads", tType: "taxonomy 10", section: "Snacks", subs: [] },
      "🍬 Sweet Corner": {
        cName: "Sweet Corner",
        tType: "taxonomy 10",
        section: "Snacks",
        subs: [
          { name: "Kaju Katli & Barfi", id: "693f772b01a77200013e2a09" },
          { name: "Cakes and Pies", id: "693f772b01a77200013e2a0e" },
          { name: "Gulab Jamun", id: "693f772b01a77200013e2a0c" },
          { name: "Top Deals", id: "6a5638416009fa0001dce713" },
          { name: "Cream Biscuits", id: "69eb43c5a51c5400018ac258" },
          { name: "Mysore Pak", id: "693f772b01a77200013e2a10" },
          { name: "Chocofills", id: "69eb43c5a51c5400018ac259" },
          { name: "Ladoos", id: "693f772b01a77200013e2a11" },
          { name: "Pedhas", id: "693f772b01a77200013e2a12" },
          { name: "Rasgulla", id: "693f772b01a77200013e2a0b" },
          { name: "Dry Fruit Sweets", id: "693f772b01a77200013e2a0a" },
          { name: "Chikki", id: "693fab2c01a77200013e2a13" },
          { name: "Rasmalai", id: "693fab2c01a77200013e2a14" },
          { name: "Gulkand & Paan", id: "693fab2c01a77200013e2a15" },
          { name: "Dessert Mixes", id: "693f772b01a77200013e2a0d" }
        ]
      },
      "🍜 Noodles, Pasta & Vermicelli": { cName: "Noodles, Pasta, Vermicelli", tType: "taxonomy 10", section: "Snacks", subs: [] },
      "🧊 Frozen Food": { cName: "Frozen Food", tType: "taxonomy 10", section: "Snacks", subs: [] },
      "🥜 Dry Fruits & Seeds Mix": { cName: "Dry Fruits and Seeds Mix", tType: "taxonomy 10", section: "Snacks", subs: [] },
      "🍃 Paan Corner": { cName: "Paan Corner", tType: "taxonomy 10", section: "Snacks", subs: [] },

      // 4. Beauty & Wellness
      "🧼 Bath & Body": { cName: "Bath and Body", tType: "taxonomy 14", section: "Beauty", subs: [] },
      "💇 Hair Care": { cName: "Hair Care", tType: "taxonomy 14", section: "Beauty", subs: [] },
      "✨ Skincare": {
        cName: "Skincare",
        tType: "taxonomy 14",
        section: "Beauty",
        subs: [
          { name: "Face wash and scrubs", id: "6903b10bd2c61b000112bab8" },
          { name: "Masks & Cleansers", id: "6903b10bd2c61b000112bab9" },
          { name: "Serums, Toners", id: "6903b10bd2c61b000112baba" },
          { name: "Creams & Moisturizers", id: "6903b10bd2c61b000112babb" },
          { name: "Sunscreen", id: "6903b10bd2c61b000112babc" },
          { name: "Body Lotions", id: "6903b10bd2c61b000112babe" },
          { name: "Beauty Supplements", id: "6903b10bd2c61b000112babf" }
        ]
      },
      "💄 Makeup": { cName: "Makeup", tType: "taxonomy 14", section: "Beauty", subs: [] },
      "🌸 Feminine Hygiene": { cName: "Feminine Hygiene", tType: "taxonomy 14", section: "Beauty", subs: [] },
      "❤️ Sexual Wellness": { cName: "Sexual Wellness", tType: "taxonomy 14", section: "Beauty", subs: [] },
      "💊 Health & Pharma": { cName: "Health and Pharma", tType: "taxonomy 14", section: "Beauty", subs: [] },
      "👶 Baby Care": { cName: "Baby Care", tType: "taxonomy 14", section: "Beauty", subs: [] },

      // 5. Household & Lifestyle
      "🍳 Home & Kitchen": { cName: "Home and Kitchen", tType: "IM Meatsy", section: "Household", subs: [] },
      "🪔 Puja Store": { cName: "Puja Store", tType: "IM Meatsy", section: "Household", subs: [] },
      "🧹 Cleaners & Repellents": { cName: "Cleaners and Repellents", tType: "IM Meatsy", section: "Household", subs: [] },
      "🧸 Toys & Stationery": { cName: "Toys and Stationery", tType: "IM Meatsy", section: "Household", subs: [] },
      "🔌 Electronics & Appliances": { cName: "Electronics and Appliances", tType: "IM Meatsy", section: "Household", subs: [] },
      "👕 Fashion": { cName: "Fashion", tType: "IM Meatsy", section: "Household", subs: [] },
      "🐾 Pet Supplies": { cName: "Pet Supplies", tType: "IM Meatsy", section: "Household", subs: [] },
      "🏃 Sports & Fitness": { cName: "Sports and Fitness", tType: "IM Meatsy", section: "Household", subs: [] }
    }
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ==========================================================================
     Anti-Bot & Verification Helpers (Reverse-Engineered Swiggy Protocol)
     ========================================================================== */

  function generateMatcher() {
    const rand5 = () => Math.floor(10000 + Math.random() * 90000).toString();
    const raw = rand5() + Date.now().toString() + rand5();
    return raw.split('').map((d) => (parseInt(d, 10) + 7).toString(36)).join('');
  }

  function getDeviceId() {
    try {
      const keys = ['deviceId', 'device_id', 'x-device-id', 'swiggy_d_id'];
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v && v.length > 10) return v;
      }
      const m = document.cookie.match(/(?:_device_id|deviceId|swiggy_d_id)=([^;]+)/);
      if (m && m[1]) return decodeURIComponent(m[1]);
    } catch (e) {}
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getBuildVersion() {
    try {
      if (window.__BUILD_VERSION__) return window.__BUILD_VERSION__;
      if (window.__SWIGGY_GLOBAL__?.buildVersion) return window.__SWIGGY_GLOBAL__.buildVersion;
      for (const e of performance.getEntries()) {
        const m = e.name.match(/build[-_]?version[=/:]([0-9.]+)/i);
        if (m) return m[1];
      }
    } catch (e) {}
    return CFG.buildVersion;
  }

  function detectStoreIds() {
    const ids = new Set();
    try {
      performance.getEntries().forEach((e) => {
        const u = e.name;
        if (u.includes('storeId=')) {
          const m = u.match(/storeId=(\d+)/);
          if (m) ids.add(m[1]);
          const p = new URLSearchParams(u.split('?')[1]);
          if (p.get('primaryStoreId')) ids.add(p.get('primaryStoreId'));
          if (p.get('secondaryStoreId')) ids.add(p.get('secondaryStoreId'));
        }
      });
    } catch (e) {}

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const val = localStorage.getItem(localStorage.key(i));
        if (typeof val === 'string') {
          const m = val.match(/"(?:storeId|primaryStoreId)":\s*"?(\d+)"?/);
          if (m && m[1].length > 4) ids.add(m[1]);
        }
      }
    } catch (e) {}

    let arr = Array.from(ids).filter((i) => i.length > 4);
    if (!arr.length) {
      const manual = prompt('Could not auto-detect store ID. Paste your storeId (from Network tab):', '');
      if (manual) arr = manual.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!arr.length) return null;
    return { sid: arr[0], pid: arr[0], secid: arr[1] || '' };
  }

  /* ==========================================================================
     Dynamic API Engine (GET & POST with Auto-Cooldown Backoff)
     ========================================================================== */

  let activeDispatch = null;

  async function apiRequestSafe(url, method = 'GET', body = null, isRetry = false, retry = 0) {
    const matcher = generateMatcher();
    const headers = {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/json',
      'matcher': matcher,
      'x-build-version': getBuildVersion(),
      'x-device-id': getDeviceId(),
    };

    try {
      const opts = { method, headers, credentials: 'include' };
      if (body) opts.body = JSON.stringify(body);

      const res = await fetch(url, opts);
      let json = null;
      try { json = await res.json(); } catch (e) {}

      const isRateLimited =
        res.status === 429 ||
        res.status === 403 ||
        json?.statusCode === 429 ||
        json?.statusCode === 403 ||
        json?.status === 429 ||
        json?.status === 403;

      if (isRateLimited) {
        if (!isRetry) {
          // On initial pass, return null immediately so it can be retried with jitter in Phase 2
          return null;
        }

        if (retry >= 2) {
          const errMsg = 'Rate limit cooldown exceeded maximum retries.';
          statusEl.textContent = errMsg;
          return null;
        }

        const baseWait = 5000 * Math.pow(2, retry);
        const jitter = Math.floor(Math.random() * 2000);
        const totalWaitSec = Math.round((baseWait + jitter) / 1000);

        for (let s = totalWaitSec; s > 0; s--) {
          const cdMsg = `WAF Rate limit (429) cooling down: ${s}s…`;
          statusEl.textContent = cdMsg;
          await sleep(1000);
        }

        statusEl.textContent = 'Resuming retry with fresh auth token…';
        return apiRequestSafe(url, method, body, true, retry + 1);
      }

      if (res.status === 200 && json && json.data) {
        return json;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function extractVariations(node, out) {
    if (!node || typeof node !== 'object') return;
    if (node.variations && Array.isArray(node.variations)) {
      out.push(...node.variations);
    } else if (node.displayName && (node.price || node.offerPrice)) {
      out.push(node);
    } else {
      Object.values(node).forEach((v) => extractVariations(v, out));
    }
  }

  // Dynamically discovers subcategories for ANY category using NavigationCard
  async function fetchCategorySubcategories(cat, storeIds) {
    if (cat.subs && cat.subs.length > 0) return cat.subs;

    const url = `https://www.swiggy.com/api/instamart/category-listing/v2?categoryName=${encodeURIComponent(cat.cName)}&taxonomyType=${encodeURIComponent(cat.tType)}&offset=0&storeId=${storeIds.sid}&primaryStoreId=${storeIds.pid}&secondaryStoreId=${storeIds.secid}`;
    const data = await apiRequestSafe(url, 'GET', null, true);
    const subs = [];

    if (data?.data?.cards) {
      for (const c of data.data.cards) {
        const card = c?.card?.card;
        if (card?.navigationTabs && Array.isArray(card.navigationTabs)) {
          for (const t of card.navigationTabs) {
            const name = t.name;
            const dl = t.deepLink || '';
            const m = dl.match(/filterId=([^&]+)/);
            const id = m ? decodeURIComponent(m[1]) : '';
            if (name && id) {
              subs.push({ name, id });
            }
          }
        }
      }
    }

    // If flat category with no navigationTabs, use category name with empty filterId
    if (!subs.length) {
      subs.push({ name: cat.cName, id: '' });
    }

    cat.subs = subs;
    return subs;
  }

    // Helper to parse items from API response cards
  function parseCardsVariations(data, catKey, catObj, sub, storeIds, resultMap) {
    if (!data?.data?.cards) return { scanned: 0, maxDiscount: 0, itemsFound: 0, itemsList: [] };

    const variations = [];
    extractVariations(data.data, variations);
    if (!variations.length) return { scanned: 0, maxDiscount: 0, itemsFound: 0, itemsList: [] };

    let scanned = 0;
    let maxDiscount = 0;
    let itemsFound = 0;
    const itemsList = [];

    for (const v of variations) {
      if (v.inventory?.inStock === false) continue;
      const mrp = parseFloat(v.price?.mrp?.units || v.price?.mrp || 0);
      const price = parseFloat(v.price?.offerPrice?.units || v.price?.offerPrice || 0);
      const discount = mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
      const roundedDiscount = Math.round(discount);

      scanned++;
      maxDiscount = Math.max(maxDiscount, roundedDiscount);

      const name = v.displayName;
      if (!name) continue;

      const link = `https://www.swiggy.com/instamart/category-listing?categoryName=${encodeURIComponent(catObj.cName)}&filterId=${sub.id}&filterName=${encodeURIComponent(sub.name)}&offset=0&showAgeConsent=false&storeId=${storeIds.sid}&taxonomyType=${encodeURIComponent(catObj.tType)}`;
      const searchLink = `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(name)}`;

      const row = {
        name,
        pack: v.quantityDescription || '',
        price,
        mrp,
        discount: roundedDiscount,
        image: v.imageIds?.[0] || v.imageId || '',
        category: v.category || catKey.replace(/^\S+\s/, ''),
        subCategory: v.subCategoryType || sub.name,
        link,
        searchLink
      };

      const existing = resultMap.get(name);
      if (!existing || price < existing.price) {
        resultMap.set(name, row);
      }
      itemsFound++;
      itemsList.push(row);
    }

    return { scanned, maxDiscount, itemsFound, itemsList };
  }

  // Fetches Page 1 for a single subcategory, and fetches Page 2 ONLY if Page 1's last item is > 50% discount
  async function fetchSubcategoryDeals(catKey, catObj, sub, storeIds, resultMap, progressCb, isRetry = false) {
    let p1Data = null;

    if (sub.id) {
      const url = `https://www.swiggy.com/api/instamart/category-listing/filter/v2?storeId=${storeIds.sid}&primaryStoreId=${storeIds.pid}&secondaryStoreId=${storeIds.secid}&pageNo=0&offset=0&page_name=category_listing_filter`;
      const body = {
        categoryName: catObj.cName,
        filterName: sub.name,
        filterId: sub.id,
        taxonomyType: catObj.tType,
        items_offset: "0",
        facets: [],
        sortAttribute: "discountPercentHighToLow",
      };
      p1Data = await apiRequestSafe(url, 'POST', body, isRetry);
    } else {
      const url = `https://www.swiggy.com/api/instamart/category-listing/v2?categoryName=${encodeURIComponent(catObj.cName)}&taxonomyType=${encodeURIComponent(catObj.tType)}&offset=0&storeId=${storeIds.sid}&primaryStoreId=${storeIds.pid}&secondaryStoreId=${storeIds.secid}`;
      p1Data = await apiRequestSafe(url, 'GET', null, isRetry);
    }

    if (!p1Data || !p1Data.data) {
      return { ok: false, failed: true, scanned: 0, maxDiscount: 0, itemsFound: 0 };
    }

    const p1Res = parseCardsVariations(p1Data, catKey, catObj, sub, storeIds, resultMap);
    let totalScanned = p1Res.scanned;
    let maxDiscount = p1Res.maxDiscount;
    let itemsFound = p1Res.itemsFound;
    let fetchedPage2 = false;

    // Requirement: Fetch Page 2 ONLY if Page 1 last row has items more than 50% off
    const p1Items = p1Res.itemsList;
    const lastP1Item = p1Items.length > 0 ? p1Items[p1Items.length - 1] : null;

    if (sub.id && p1Items.length >= 15 && lastP1Item && lastP1Item.discount > 50) {
      progressCb?.(`Last item on Page 1 is ${lastP1Item.discount}% OFF (>50%) — fetching Page 2…`);
      const pauseMs = isRetry
        ? (CFG.pacing.subMin + Math.floor(Math.random() * (CFG.pacing.subMax - CFG.pacing.subMin)))
        : 150;
      await sleep(pauseMs);

      const p2Url = `https://www.swiggy.com/api/instamart/category-listing/filter/v2?storeId=${storeIds.sid}&primaryStoreId=${storeIds.pid}&secondaryStoreId=${storeIds.secid}&pageNo=1&offset=1&page_name=category_listing_filter`;
      const p2Body = {
        categoryName: catObj.cName,
        filterName: sub.name,
        filterId: sub.id,
        taxonomyType: catObj.tType,
        items_offset: String(CFG.itemsPerPage),
        facets: [],
        sortAttribute: "discountPercentHighToLow",
      };
      const p2Data = await apiRequestSafe(p2Url, 'POST', p2Body, isRetry);
      if (p2Data && p2Data.data) {
        const p2Res = parseCardsVariations(p2Data, catKey, catObj, sub, storeIds, resultMap);
        totalScanned += p2Res.scanned;
        maxDiscount = Math.max(maxDiscount, p2Res.maxDiscount);
        itemsFound += p2Res.itemsFound;
        fetchedPage2 = true;
      }
    }

    return { ok: true, failed: false, scanned: totalScanned, maxDiscount, itemsFound, fetchedPage2 };
  }

  // Fetches all pages for Campaign collections (Noice Store, Wednesday Bazaar, etc.)
  async function fetchCampaignDeals(catKey, catObj, storeIds, resultMap, progressCb) {
    let totalScanned = 0;
    let overallMaxDiscount = 0;
    let itemsFound = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore && offset < 10) {
      progressCb?.(`Fetching ${catObj.cName} (Page ${offset + 1})…`);
      let url = '';
      if (catObj.campaignType === 'mxn') {
        url = `https://www.swiggy.com/api/instamart/campaign/mxn/v2?layoutId=${catObj.layoutId}&offset=${offset}&customerPage=STORES_MxN_3&metaInfo=&storeId=${storeIds.sid}&primaryStoreId=${storeIds.pid}&secondaryStoreId=${storeIds.secid}`;
      } else if (catObj.campaignType === 'collection') {
        url = `https://www.swiggy.com/api/instamart/collection/items?collectionId=${catObj.collectionId}&isMonetised=true&storeId=${storeIds.sid}&primaryStoreId=${storeIds.pid}&secondaryStoreId=${storeIds.secid}&offset=${offset}&serviceLine=INSTAMART`;
      }

      const json = await apiRequestSafe(url, 'GET', null, true);
      if (!json || !json.data) {
        if (offset === 0 && catObj.campaignType === 'collection' && catObj.layoutId) {
          const fallbackUrl = `https://www.swiggy.com/api/instamart/campaign/listing/v2?collectionId=${catObj.collectionId}&custom_back=true&layoutId=${catObj.layoutId}&offset=0&storeId=${storeIds.sid}&primaryStoreId=${storeIds.pid}&secondaryStoreId=${storeIds.secid}`;
          const fallbackJson = await apiRequestSafe(fallbackUrl, 'GET', null, true);
          if (fallbackJson?.data) {
            const fbRes = parseCardsVariations(fallbackJson, catKey, catObj, { name: catObj.cName, id: '' }, storeIds, resultMap);
            totalScanned += fbRes.scanned;
            itemsFound += fbRes.itemsFound;
            overallMaxDiscount = Math.max(overallMaxDiscount, fbRes.maxDiscount);
          }
        }
        break;
      }

      const res = parseCardsVariations(json, catKey, catObj, { name: catObj.cName, id: '' }, storeIds, resultMap);
      totalScanned += res.scanned;
      itemsFound += res.itemsFound;
      overallMaxDiscount = Math.max(overallMaxDiscount, res.maxDiscount);

      const nextOffset = json.data?.pageOffset?.nextOffset;
      if (nextOffset !== null && nextOffset !== undefined && nextOffset !== '' && Number(nextOffset) > offset) {
        offset = Number(nextOffset);
        await sleep(250);
      } else {
        hasMore = false;
      }
    }

    return { scanned: totalScanned, maxDiscount: overallMaxDiscount, itemsFound, fetchedPage2: offset > 0 };
  }


  /* ==========================================================================
     UI Construction (Full 36-Category Panel with Section Filters)
     ========================================================================== */

  document.getElementById('ih4-root')?.remove();
  document.getElementById('ih4-style')?.remove();

  const style = document.createElement('style');
  style.id = 'ih4-style';
  style.textContent = `
    #ih4-root, #ih4-root * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    #ih4-root { position: fixed; z-index: 2147483000; inset: auto 20px 20px auto; }

    #ih4-fab {
      position: relative; width: 54px; height: 54px; border-radius: 50%; border: none; cursor: pointer;
      background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(15,23,42,.32); transition: transform .15s ease, background .15s ease;
    }
    #ih4-fab:hover { transform: translateY(-2px); background: #fc8019; }
    #ih4-fab svg { width: 24px; height: 24px; }
    #ih4-fab-badge {
      position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; padding: 0 5px;
      border-radius: 10px; background: #fc8019; color: #fff; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #fff;
    }

    #ih4-panel {
      position: fixed; top: 0; right: 0; height: 100vh; width: 420px; max-width: 95vw;
      background: #fff; box-shadow: -8px 0 35px rgba(15,23,42,.15); border-left: 1px solid #e2e8f0;
      display: flex; flex-direction: column; transform: translateX(100%); transition: transform .22s ease;
      z-index: 2147483001;
    }
    #ih4-panel.open { transform: translateX(0); }
    @media (max-width: 640px) { #ih4-panel { width: 100%; max-width: 100%; } }

    #ih4-panel-head { padding: 18px 20px 14px; border-bottom: 1px solid #f1f5f9; position: relative; }
    #ih4-panel-head .ih4-title { font-size: 16px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
    #ih4-panel-head .ih4-badge { font-size: 10.5px; padding: 2px 7px; border-radius: 10px; background: #fef3c7; color: #92400e; font-weight: 700; letter-spacing: .02em; }
    #ih4-panel-head .ih4-sub { font-size: 12px; color: #64748b; margin-top: 3px; line-height: 1.4; }
    #ih4-close {
      position: absolute; top: 16px; right: 16px; width: 30px; height: 30px; border-radius: 8px;
      border: none; background: #f1f5f9; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    #ih4-close:hover { background: #e2e8f0; color: #0f172a; }

    #ih4-section-tabs {
      display: flex; gap: 6px; padding: 10px 18px; background: #fff; border-bottom: 1px solid #f1f5f9; overflow-x: auto; scrollbar-width: none;
    }
    #ih4-section-tabs::-webkit-scrollbar { display: none; }
    .ih4-sec-tab {
      font-size: 11.5px; font-weight: 600; padding: 5px 11px; border-radius: 14px; border: 1px solid #e2e8f0;
      background: #f8fafc; color: #475569; cursor: pointer; white-space: nowrap; transition: all .12s ease;
    }
    .ih4-sec-tab:hover { border-color: #cbd5e1; color: #0f172a; }
    .ih4-sec-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }

    #ih4-list { flex: 1; overflow-y: auto; padding: 12px 14px; }
    .ih4-cat-card {
      border: 1.5px solid #f1f5f9; border-radius: 10px; margin-bottom: 8px; transition: border-color .15s ease, background .15s ease;
      background: #fff;
    }
    .ih4-cat-card:hover { border-color: #cbd5e1; }
    .ih4-cat-card.selected { border-color: #fc8019; background: #fffaf5; }

    .ih4-cat-main {
      display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 12px; cursor: pointer; user-select: none;
    }
    .ih4-cat-left { display: flex; align-items: center; gap: 11px; flex: 1; min-width: 0; }
    .ih4-cat-radio {
      width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #cbd5e1; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; transition: all .12s ease; background: #fff;
    }
    .ih4-radio-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #fc8019; opacity: 0; transform: scale(0.6);
      transition: all .12s ease;
    }
    .ih4-cat-card.selected .ih4-cat-radio { border-color: #fc8019; }
    .ih4-cat-card.selected .ih4-radio-dot { opacity: 1; transform: scale(1); }
    .ih4-cat-name { font-size: 13.5px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .ih4-cat-toggle {
      width: 26px; height: 26px; border-radius: 6px; border: none; background: transparent; color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: background .12s ease;
    }
    .ih4-cat-toggle:hover { background: #f1f5f9; color: #334155; }
    .ih4-cat-toggle svg { width: 14px; height: 14px; transition: transform .18s ease; }
    .ih4-cat-card.open .ih4-cat-toggle svg { transform: rotate(180deg); }

    .ih4-subs-preview {
      display: none; padding: 8px 12px 12px; border-top: 1px dashed #f1f5f9; background: #fafbfc; border-radius: 0 0 10px 10px;
    }
    .ih4-cat-card.open .ih4-subs-preview { display: block; }
    .ih4-subs-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .03em; margin-bottom: 6px; }
    .ih4-sub-pills { display: flex; flex-wrap: wrap; gap: 5px; }
    .ih4-sub-pill { font-size: 11px; color: #475569; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2px 8px; }

    #ih4-panel-foot { padding: 16px 20px; border-top: 1px solid #f1f5f9; background: #fff; }
    #ih4-summary-line { font-size: 12.5px; color: #64748b; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    #ih4-fetch {
      width: 100%; padding: 12px; border-radius: 10px; border: none; background: #0f172a; color: #fff;
      font-size: 13.5px; font-weight: 700; cursor: pointer; transition: background .15s ease, transform .1s ease;
    }
    #ih4-fetch:hover:not(:disabled) { background: #fc8019; }
    #ih4-fetch:active:not(:disabled) { transform: translateY(1px); }
    #ih4-fetch:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
    #ih4-status { font-size: 12px; color: #64748b; margin-top: 9px; min-height: 16px; text-align: center; line-height: 1.4; }
    #ih4-open-results-link { display: none; margin-top: 8px; font-size: 12.5px; color: #fc8019; text-align: center; font-weight: 700; cursor: pointer; }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'ih4-root';
  root.innerHTML = `
    <div id="ih4-panel">
      <div id="ih4-panel-head">
        <div class="ih4-title">⚡ Instamart Hunter <span class="ih4-badge">v4 Category Scout</span></div>
        <div class="ih4-sub">Choose a category to fetch <b>Page 1 top deals</b> across its subcategories.</div>
        <button id="ih4-close" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div id="ih4-section-tabs">
        ${CFG.sections.map((sec, i) => '<button class="ih4-sec-tab' + (i === 0 ? ' active' : '') + '" data-sec="' + sec + '">' + sec + '</button>').join('')}
      </div>

      <div id="ih4-list"></div>

      <div id="ih4-panel-foot">
        <div id="ih4-summary-line">
          <span id="ih4-cats-count" style="font-weight:600;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;">No category selected</span>
          <span style="font-size:11px;color:#16a34a;font-weight:700;">Top Deals</span>
        </div>
        <button id="ih4-fetch" disabled>Select a category to scout</button>
        <div id="ih4-status"></div>
        <div id="ih4-open-results-link">Open Results Tab ↗</div>
      </div>
    </div>

    <button id="ih4-fab" title="Instamart Hunter v4" aria-label="Open Instamart Hunter">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span id="ih4-fab-badge" style="display:none;">0</span>
    </button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector('#ih4-panel');
  const fab = root.querySelector('#ih4-fab');
  const fabBadge = root.querySelector('#ih4-fab-badge');
  const listEl = root.querySelector('#ih4-list');
  const fetchBtn = root.querySelector('#ih4-fetch');
  const statusEl = root.querySelector('#ih4-status');
  const catsCountEl = root.querySelector('#ih4-cats-count');
  const openResultsLink = root.querySelector('#ih4-open-results-link');
  const secTabs = root.querySelectorAll('.ih4-sec-tab');

  fab.addEventListener('click', () => panel.classList.toggle('open'));
  root.querySelector('#ih4-close').addEventListener('click', () => panel.classList.remove('open'));

  let isScouting = false;
  let hasResults = false;
  let finalItemsCache = [];
  let latestMetaCache = null;
  let selectedCat = null;
  const openPreviewCats = new Set();
  let currentSection = 'All';

  function updateFooter() {
    if (isScouting) return;
    hasResults = false;
    fetchBtn.style.background = '';
    openResultsLink.style.display = 'none';
    if (!selectedCat) {
      catsCountEl.textContent = 'No category selected';
      catsCountEl.style.color = '#64748b';
      fabBadge.style.display = 'none';
      fabBadge.textContent = '0';
      fetchBtn.disabled = true;
      fetchBtn.textContent = 'Select a category to scout';
    } else {
      catsCountEl.innerHTML = `Selected: <b>${selectedCat}</b>`;
      catsCountEl.style.color = '#0f172a';
      fabBadge.style.display = 'flex';
      fabBadge.textContent = '1';
      fetchBtn.disabled = false;
      const cleanName = selectedCat.replace(/^\S+\s/, '');
      fetchBtn.textContent = `Fetch Top Deals (${cleanName})`;
    }
  }

  function renderCategories() {
    listEl.innerHTML = '';
    let matchCount = 0;

    for (const [catKey, catObj] of Object.entries(CFG.cats)) {
      if (currentSection !== 'All' && catObj.section !== currentSection) continue;
      matchCount++;

      const isSelected = selectedCat === catKey;
      const isOpen = openPreviewCats.has(catKey);

      const subsPills = catObj.subs.length > 0
        ? catObj.subs.map((s) => '<span class="ih4-sub-pill">' + s.name + '</span>').join('')
        : '<span class="ih4-sub-pill" style="color:#64748b;font-style:italic;">Discovered dynamically from your local store</span>';

      const card = document.createElement('div');
      card.className = `ih4-cat-card${isSelected ? ' selected' : ''}${isOpen ? ' open' : ''}`;
      card.innerHTML = `
        <div class="ih4-cat-main">
          <div class="ih4-cat-left">
            <span class="ih4-cat-radio"><span class="ih4-radio-dot"></span></span>
            <span class="ih4-cat-name">${catKey}</span>
          </div>
          <button class="ih4-cat-toggle" title="Preview subcategories" aria-label="Preview subcategories">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <div class="ih4-subs-preview">
          <div class="ih4-subs-title">Subcategories:</div>
          <div class="ih4-sub-pills">${subsPills}</div>
        </div>
      `;

      card.querySelector('.ih4-cat-main').addEventListener('click', (e) => {
        if (e.target.closest('.ih4-cat-toggle')) return;
        if (selectedCat === catKey) {
          selectedCat = null;
        } else {
          selectedCat = catKey;
        }
        renderCategories();
        updateFooter();
      });

      card.querySelector('.ih4-cat-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.toggle('open');
        if (card.classList.contains('open')) {
          openPreviewCats.add(catKey);
        } else {
          openPreviewCats.delete(catKey);
        }
      });

      listEl.appendChild(card);
    }

    if (matchCount === 0) {
      listEl.innerHTML = '<div style="padding:32px 14px;text-align:center;color:#94a3b8;font-size:12.5px;">No categories in this section.</div>';
    }
  }

  secTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      secTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentSection = tab.dataset.sec;
      renderCategories();
    });
  });

  renderCategories();
  updateFooter();

  /* ==========================================================================
     Results Tab Application Shell (Single-Page App)
     ========================================================================== */

  function buildResultsTabHTML(categoriesList, initialData = null, initialMeta = null) {
    const serializedData = initialData ? JSON.stringify(initialData).replace(/<\/script>/gi, '<\\/script>') : 'null';
    const serializedMeta = initialMeta ? JSON.stringify(initialMeta).replace(/<\/script>/gi, '<\\/script>') : 'null';
    const hasInitial = Array.isArray(initialData);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Instamart Hunter v4 — Top Deals Results</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; }

    header {
      position: sticky; top: 0; background: #0f172a; color: #fff; padding: 14px 24px; z-index: 6;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
    }
    header h1 { font-size: 16px; margin: 0; font-weight: 800; letter-spacing: -.01em; display: flex; align-items: center; gap: 8px; }
    header .badge { font-size: 11px; background: #fc8019; color: #fff; padding: 2px 8px; border-radius: 12px; font-weight: 700; }
    header .scout-tag { font-size: 11px; background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
    header .header-actions { display: flex; align-items: center; gap: 12px; }
    .count { font-size: 13px; color: #cbd5e1; }
    .btn-action {
      padding: 7px 14px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #f8fafc;
      font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s ease;
    }
    .btn-action:hover { background: #334155; border-color: #475569; }

    .controls {
      position: sticky; top: 52px; background: #fff; border-bottom: 1px solid #e2e8f0; padding: 12px 24px;
      display: flex; gap: 12px; flex-wrap: wrap; z-index: 5;
    }
    .controls input, .controls select {
      padding: 9px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #0f172a; background: #f8fafc; outline: none;
    }
    .controls input:focus, .controls select:focus { border-color: #fc8019; background: #fff; }
    .controls input { flex: 1; min-width: 220px; }
    .controls.disabled { opacity: .5; pointer-events: none; }

    table { width: 100%; border-collapse: collapse; background: #fff; }
    thead th {
      position: sticky; top: 112px; background: #f8fafc; z-index: 4; text-align: left; padding: 11px 16px;
      font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; border-bottom: 1px solid #e2e8f0;
      cursor: pointer; user-select: none; white-space: nowrap;
    }
    thead th:hover { color: #fc8019; }
    thead th.sorted-asc::after { content: " \\25B2"; }
    thead th.sorted-desc::after { content: " \\25BC"; }
    tbody td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    tbody tr:hover { background: #fffaf5; }
    .thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: contain; background: #f8fafc; border: 1px solid #e2e8f0; }
    .name { font-weight: 600; max-width: 320px; }
    .name a { color: #0f172a; text-decoration: none; }
    .name a:hover { text-decoration: underline; color: #fc8019; }
    .pack { font-size: 11.5px; color: #64748b; margin-top: 2px; }
    .tag { display: inline-block; font-size: 11px; color: #475569; background: #f1f5f9; border-radius: 6px; padding: 2px 7px; }
    .discount { color: #16a34a; font-weight: 800; font-size: 14px; }
    .discount.zero { color: #94a3b8; font-weight: 600; font-size: 12px; }
    .mrp { color: #94a3b8; text-decoration: line-through; font-size: 11.5px; margin-left: 6px; }
    .links-cell { display: flex; gap: 6px; }
    .btn-small { font-size: 11px; padding: 4px 9px; border-radius: 6px; text-decoration: none; font-weight: 700; }
    .btn-search { background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; }
    .btn-search:hover { background: #fc8019; color: #fff; border-color: #fc8019; }
    .empty { padding: 70px 20px; text-align: center; color: #64748b; }

    #loading { padding: 100px 20px; text-align: center; }
    .spinner {
      width: 38px; height: 38px; border-radius: 50%; border: 3.5px solid #e2e8f0; border-top-color: #fc8019;
      margin: 0 auto 20px; animation: ih4-spin 0.8s linear infinite;
    }
    @keyframes ih4-spin { to { transform: rotate(360deg); } }
    #loading .msg { font-size: 15px; color: #1e293b; font-weight: 700; }
    #loading .sub { font-size: 12.5px; color: #64748b; margin-top: 6px; }
    #loading .bar-wrap { width: 260px; height: 7px; border-radius: 4px; background: #e2e8f0; margin: 18px auto 0; overflow: hidden; }
    #loading .bar { height: 100%; width: 0%; background: #fc8019; transition: width .25s ease; }
  </style>
</head>
<body>
  <header>
    <h1>🛒 Instamart Hunter <span class="badge">Page 1 Top Deals</span> <span class="scout-tag">Category Scout</span></h1>
    <div class="header-actions">
      <span class="count" id="count">${hasInitial ? initialData.length + ' deals' : 'Starting Scout…'}</span>
      
    </div>
  </header>

  <div class="controls ${hasInitial ? '' : 'disabled'}" id="controls">
    <input id="search" placeholder="Filter by product name, weight/size, category, subcategory…" />
    <select id="catFilter">
    <option value="">All Categories (${categoriesList.length})</option>
    ${categoriesList.map((c) => '<option value="' + c + '">' + c + '</option>').join('')}
  </select>
  </div>

  <div id="loading" style="${hasInitial ? 'display:none;' : ''}">
    <div class="spinner"></div>
    <div class="msg" id="loadMsg">Connecting to Swiggy Instamart…</div>
    <div class="sub" id="loadSub">Scouting Page 1 across selected categories</div>
    <div class="bar-wrap"><div class="bar" id="loadBar"></div></div>
  </div>

  <table id="resultsTable" style="${hasInitial && initialData.length ? 'display:table;' : 'display:none;'}">
    <thead>
      <tr>
        <th></th>
        <th data-key="name">Product & Pack</th>
        <th data-key="category">Category</th>
        <th data-key="subCategory">Subcategory</th>
        <th data-key="price">Price</th>
        <th data-key="discount">Discount</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>

  <div class="empty" id="emptyMsg" style="display:none;"></div>

  <script>
    let DATA = ${serializedData} || [];
    let META = ${serializedMeta} || null;
    let sortKey = 'discount', sortDir = 'desc', query = '', catFilter = '';

    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    function render() {
      const q = query.trim().toLowerCase();

      let rows = DATA.filter((r) => {
        if (catFilter && r.category !== catFilter) return false;
        if (!q) return true;
        return (r.name + ' ' + (r.pack || '') + ' ' + r.category + ' ' + r.subCategory).toLowerCase().includes(q);
      });

      rows.sort((a, b) => {
        let av = a[sortKey], bv = b[sortKey];
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      document.getElementById('count').textContent = rows.length + ' of ' + DATA.length + ' deals';
      const emptyEl = document.getElementById('emptyMsg');
      const tableEl = document.getElementById('resultsTable');

      if (rows.length === 0) {
        tableEl.style.display = 'none';
        emptyEl.style.display = 'block';
        emptyEl.innerHTML = '<div style="padding:40px;color:#94a3b8;font-size:13px;">No items match your search/filter criteria.</div>';
      } else {
        emptyEl.style.display = 'none';
        tableEl.style.display = 'table';
        document.getElementById('tbody').innerHTML = rows.map((r) => \`
          <tr>
            <td>\${r.image ? '<img class="thumb" src="https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_100,h_100,c_fit/' + esc(r.image) + '" loading="lazy">' : ''}</td>
            <td class="name">
              <a href="\${esc(r.searchLink)}" target="_blank" rel="noopener">\${esc(r.name)}</a>
              \${r.pack ? '<div class="pack">' + esc(r.pack) + '</div>' : ''}
            </td>
            <td>\${esc(r.category)}</td>
            <td><span class="tag">\${esc(r.subCategory)}</span></td>
            <td>₹\${r.price}\${r.mrp > r.price ? '<span class="mrp">₹' + r.mrp + '</span>' : ''}</td>
            <td>\${r.discount > 0 ? '<span class="discount">' + r.discount + '% OFF</span>' : '<span class="discount zero">—</span>'}</td>
            <td>
              <div class="links-cell">
                <a class="btn-small btn-search" href="\${esc(r.searchLink)}" target="_blank" rel="noopener" title="Search & Add on Instamart">Add ↗</a>
              </div>
            </td>
          </tr>
        \`).join('');
      }

      document.querySelectorAll('thead th[data-key]').forEach((th) => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.key === sortKey) th.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      });
    }

    document.getElementById('search').addEventListener('input', (e) => { query = e.target.value; render(); });
    document.getElementById('catFilter').addEventListener('change', (e) => { catFilter = e.target.value; render(); });

    document.querySelectorAll('thead th[data-key]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (sortKey === key) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = key;
          sortDir = key === 'name' || key === 'category' || key === 'subCategory' ? 'asc' : 'desc';
        }
        render();
      });
    });

    window.__ihReceive = function (msg) {
      if (!msg || (msg.source && msg.source !== 'ih4')) return;
      if (msg.type === 'progress') {
        const loadMsg = document.getElementById('loadMsg');
        const loadSub = document.getElementById('loadSub');
        const loadBar = document.getElementById('loadBar');
        if (loadMsg) loadMsg.textContent = msg.text || 'Fetching…';
        if (typeof msg.doneCount === 'number' && typeof msg.total === 'number') {
          if (loadSub) loadSub.textContent = msg.doneCount + ' of ' + msg.total + ' items completed';
          if (loadBar) loadBar.style.width = Math.round((msg.doneCount / msg.total) * 100) + '%';
        }
      } else if (msg.type === 'done') {
        DATA = msg.items || [];
        META = msg.meta || null;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('controls').classList.remove('disabled');
        
        render();
      }
    };

    window.addEventListener('message', (e) => {
      if (e.data && e.data.source === 'ih4') {
        window.__ihReceive(e.data);
      }
    });

    if (${hasInitial}) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('controls').classList.remove('disabled');
      render();
    } else {
      try {
        if (window.opener && window.opener.__IH4_LATEST_MSG__) {
          window.__ihReceive(window.opener.__IH4_LATEST_MSG__);
        }
      } catch (e) {}

      try {
        const stored = sessionStorage.getItem('__IH4_LATEST_DEALS__');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (Date.now() - (parsed.time || 0) < 180000)) {
            window.__ihReceive(parsed);
          }
        }
      } catch (e) {}
    }
  </script>
</body>
</html>`;
  }

  /* ==========================================================================
     Execution Controller (Category Scout Loop)
     ========================================================================== */



  function openResults() {
    if (!finalItemsCache || (!finalItemsCache.length && !latestMetaCache)) return;
    const catNameClean = selectedCat ? selectedCat.replace(/^\S+\s/, '') : 'Instamart';
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(buildResultsTabHTML([catNameClean], finalItemsCache, latestMetaCache));
      w.document.close();
    }
  }

  openResultsLink.addEventListener('click', openResults);

  fetchBtn.addEventListener('click', async () => {
    if (isScouting) return;

    if (hasResults) {
      openResults();
      return;
    }

    if (!selectedCat) return;

    const storeIds = detectStoreIds();
    if (!storeIds) {
      statusEl.textContent = 'Could not detect store ID. Please navigate to an Instamart page first.';
      return;
    }

    const catKey = selectedCat;
    const catObj = CFG.cats[catKey];
    if (!catObj) return;

    const catNameClean = catKey.replace(/^\S+\s/, '');

    isScouting = true;
    hasResults = false;
    fetchBtn.disabled = true;
    fetchBtn.textContent = '⏳ Scouting Deals…';
    fetchBtn.style.background = '';
    openResultsLink.style.display = 'none';

    const dispatch = (msg) => {
      const payload = { source: 'ih4', time: Date.now(), ...msg };
      try { sessionStorage.setItem('__IH4_LATEST_DEALS__', JSON.stringify(payload)); } catch (e) {}
      try { window.__IH4_LATEST_MSG__ = payload; } catch (e) {}
    };

    activeDispatch = dispatch;
    const resultMap = new Map();
    let totalScanned = 0;
    let overallMaxDiscount = 0;

    // Discover subcategories dynamically if not pre-mapped
    if (!catObj.isCampaign && (!catObj.subs || catObj.subs.length === 0)) {
      statusEl.textContent = `Discovering subcategories for "${catObj.cName}"…`;
      dispatch({ type: 'progress', text: `Discovering subcategories for "${catObj.cName}"…`, doneCount: 0, total: 1 });
      await fetchCategorySubcategories(catObj, storeIds);
      await sleep(600);
    }

        let totalSubs = 1;
    if (catObj.isCampaign) {
      statusEl.textContent = `Scouting "${catNameClean}" deals…`;
      dispatch({ type: 'progress', text: `Scouting "${catNameClean}" deals…`, doneCount: 0, total: 1 });

      const res = await fetchCampaignDeals(catKey, catObj, storeIds, resultMap, (detail) => {
        statusEl.textContent = detail;
        dispatch({ type: 'progress', text: detail, doneCount: 0, total: 1 });
      });

      if (res) {
        totalScanned = res.scanned;
        overallMaxDiscount = res.maxDiscount;
      }
      totalSubs = catObj.subs?.length || 1;
    } else {
      const tasks = catObj.subs.map((sub) => ({ catKey, catObj, sub }));
      totalSubs = tasks.length;

      statusEl.textContent = `Scouting ${totalSubs} subcategories in "${catNameClean}"…`;
      dispatch({ type: 'progress', text: `Scouting ${totalSubs} subcategories in "${catNameClean}"…`, doneCount: 0, total: totalSubs });

      const failedTasks = [];
      let doneCount = 0;

      // Phase 1: Fast initial pass (small 150ms gap, no jitter)
      for (let i = 0; i < totalSubs; i++) {
        const task = tasks[i];
        const taskLabel = `${catNameClean} > ${task.sub.name}`;

        dispatch({
          type: 'progress',
          text: `Scouting [${i + 1}/${totalSubs}]: ${taskLabel}…`,
          doneCount,
          total: totalSubs
        });

        statusEl.textContent = `[${i + 1}/${totalSubs}] Scouting "${task.sub.name}"…`;

        const res = await fetchSubcategoryDeals(task.catKey, task.catObj, task.sub, storeIds, resultMap, (detail) => {
          statusEl.textContent = `[${i + 1}/${totalSubs}] ${detail}`;
          dispatch({ type: 'progress', text: `[${i + 1}/${totalSubs}] ${detail}`, doneCount, total: totalSubs });
        }, false);

        if (!res || res.failed) {
          failedTasks.push(task);
          statusEl.textContent = `[${i + 1}/${totalSubs}] "${task.sub.name}" queued for retry`;
        } else {
          totalScanned += res.scanned;
          overallMaxDiscount = Math.max(overallMaxDiscount, res.maxDiscount);
        }

        doneCount++;

        // Small 150ms pause between subcategories on initial pass
        if (i < totalSubs - 1) {
          await sleep(150);
        }
      }

      // Phase 2: Retry phase WITH jitter (1.8s - 2.8s) for any failed subcategories
      if (failedTasks.length > 0) {
        statusEl.textContent = `Retrying ${failedTasks.length} subcategories with anti-429 jitter (1.8s–2.8s)…`;
        await sleep(1200);

        for (let j = 0; j < failedTasks.length; j++) {
          const task = failedTasks[j];
          const pauseMs = CFG.pacing.subMin + Math.floor(Math.random() * (CFG.pacing.subMax - CFG.pacing.subMin));
          const pauseSec = (pauseMs / 1000).toFixed(1);

          statusEl.textContent = `[Retry ${j + 1}/${failedTasks.length}] Waiting ${pauseSec}s jitter before "${task.sub.name}"…`;
          dispatch({
            type: 'progress',
            text: `Retry jitter (${pauseSec}s) before "${task.sub.name}"…`,
            doneCount: totalSubs - failedTasks.length + j,
            total: totalSubs
          });

          await sleep(pauseMs);

          statusEl.textContent = `[Retry ${j + 1}/${failedTasks.length}] Retrying "${task.sub.name}"…`;
          const res = await fetchSubcategoryDeals(task.catKey, task.catObj, task.sub, storeIds, resultMap, (detail) => {
            statusEl.textContent = `[Retry ${j + 1}/${failedTasks.length}] ${detail}`;
          }, true);

          if (res && !res.failed) {
            totalScanned += res.scanned;
            overallMaxDiscount = Math.max(overallMaxDiscount, res.maxDiscount);
          }
        }
      }
    }

    const finalItems = Array.from(resultMap.values());
    finalItemsCache = finalItems;
    latestMetaCache = {
      totalScanned,
      overallMaxDiscount,
      totalSubs,
      totalCats: 1,
      categoryName: catNameClean
    };

    isScouting = false;
    hasResults = true;

    statusEl.innerHTML = `<span style="color:#16a34a;font-weight:700;">✓ Complete:</span> Loaded <b>${finalItems.length} deals</b> across ${totalSubs} subcategories (Max: ${overallMaxDiscount}% OFF).`;
    dispatch({ type: 'done', items: finalItems, meta: latestMetaCache });

    fetchBtn.disabled = false;
    fetchBtn.style.background = '#16a34a';
    fetchBtn.textContent = `🟢 View ${finalItems.length} Deals in Results Tab ↗`;

    openResultsLink.style.display = 'block';
    openResultsLink.textContent = `✨ View ${finalItems.length} Deals in Results Tab ↗`;

    // Automatically open results tab now that items are fetched!
    openResults();
  });

  panel.classList.add('open');
})();
