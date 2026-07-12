// Homes.com scraper — new construction townhomes in Charlotte area
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

function makeId(url) {
  return `homes_${crypto.createHash('md5').update(url || String(Math.random())).digest('hex').slice(0, 12)}`;
}

async function scrapeHomes() {
  try {
    const resp = await axios.get('https://www.homes.com/new-construction/nc/charlotte/', {
      params: { type: 'townhome', price_min: 200000, price_max: 1500000 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 12000,
    });

    const $ = cheerio.load(resp.data);
    const results = [];

    $('[data-testid="listing-card"], .listing-card, article.property-card').each((_, el) => {
      const $el = $(el);
      const link = $el.find('a').first().attr('href') || '';
      const address = $el.find('.address, [data-testid="address"]').text().trim();
      if (!address) return;

      const priceText = $el.find('.price, [data-testid="price"]').text().trim();
      const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

      results.push({
        id: makeId(link || address),
        source: 'homes',
        url: link.startsWith('http') ? link : `https://www.homes.com${link}`,
        address,
        city: extractCity(address),
        state: 'NC',
        price,
        beds: parseInt($el.find('.beds').text()) || null,
        baths: parseFloat($el.find('.baths').text()) || null,
        sqft: parseInt($el.find('.sqft').text().replace(/[^0-9]/g, '')) || null,
        builder: $el.find('.builder, .agent-name').text().trim() || null,
        images: [$el.find('img').first().attr('src')].filter(Boolean),
        type: 'Townhome',
        status: 'for_sale',
        is_new_construction: 1,
      });
    });

    // An empty result set usually means Homes.com changed their markup or
    // served a bot wall — report reality instead of inventing listings.
    return results;
  } catch (err) {
    console.error('[Homes] scrape error:', err.message);
    return [];
  }
}

function extractCity(address) {
  const match = address.match(/,\s*([^,]+),\s*[A-Z]{2}/);
  return match ? match[1].trim() : 'Charlotte';
}

module.exports = { scrapeHomes };
