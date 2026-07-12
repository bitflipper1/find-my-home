const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

function makeId(address) {
  return `opendoor_${crypto.createHash('md5').update(address).digest('hex').slice(0, 12)}`;
}

async function scrapeOpendoor() {
  try {
    // Opendoor has a public listings API
    const resp = await axios.get('https://www.opendoor.com/w/search', {
      params: {
        market: 'charlotte-nc',
        homeType: 'townhouse',
        minPrice: 200000,
        maxPrice: 1200000,
        page: 1,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 12000,
    });

    const listings = resp.data?.listings || resp.data?.homes || [];
    return listings.map(h => ({
      id: makeId(h.address?.street || h.id || String(Math.random())),
      source: 'opendoor',
      url: h.slug ? `https://www.opendoor.com/homes/${h.slug}` : null,
      address: [h.address?.street, h.address?.city, h.address?.state, h.address?.zip].filter(Boolean).join(', '),
      city: h.address?.city || 'Charlotte',
      state: h.address?.state || 'NC',
      zip: h.address?.zip || '',
      price: h.price || h.listPrice || 0,
      original_price: h.originalPrice || h.previousPrice || null,
      beds: h.bedrooms || h.beds || null,
      baths: h.bathrooms || h.baths || null,
      sqft: h.squareFeet || h.sqft || null,
      year_built: h.yearBuilt || null,
      type: 'Townhome',
      status: 'for_sale',
      builder: 'Opendoor',
      images: h.photos?.map(p => p.url || p) || (h.primaryPhoto ? [h.primaryPhoto] : []),
      latitude: h.location?.lat || h.lat,
      longitude: h.location?.lng || h.lng,
      days_on_market: h.daysOnMarket || 0,
      is_new_construction: 0,
      description: h.description || null,
    }));
  } catch (err) {
    // Return nothing on failure — only real inventory belongs in the DB.
    console.error('[Opendoor] scrape error:', err.message);
    return [];
  }
}

module.exports = { scrapeOpendoor };
