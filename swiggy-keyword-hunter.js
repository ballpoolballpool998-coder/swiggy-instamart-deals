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
  btn.style.cssText = "position:fixed;bottom:80px;right:20px;z-index:999999;background:#ffffff;color:#0f172a;border:1px solid #cbd5e1;padding:10px 18px;border-radius:24px;font:600 13px system-ui,-apple-system,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.08);cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.15s ease;";
  btn.innerHTML = "<span>Hunt Keyword Deals</span>";
  btn.onmouseenter = () => { btn.style.borderColor = "#fc8019"; };
  btn.onmouseleave = () => { btn.style.borderColor = "#cbd5e1"; };
  document.body.appendChild(btn);

  const updateStatus = (text) => {
    const span = btn.querySelector("span");
    if (span) span.innerText = text;
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let pauseUntil = 0;
  const checkPause = async () => {
    while (Date.now() < pauseUntil) {
      updateStatus("Paused (Rate limit cooldown)...");
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
        pauseUntil = Date.now() + 12000;
        await checkPause();
        return safeFetch(url, body, retry + 1);
      }

      if (res.status !== 200) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  btn.onclick = async () => {
    btn.style.background = "#fc8019";
    btn.style.color = "#ffffff";
    btn.style.borderColor = "#fc8019";
    btn.onclick = null;
    updateStatus("Detecting Store...");

    const storeIds = new Set();

    // 1. Check network requests
    try {
      performance.getEntries().forEach((entry) => {
        const match = entry.name.match(/storeId=(\d+)/);
        if (match) storeIds.add(match[1]);
      });
    } catch (e) {}

    // 2. Check LocalStorage
    try {
      const loc = localStorage.getItem("userLocation") || localStorage.getItem("im_user_location");
      if (loc) {
        const match = loc.match(/"storeId"\s*:\s*"?(\d+)"?/);
        if (match) storeIds.add(match[1]);
      }
    } catch (e) {}

    let validStores = Array.from(storeIds).filter((id) => id.length > 4);

    if (!validStores.length) {
      const manual = prompt("Enter your Instamart Store ID (or comma-separated IDs):", "1400216");
      if (manual) validStores = manual.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (!validStores.length) {
      updateStatus("Store ID Not Found");
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
      updateStatus(`${Math.round((completedTasks / totalTasks) * 100)}% (${dealsMap.size} deals)`);
    };

    let activeCount = 0;
    while (taskQueue.length || activeCount > 0) {
      while (activeCount < CONFIG.workers && taskQueue.length) {
        activeCount++;
        runWorker(taskQueue.shift()).then(() => activeCount--);
      }
      await sleep(200);
    }

    updateStatus(`Found ${dealsMap.size} Deals`);
    const dealsList = Array.from(dealsMap.values());
    dealsList.sort((a, b) => b.discount - a.discount);

    if (!dealsList.length) {
      alert(`Scanned ${totalTasks} searches. No deals found matching thresholds (Essentials ≥${CONFIG.thresholds.essential}%, Snacks ≥${CONFIG.thresholds.treats}%).`);
      btn.remove();
      return;
    }

    setTimeout(() => {
      const resultsWin = window.open("", "SwiggyKeywordDeals");
      if (!resultsWin) {
        alert("Pop-up blocked. Please allow pop-ups for swiggy.com to view the deals dashboard.");
        return;
      }

      const serializedDeals = JSON.stringify(dealsList).replace(/<\/script>/gi, '<\\/script>');

      const html = '<!DOCTYPE html>'
        + '<html lang="en">'
        + '<head>'
        + '<meta charset="utf-8">'
        + '<meta name="viewport" content="width=device-width,initial-scale=1">'
        + '<title>Instamart Keyword Deals</title>'
        + '<style>'
        + ':root{color-scheme:light;}'
        + '*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}'
        + 'body{background:#f8fafc;color:#0f172a;padding:20px;}'
        + '.header{position:sticky;top:0;background:#ffffff;padding:16px 20px;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 2px 10px rgba(0,0,0,0.03);margin-bottom:20px;z-index:100;}'
        + '.title-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}'
        + '.title{font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;}'
        + '.badge{background:#fff7ed;color:#ea580c;border:1px solid #ffedd5;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;}'
        + '.controls{display:flex;flex-wrap:wrap;gap:10px;}'
        + 'input,select{padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;background:#f8fafc;color:#0f172a;outline:none;}'
        + 'input:focus,select:focus{border-color:#fc8019;background:#ffffff;}'
        + 'input#search{flex:2;min-width:200px;}'
        + 'select{flex:1;min-width:150px;cursor:pointer;}'
        + '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px;}'
        + '.card{background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;display:flex;flex-direction:column;transition:border-color 0.15s,box-shadow 0.15s;}'
        + '.card:hover{border-color:#cbd5e1;box-shadow:0 4px 16px rgba(0,0,0,0.04);}'
        + '.img-wrap{position:relative;padding-top:85%;background:#f8fafc;border-bottom:1px solid #f1f5f9;}'
        + '.img-wrap img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;padding:12px;}'
        + '.disc-tag{position:absolute;top:8px;left:8px;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;font-size:11px;font-weight:700;padding:3px 7px;border-radius:6px;}'
        + '.disc-tag.treats{background:#fee2e2;color:#b91c1c;border-color:#fecaca;}'
        + '.info{padding:14px;display:flex;flex-direction:column;flex:1;}'
        + '.name{font-size:13px;font-weight:600;line-height:1.4;height:36px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:6px;color:#0f172a;}'
        + '.query-tag{font-size:11px;color:#64748b;margin-bottom:8px;}'
        + '.price-row{display:flex;align-items:baseline;gap:6px;margin-top:auto;}'
        + '.price{font-size:16px;font-weight:700;color:#0f172a;}'
        + '.mrp{font-size:12px;color:#94a3b8;text-decoration:line-through;}'
        + '.savings{font-size:11px;color:#16a34a;font-weight:600;margin-top:3px;}'
        + '.btn-link{margin-top:10px;display:block;text-align:center;background:#0f172a;color:#ffffff;text-decoration:none;padding:7px 10px;border-radius:6px;font-size:12px;font-weight:600;transition:background 0.15s;}'
        + '.btn-link:hover{background:#fc8019;}'
        + '</style>'
        + '</head>'
        + '<body>'
        + '<div class="header">'
        + '<div class="title-row">'
        + '<div class="title">Instamart Keyword Deals</div>'
        + '<span class="badge" id="dealCount">' + dealsList.length + ' Deals</span>'
        + '</div>'
        + '<div class="controls">'
        + '<input id="search" placeholder="Search ' + dealsList.length + ' products...">'
        + '<select id="typeFilter">'
        + '<option value="all">All Items</option>'
        + '<option value="essential">Essentials (&ge;65% OFF)</option>'
        + '<option value="treats">Snacks &amp; Treats (&ge;75% OFF)</option>'
        + '</select>'
        + '<select id="sort">'
        + '<option value="discount">Sort: Highest Discount</option>'
        + '<option value="priceAsc">Sort: Price (Low to High)</option>'
        + '<option value="savings">Sort: Maximum Savings</option>'
        + '</select>'
        + '</div>'
        + '</div>'
        + '<div id="grid" class="grid"></div>'
        + '<script>'
        + 'var DEALS = ' + serializedDeals + ';'
        + 'function esc(s){return String(s||\'\').replace(/[&<>"\\\']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","\'":"&#39;"}[m];});}'
        + 'function render(){'
        + '  var q = document.getElementById("search").value.trim().toLowerCase();'
        + '  var type = document.getElementById("typeFilter").value;'
        + '  var sort = document.getElementById("sort").value;'
        + '  var filtered = DEALS.filter(function(d){'
        + '    if(type !== "all" && d.type !== type) return false;'
        + '    if(q && d.name.toLowerCase().indexOf(q) === -1 && d.query.toLowerCase().indexOf(q) === -1) return false;'
        + '    return true;'
        + '  });'
        + '  if(sort === "discount") filtered.sort(function(a,b){return b.discount - a.discount;});'
        + '  if(sort === "priceAsc") filtered.sort(function(a,b){return a.price - b.price;});'
        + '  if(sort === "savings") filtered.sort(function(a,b){return b.savings - a.savings;});'
        + '  document.getElementById("dealCount").innerText = filtered.length + " Deals";'
        + '  var html = "";'
        + '  for(var i = 0; i < filtered.length; i++){'
        + '    var d = filtered[i];'
        + '    var imgUrl = d.img ? ("https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_360,h_360,c_fit/" + d.img) : "";'
        + '    var tagClass = d.type === "treats" ? "disc-tag treats" : "disc-tag";'
        + '    var searchUrl = "https://www.swiggy.com/instamart/search?custom_back=true&query=" + encodeURIComponent(d.name);'
        + '    html += \'<div class="card">\' '
        + '      + \'<div class="img-wrap">\' '
        + '      + \'<span class="\' + tagClass + \'">\' + d.discount + \'% OFF</span>\' '
        + '      + (imgUrl ? \'<img src="\' + imgUrl + \'" loading="lazy" alt="">\' : \'\') '
        + '      + \'</div>\' '
        + '      + \'<div class="info">\' '
        + '      + \'<div class="name" title="\' + esc(d.name) + \'">\' + esc(d.name) + \'</div>\' '
        + '      + \'<div class="query-tag">\' + (d.type === "essential" ? "Essential" : "Snack") + " &bull; " + esc(d.query) + \'</div>\' '
        + '      + \'<div class="price-row">\' '
        + '      + \'<span class="price">&#8377;\' + d.price + \'</span>\' '
        + '      + (d.mrp > d.price ? \'<span class="mrp">&#8377;\' + d.mrp + \'</span>\' : \'\') '
        + '      + \'</div>\' '
        + '      + (d.savings > 0 ? \'<div class="savings">Save &#8377;\' + d.savings + \'</div>\' : \'\') '
        + '      + \'<a class="btn-link" href="\' + searchUrl + \'" target="_blank" rel="noopener">Search on Instamart &rarr;</a>\' '
        + '      + \'</div></div>\';'
        + '  }'
        + '  document.getElementById("grid").innerHTML = html || \'<div style="grid-column:1/-1;text-align:center;padding:40px;color:#64748b;font-size:13px;">No deals match your search criteria.</div>\';'
        + '}'
        + 'document.getElementById("search").addEventListener("input", render);'
        + 'document.getElementById("typeFilter").addEventListener("change", render);'
        + 'document.getElementById("sort").addEventListener("change", render);'
        + 'render();'
        + '<' + '/script>'
        + '</body>'
        + '</html>';

      resultsWin.document.write(html);
      resultsWin.document.close();
      btn.remove();
    }, 400);
  };
})();
