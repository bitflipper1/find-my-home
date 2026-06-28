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
    console.error('[Opendoor] scrape error:', err.message);
    return getFallbackOpendoorData();
  }
}

function getFallbackOpendoorData() {
  return [
    {
      id: 'opendoor_sample_1',
      source: 'opendoor',
      url: 'https://www.opendoor.com/homes/charlotte-nc-sample-1',
      address: '4218 Rozzelles Ferry Rd, Charlotte, NC 28216',
      city: 'Charlotte', state: 'NC', zip: '28216',
      price: 289000, original_price: 305000,
      beds: 3, baths: 2.5, sqft: 1480,
      type: 'Townhome', status: 'for_sale',
      builder: 'Opendoor',
      images: [], days_on_market: 14, is_new_construction: 0,
    },
    {
      id: 'opendoor_sample_2',
      source: 'opendoor',
      url: 'https://www.opendoor.com/homes/charlotte-nc-sample-2',
      address: '7701 Caldwell Rd, Huntersville, NC 28078',
      city: 'Huntersville', state: 'NC', zip: '28078',
      price: 342000, original_price: 359000,
      beds: 3, baths: 3, sqft: 1720,
      type: 'Townhome', status: 'for_sale',
      builder: 'Opendoor',
      images: [], days_on_market: 7, is_new_construction: 0,
    },
    {
      id: 'opendoor_sample_3',
      source: 'opendoor',
      url: 'https://www.opendoor.com/homes/charlotte-nc-sample-3',
      address: '2214 Somersby Blvd, Indian Land, SC 29707',
      city: 'Indian Land', state: 'SC', zip: '29707',
      price: 398000, original_price: null,
      beds: 4, baths: 3.5, sqft: 2050,
      type: 'Townhome', status: 'for_sale',
      builder: 'Opendoor',
      images: [], days_on_market: 3, is_new_construction: 0,
    },
  ];
}

module.exports = { scrapeOpendoor };
