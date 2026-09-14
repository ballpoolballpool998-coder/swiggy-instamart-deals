/**
 * Swiggy Instamart Keyword Deal Hunter (Bookmarklet)
 * 
 * Features:
 * - High-to-Low Discount sorted search via Swiggy Instamart API
 * - Tiered filtering: Essentials (≥65% OFF) and Snacks & Treats (≥75% OFF)
 * - Early-exit pagination (stops as soon as discounts drop below cutoff)
 * - Automatic store ID detection from browser session & local storage
 * - Responsive standalone results tab with search, filters, sorting & direct Instamart search links
 */
javascript:(async () => {
  'use strict';

  const CONFIG = {
    workers: 3,
    thresholds: {
      essential: 65,
      treats: 75
    },
    queries: [
      // Grocery Essentials (Target: ≥65% OFF)
      { query: "Atta", type: "essential" },
      { query: "Rice", type: "essential" },
      { query: "Dal", type: "essential" },
      { query: "Oil", type: "essential" },
      { query: "Ghee", type: "essential" },
      { query: "Milk", type: "essential" },
      { query: "Curd", type: "essential" },
      { query: "Paneer", type: "essential" },
      { query: "Butter", type: "essential" },
      { query: "Cheese", type: "essential" },
      { query: "Cream", type: "essential" },
      { query: "Bread", type: "essential" },
      { query: "Eggs", type: "essential" },
      { query: "Masala", type: "essential" },
      { query: "Vegetables", type: "essential" },
      { query: "Fruits", type: "essential" },
      { query: "Detergent", type: "essential" },
      { query: "Dishwash", type: "essential" },
      { query: "Toilet Cleaner", type: "essential" },
      { query: "Skincare", type: "essential" },
      { query: "Haircare", type: "essential" },
      { query: "Baby Care", type: "essential" },
      { query: "Body Wash", type: "essential" },

      // Snacks, Treats & Munchies (Target: ≥75% OFF)
      { query: "Snacks", type: "treats" },
      { query: "Chips", type: "treats" },
      { query: "Namkeen", type: "treats" },
      { query: "Biscuits", type: "treats" },
      { query: "Cookies", type: "treats" },
      { query: "Chocolates", type: "treats" },
      { query: "Ice Cream", type: "treats" },
      { query: "Sweets", type: "treats" },
      { query: "Cold Drinks", type: "treats" },
      { query: "Juice", type: "treats" },
      { query: "Tea", type: "treats" },
      { query: "Coffee", type: "treats" },
      { query: "Instant Food", type: "treats" },
      { query: "Dry Fruits", type: "treats" },
      { query: "Cake", type: "treats" }
    ]
  };

  // UI Floating Button
  let btn = document.getElementById("swiggy-hunter-btn");
  if (btn) btn.remove();
  btn = document.createElement("div");
  btn.id = "swiggy-hunter-btn";
  btn.style.cssText = "position:fixed;bottom:80px;right:20px;z-index:999999;background:#111;color:#fff;padding:12px 20px;border-radius:30px;font:bold 13px system-ui,-apple-system,sans-serif;box-shadow:0 6px 22px rgba(0,0,0,0.4);cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s ease;";
  btn.innerHTML = "🎯 <span>Hunt Keyword Deals</span>";
  document.body.appendChild(btn);

  const updateStatus = (text) => {
    const span = btn.querySelector("span");
    if (span) span.innerText = text;
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let pauseUntil = 0;
  const checkPause = async () => {
    while (Date.now() < pauseUntil) {
      updateStatus("⚠️ Paused (Rate Limit)...");
      await sleep(1000);
    }
  };

  const safeFetch = async (url, body, retry = 0) => {
    await checkPause();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include"
      });

      if (res.status === 403 || res.status === 429) {
        if (retry >= 3) return null;
        pauseUntil = Date.now() + 15000;
        await checkPause();
        return safeFetch(url, body, retry + 1);
      }
      return res.status === 200 ? await res.json() : null;
    } catch (e) {
      return null;
    }
  };

  btn.onclick = async () => {
    btn.style.background = "#fc8019";
    btn.onclick = null;
    updateStatus("🔍 Detecting Store ID…");

    const storeIds = new Set();
    try {
      performance.getEntries().forEach((e) => {
        const m = e.name.match(/storeId=(\d+)/);
        if (m) storeIds.add(m[1]);
      });
      const loc = localStorage.getItem("userLocation") || localStorage.getItem("im_user_location");
      if (loc) {
        const m = loc.match(/"storeId"\s*:\s*"?(\d+)"?/);
        if (m) storeIds.add(m[1]);
      }
    } catch (e) {}

    let validStores = Array.from(storeIds).filter((id) => id.length > 4);
    if (!validStores.length) {
      const manual = prompt("Enter your Instamart Store ID (or comma-separated IDs):", "1400216");
      if (manual) validStores = manual.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (!validStores.length) {
      updateStatus("❌ No Store ID Found");
      return;
    }

    const dealsMap = new Map();
    const taskQueue = [];

    validStores.forEach((storeId) => {
      CONFIG.queries.forEach((item) => {
        taskQueue.push({ storeId, query: item.query, type: item.type });
      });
    });

    const totalTasks = taskQueue.length;
    let completedTasks = 0;

    const runWorker = async (task) => {
      const cutoff = CONFIG.thresholds[task.type] || 65;
      let offset = 0;
      let keepPaging = true;
      let errCount = 0;

      while (keepPaging && offset < 64) {
        const url = `https://www.swiggy.com/api/instamart/search/v2?offset=${offset / 32}&ageConsent=false&storeId=${task.storeId}`;
        const json = await safeFetch(url, {
          facets: [],
          sortAttribute: "discountPercentHighToLow",
          query: task.query,
          search_results_offset: String(offset),
          page_type: "INSTAMART_SEARCH_PAGE"
        });

        if (!json?.data) {
          errCount++;
          if (errCount > 1) break;
          await sleep(1000);
          continue;
        }
        errCount = 0;

        const variations = [];
        const extractVars = (node) => {
          if (!node || typeof node !== "object") return;
          if (node.variations && Array.isArray(node.variations)) {
            variations.push(...node.variations);
          } else if (node.displayName && (node.price || node.offerPrice)) {
            variations.push(node);
          } else {
            Object.values(node).forEach(extractVars);
          }
        };
        extractVars(json.data);

        if (!variations.length) break;

        let maxDiscOnPage = 0;
        variations.forEach((v) => {
          if (v.inventory?.inStock === false) return;
          const mrp = parseFloat(v.price?.mrp?.units || v.price?.mrp || 0);
          const price = parseFloat(v.price?.offerPrice?.units || v.price?.offerPrice || 0);
          const disc = mrp > 0 ? ((mrp - price) / mrp) * 100 : 0;
          if (disc > maxDiscOnPage) maxDiscOnPage = disc;

          // Check against category cutoff
          if (disc < cutoff) return;

          const name = v.displayName;
          if (!name) return;

          const dealRecord = {
            name,
            brand: v.brandName || v.brand || "Instamart",
            price,
            mrp,
            discount: Math.round(disc),
            savings: Math.round(mrp - price),
            img: v.imageIds?.[0] || v.imageId || "",
            query: task.query,
            type: task.type,
            storeId: task.storeId
          };

          if (!dealsMap.has(name) || price < dealsMap.get(name).price) {
            dealsMap.set(name, dealRecord);
          }
        });

        // Early exit: if highest discount on page 1 is below cutoff, do not fetch page 2
        if (maxDiscOnPage < cutoff) {
          keepPaging = false;
        } else {
          offset += 32;
        }

        await sleep(350);
      }

      completedTasks++;
      updateStatus(`📦 ${Math.round((completedTasks / totalTasks) * 100)}% (${dealsMap.size} deals)`);
    };

    let activeCount = 0;
    while (taskQueue.length || activeCount > 0) {
      while (activeCount < CONFIG.workers && taskQueue.length) {
        activeCount++;
        runWorker(taskQueue.shift()).then(() => activeCount--);
      }
      await sleep(200);
    }

    updateStatus(`✅ Found ${dealsMap.size} Deals!`);
    const dealsList = Array.from(dealsMap.values());
    dealsList.sort((a, b) => b.discount - a.discount);

    if (!dealsList.length) {
      alert(`Scanned ${totalTasks} searches. No deals found matching thresholds (Essentials ≥${CONFIG.thresholds.essential}%, Snacks ≥${CONFIG.thresholds.treats}%). Try lowering thresholds!`);
      btn.remove();
      return;
    }

    setTimeout(() => {
      const resultsWin = window.open("", "SwiggyKeywordDeals");
      if (!resultsWin) {
        alert("Pop-up blocked! Please allow pop-ups for this site to view the deals dashboard.");
        return;
      }

      resultsWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Instamart Keyword Deal Hunter</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f6f8; margin: 0; padding: 16px; color: #222; }
    .header { position: sticky; top: 0; background: #fff; padding: 14px 20px; border-radius: 14px; box-shadow: 0 4px 18px rgba(0,0,0,0.06); margin-bottom: 20px; z-index: 100; }
    .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .title { font-size: 18px; font-weight: 800; color: #111; }
    .badge { background: #fc8019; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .controls { display: flex; flex-wrap: wrap; gap: 10px; }
    input, select { padding: 9px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; background: #fafafa; outline: none; }
    input#search { flex: 2; min-width: 180px; }
    select { flex: 1; min-width: 140px; cursor: pointer; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
    .card { background: #fff; border-radius: 16px; border: 1px solid #eef0f2; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.15s, box-shadow 0.15s; }
    .card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .img-wrap { position: relative; padding-top: 90%; background: #fafafa; }
    .img-wrap img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; padding: 14px; }
    .disc-tag { position: absolute; top: 10px; left: 10px; background: #00875a; color: #fff; font-size: 12px; font-weight: 800; padding: 4px 8px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
    .disc-tag.treats { background: #e0284f; }
    .info { padding: 14px; display: flex; flex-direction: column; flex: 1; }
    .name { font-size: 13px; font-weight: 600; line-height: 1.4; height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 6px; }
    .query-tag { font-size: 11px; color: #777; margin-bottom: 8px; }
    .price-row { display: flex; align-items: baseline; gap: 8px; margin-top: auto; }
    .price { font-size: 17px; font-weight: 800; color: #111; }
    .mrp { font-size: 13px; color: #888; text-decoration: line-through; }
    .savings { font-size: 11px; color: #00875a; font-weight: 700; margin-top: 3px; }
    .btn-link { margin-top: 10px; display: block; text-align: center; background: #fc8019; color: #fff; text-decoration: none; padding: 8px; border-radius: 8px; font-size: 12px; font-weight: bold; }
    .btn-link:hover { background: #e26f12; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-row">
      <div class="title">⚡ Instamart Keyword Deals</div>
      <span class="badge" id="dealCount">${dealsList.length} Deals Found</span>
    </div>
    <div class="controls">
      <input id="search" placeholder="Search ${dealsList.length} items..." onkeyup="render()">
      <select id="typeFilter" onchange="render()">
        <option value="all">All Categories</option>
        <option value="essential">Grocery Essentials (≥65%)</option>
        <option value="treats">Snacks & Treats (≥75%)</option>
      </select>
      <select id="sort" onchange="render()">
        <option value="discount">Sort: Highest Discount</option>
        <option value="priceAsc">Sort: Price (Low to High)</option>
        <option value="savings">Sort: Maximum Savings (₹)</option>
      </select>
    </div>
  </div>
  <div id="grid" class="grid"></div>
  <script>
    const DEALS = ${JSON.stringify(dealsList)};
    function render() {
      const q = document.getElementById("search").value.toLowerCase();
      const type = document.getElementById("typeFilter").value;
      const sort = document.getElementById("sort").value;

      let filtered = DEALS.filter(d => {
        if (type !== "all" && d.type !== type) return false;
        if (q && !d.name.toLowerCase().includes(q) && !d.query.toLowerCase().includes(q)) return false;
        return true;
      });

      if (sort === "discount") filtered.sort((a, b) => b.discount - a.discount);
      if (sort === "priceAsc") filtered.sort((a, b) => a.price - b.price);
      if (sort === "savings") filtered.sort((a, b) => b.savings - a.savings);

      document.getElementById("dealCount").innerText = filtered.length + " Deals";

      const html = filtered.map(d => {
        const imgUrl = d.img ? ("https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_360,h_360,c_fit/" + d.img) : "https://via.placeholder.com/300";
        const tagClass = d.type === "treats" ? "disc-tag treats" : "disc-tag";
        const searchUrl = "https://www.swiggy.com/instamart/search?custom_back=true&query=" + encodeURIComponent(d.name);
        return \`<div class="card">
          <div class="img-wrap">
            <span class="\${tagClass}">\${d.discount}% OFF</span>
            <img src="\${imgUrl}" loading="lazy" alt="">
          </div>
          <div class="info">
            <div class="name" title="\${d.name}">\${d.name}</div>
            <div class="query-tag">🏷️ \${d.query} (\${d.type === 'essential' ? 'Essential' : 'Snack'})</div>
            <div class="price-row">
              <span class="price">₹\${d.price}</span>
              <span class="mrp">₹\${d.mrp}</span>
            </div>
            <div class="savings">Save ₹\${d.savings}</div>
            <a class="btn-link" href="\${searchUrl}" target="_blank">Search on Instamart ↗</a>
          </div>
        </div>\`;
      }).join("");

      document.getElementById("grid").innerHTML = html || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">No deals match your criteria.</div>';
    }
    render();
  <\/script>
</body>
</html>`);
      resultsWin.document.close();
      btn.remove();
    }, 400);
  };
})();
