async function resolvePincode(pincode) {
  if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
    return null;
  }

  const cleanPin = pincode.trim();
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?postalcode=${cleanPin}&country=India&format=json`;
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'SwiggyDealBot/1.0' }
    });
    const data = await res.json();
    if (!data || !data.length) return null;

    const { lat, lon, display_name } = data[0];
    const parts = display_name.split(',').map(s => s.trim());
    const shortArea = parts.slice(0, 3).join(', ');

    return {
      pincode: cleanPin,
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      area: shortArea || display_name
    };
  } catch (err) {
    console.error('[Geo] Pincode lookup error:', err.message);
    return null;
  }
}

module.exports = {
  resolvePincode
};
