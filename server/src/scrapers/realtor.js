const axios = require('axios');
const crypto = require('crypto');

function makeId(zpid) {
  return `realtor_${crypto.createHash('md5').update(String(zpid)).digest('hex').slice(0, 12)}`;
}

async function scrapeRealtor() {
  // Realtor.com public search API
  const url = 'https://www.realtor.com/api/v1/hulk_main_srp/search';
  const payload = {
    query: {
      type: ['townhome'],
      new_construction: true,
      list_price: { min: 200000, max: 1500000 },
      location: {
        address: { city: 'Charlotte', state_code: 'NC', postal_code: '' },
        circle: { lat: 35.2271, lon: -80.8431, radius: '50mi' },
      },
    },
    client_data: { device_data: { device_type: 'web' } },
    limit: 50,
    offset: 0,
    sort: { direction: 'desc', field: 'list_date' },
  };

  try {
    const resp = await axios.post(url, payload, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://www.realtor.com',
        'Referer': 'https://www.realtor.com/realestateandhomes-search/Charlotte_NC/type-townhome/new-construction',
      },
      timeout: 15000,
    });

    const listings = resp.data?.data?.home_search?.results || [];
    return listings.map(r => {
      const loc = r.location?.address || {};
      const desc = r.description || {};
      const price = r.list_price;
      const origPrice = r.list_price_max || null;

      return {
        id: makeId(r.property_id || r.listing_id || Math.random()),
        source: 'realtor',
        url: r.href ? `https://www.realtor.com${r.href}` : null,
        address: [loc.line, loc.city, loc.state_code, loc.postal_code].filter(Boolean).join(', '),
        city: loc.city || 'Charlotte',
        state: loc.state_code || 'NC',
        zip: loc.postal_code || '',
        neighborhood: loc.neighborhood_name || '',
        price,
        original_price: origPrice !== price ? origPrice : null,
        beds: desc.beds || null,
        baths: desc.baths_combined || desc.baths || null,
        sqft: desc.sqft || null,
        lot_size: desc.lot_sqft ? `${desc.lot_sqft} sqft` : null,
        year_built: desc.year_built || null,
        type: 'Townhome',
        status: r.status || 'for_sale',
        builder: r.branding?.[0]?.name || r.advertisers?.[0]?.name || null,
        community: r.community?.name || null,
        images: (r.primary_photo ? [r.primary_photo.href] : []).concat(
          (r.photos || []).slice(0, 4).map(p => p.href)
        ),
        latitude: r.location?.address?.coordinate?.lat,
        longitude: r.location?.address?.coordinate?.lon,
        phone: r.advertisers?.[0]?.office?.phones?.[0]?.number || null,
        days_on_market: r.list_date
          ? Math.floor((Date.now() - new Date(r.list_date).getTime()) / 86400000)
          : null,
        is_new_construction: 1,
        description: desc.text || null,
      };
    });
  } catch (err) {
    // Realtor.com's internal API moved/blocks bots (404). Return nothing
    // rather than synthetic listings — only real inventory belongs in the DB.
    console.error('[Realtor] scrape error:', err.message);
    return [];
  }
}

module.exports = { scrapeRealtor };
