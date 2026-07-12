const axios = require('axios');
const crypto = require('crypto');

const CHARLOTTE_BOUNDS = {
  west: -81.0396,
  east: -80.5497,
  south: 35.0269,
  north: 35.5018,
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.zillow.com/',
};

function makeId(address, source = 'zillow') {
  return `${source}_${crypto.createHash('md5').update(address).digest('hex').slice(0, 12)}`;
}

async function scrapeZillow() {
  const searchQueryState = {
    isMapVisible: true,
    mapBounds: CHARLOTTE_BOUNDS,
    filterState: {
      isNewConstruction: { value: true },
      isTownhome: { value: true },
      price: { min: 200000, max: 1500000 },
      monthlyPayment: { min: 1000, max: 8000 },
    },
    isListVisible: true,
    mapZoom: 11,
    pagination: { currentPage: 1 },
  };

  const url = `https://www.zillow.com/search/GetSearchPageState.htm?searchQueryState=${encodeURIComponent(JSON.stringify(searchQueryState))}&wants={"cat1":["listResults","mapResults"],"cat2":["total"]}&requestId=1`;

  try {
    const resp = await axios.get(url, {
      headers: { ...HEADERS, 'X-Requested-With': 'XMLHttpRequest' },
      timeout: 15000,
    });

    const data = resp.data;
    const results = data?.cat1?.searchResults?.listResults || [];

    return results.map(r => ({
      id: makeId(r.address || r.zpid?.toString() || Math.random().toString()),
      source: 'zillow',
      url: r.detailUrl ? `https://www.zillow.com${r.detailUrl}` : null,
      address: r.address || '',
      city: r.addressCity || extractCity(r.address || ''),
      state: r.addressState || 'NC',
      zip: r.addressZipcode || '',
      price: r.unformattedPrice || parsePrice(r.price),
      original_price: r.priceReduction ? (r.unformattedPrice + Math.abs(parsePrice(r.priceReduction))) : null,
      beds: r.beds || null,
      baths: r.baths || null,
      sqft: r.area || null,
      type: 'Townhome',
      status: r.statusType || 'FOR_SALE',
      builder: r.brokerName || null,
      community: r.buildingName || null,
      images: r.imgSrc ? [r.imgSrc] : [],
      latitude: r.latLong?.latitude,
      longitude: r.latLong?.longitude,
      days_on_market: r.daysOnZillow || 0,
      is_new_construction: 1,
    }));
  } catch (err) {
    // Zillow blocks bot traffic (403) most of the time. Return nothing rather
    // than synthetic listings — the grid should only ever show real inventory.
    console.error('[Zillow] scrape error:', err.message);
    return [];
  }
}

function extractCity(address) {
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : 'Charlotte';
}

function parsePrice(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^0-9]/g, '')) || 0;
}

module.exports = { scrapeZillow };
