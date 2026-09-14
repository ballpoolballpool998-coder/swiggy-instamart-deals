const crypto = require('crypto');

function generateMatcher() {
  const rand5 = () => Math.floor(10000 + Math.random() * 90000).toString();
  const raw = rand5() + Date.now().toString() + rand5();
  return raw.split('').map((d) => (parseInt(d, 10) + 7).toString(36)).join('');
}

function getDeviceId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getBuildVersion() {
  return '2.372.0';
}

function getHeaders(matcher = null, custom = {}) {
  const headers = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'matcher': matcher || generateMatcher(),
    'x-build-version': getBuildVersion(),
    'x-device-id': process.env.SWIGGY_DEVICE_ID || getDeviceId(),
    'referer': 'https://www.swiggy.com/instamart',
    'origin': 'https://www.swiggy.com',
    'sec-ch-ua': '"Chromium";v="152", "Not?A_Brand";v="24", "Microsoft Edge";v="152"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',
    ...custom
  };

  if (process.env.SWIGGY_COOKIE) {
    headers['cookie'] = process.env.SWIGGY_COOKIE;
  }

  return headers;
}

module.exports = {
  generateMatcher,
  getDeviceId,
  getBuildVersion,
  getHeaders
};
