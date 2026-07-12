// Direct builder website scrapers for Charlotte-area top builders
const axios = require('axios');
const crypto = require('crypto');

function makeId(source, key) {
  return `builder_${source}_${crypto.createHash('md5').update(String(key)).digest('hex').slice(0, 10)}`;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

// --- D.R. Horton ---
async function scrapeDRHorton() {
  try {
    const resp = await axios.get('https://www.drhorton.com/api/homes/search', {
      params: {
        state: 'north-carolina', city: 'charlotte',
        homeType: 'townhome', sortBy: 'price',
      },
      headers: HEADERS, timeout: 12000,
    });
    const homes = resp.data?.homes || resp.data?.results || [];
    return homes.map(h => ({
      id: makeId('drhorton', h.id || h.planId || h.address),
      source: 'drhorton',
      url: h.url || h.detailUrl ? `https://www.drhorton.com${h.url || h.detailUrl}` : null,
      address: h.address || `${h.streetAddress}, ${h.city}, ${h.state} ${h.zip}`,
      city: h.city || 'Charlotte',
      state: h.state || 'NC',
      zip: h.zip || h.zipCode || '',
      price: h.price || h.basePrice || 0,
      original_price: h.originalPrice || h.wasPrice || null,
      beds: h.beds || h.bedrooms || null,
      baths: h.baths || h.bathrooms || null,
      sqft: h.sqft || h.squareFeet || null,
      builder: 'D.R. Horton',
      community: h.communityName || h.subdivision || null,
      images: h.photos?.map(p => p.url || p) || (h.imageUrl ? [h.imageUrl] : []),
      phone: h.phone || h.salesPhone || null,
      type: 'Townhome',
      status: h.status || 'for_sale',
      is_new_construction: 1,
      move_in_date: h.moveInDate || h.estimatedCompletion || null,
    }));
  } catch (err) {
    // Builder APIs shift or block bots — log it and return nothing rather
    // than synthetic listings. Only real inventory belongs in the DB.
    console.error('[D.R. Horton] scrape error:', err.message);
    return [];
  }
}


// --- Lennar ---
async function scrapeLennar() {
  try {
    const resp = await axios.post('https://www.lennar.com/api/communities/search', {
      location: 'Charlotte, NC', radius: 50, homeType: ['Townhome'],
      priceMin: 200000, priceMax: 1200000, page: 1, pageSize: 30,
    }, { headers: HEADERS, timeout: 12000 });

    const items = resp.data?.communities || resp.data?.homes || [];
    return items.map(c => ({
      id: makeId('lennar', c.id || c.communityId),
      source: 'lennar',
      url: c.url ? `https://www.lennar.com${c.url}` : null,
      address: c.address || `${c.city}, ${c.state}`,
      city: c.city || 'Charlotte',
      state: c.state || 'NC',
      zip: c.zip || '',
      price: c.fromPrice || c.price || 0,
      original_price: c.originalFromPrice || null,
      beds: c.bedsMin || c.beds || null,
      baths: c.bathsMin || c.baths || null,
      sqft: c.sqftMin || c.sqft || null,
      builder: 'Lennar',
      community: c.name || c.communityName || null,
      images: c.photos?.map(p => p.url) || [],
      phone: c.phone || c.salesPhone || null,
      type: 'Townhome',
      status: 'for_sale',
      is_new_construction: 1,
    }));
  } catch (err) {
    // Builder APIs shift or block bots — log it and return nothing rather
    // than synthetic listings. Only real inventory belongs in the DB.
    console.error('[Lennar] scrape error:', err.message);
    return [];
  }
}


// --- Ryan Homes ---
async function scrapeRyanHomes() {
  try {
    const resp = await axios.get('https://www.ryanhomes.com/api/communities', {
      params: { state: 'NC', city: 'Charlotte', homeType: 'townhome' },
      headers: HEADERS, timeout: 12000,
    });
    const items = resp.data?.communities || [];
    return items.map(c => ({
      id: makeId('ryanhomes', c.id),
      source: 'ryanhomes',
      url: c.url ? `https://www.ryanhomes.com${c.url}` : null,
      address: `${c.city}, ${c.state} ${c.zip}`,
      city: c.city || 'Charlotte',
      state: c.state || 'NC',
      zip: c.zip || '',
      price: c.fromPrice || 0,
      builder: 'Ryan Homes',
      community: c.name || null,
      phone: c.salesPhone || null,
      type: 'Townhome', status: 'for_sale', is_new_construction: 1, images: [],
    }));
  } catch (err) {
    // Builder APIs shift or block bots — log it and return nothing rather
    // than synthetic listings. Only real inventory belongs in the DB.
    console.error('[Ryan Homes] scrape error:', err.message);
    return [];
  }
}


// --- Meritage Homes ---
async function scrapeMeritage() {
  try {
    const resp = await axios.get('https://www.meritagehomes.com/api/communities/search', {
      params: { state: 'NC', region: 'charlotte', type: 'townhome' },
      headers: HEADERS, timeout: 12000,
    });
    return (resp.data?.communities || []).map(c => ({
      id: makeId('meritage', c.id),
      source: 'meritage',
      url: c.communityUrl || null,
      address: `${c.city}, NC`,
      city: c.city, state: 'NC', zip: c.zip || '',
      price: c.startingPrice || 0,
      builder: 'Meritage Homes', community: c.name,
      phone: c.salesPhone || null,
      type: 'Townhome', status: 'for_sale', is_new_construction: 1, images: [],
    }));
  } catch (err) {
    // Builder APIs shift or block bots — log it and return nothing rather
    // than synthetic listings. Only real inventory belongs in the DB.
    console.error('[Meritage] scrape error:', err.message);
    return [];
  }
}


// --- Eastwood Homes (Charlotte-based) ---
async function scrapeEastwoodHomes() {
  try {
    const resp = await axios.get('https://www.eastwoodhomes.com/api/homes', {
      params: { city: 'charlotte', type: 'townhome' },
      headers: HEADERS, timeout: 12000,
    });
    return (resp.data?.homes || []).map(h => ({
      id: makeId('eastwood', h.id || h.address),
      source: 'eastwood',
      url: h.url || null,
      address: h.address || '', city: h.city || 'Charlotte', state: 'NC', zip: h.zip || '',
      price: h.price || 0, builder: 'Eastwood Homes', community: h.community,
      phone: '(704) 376-9700', type: 'Townhome', status: 'for_sale', is_new_construction: 1, images: [],
    }));
  } catch (err) {
    // Builder APIs shift or block bots — log it and return nothing rather
    // than synthetic listings. Only real inventory belongs in the DB.
    console.error('[Eastwood] scrape error:', err.message);
    return [];
  }
}


async function scrapeAllBuilders() {
  const [drHorton, lennar, ryanHomes, meritage, eastwood] = await Promise.allSettled([
    scrapeDRHorton(), scrapeLennar(), scrapeRyanHomes(), scrapeMeritage(), scrapeEastwoodHomes(),
  ]);

  return [
    ...(drHorton.status === 'fulfilled' ? drHorton.value : []),
    ...(lennar.status === 'fulfilled' ? lennar.value : []),
    ...(ryanHomes.status === 'fulfilled' ? ryanHomes.value : []),
    ...(meritage.status === 'fulfilled' ? meritage.value : []),
    ...(eastwood.status === 'fulfilled' ? eastwood.value : []),
  ];
}

module.exports = { scrapeAllBuilders };
