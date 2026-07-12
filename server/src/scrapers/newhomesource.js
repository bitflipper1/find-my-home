// NewHomeSource.com — the largest new-construction-only aggregator
// Owned by Zillow Group; covers Charlotte-area builder communities
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const CHARLOTTE_BUILDERS = [
  { builder: 'D.R. Horton', slug: 'dr-horton' },
  { builder: 'Lennar', slug: 'lennar' },
  { builder: 'Ryan Homes', slug: 'ryan-homes' },
  { builder: 'Pulte Homes', slug: 'pulte-homes' },
  { builder: 'Meritage Homes', slug: 'meritage-homes' },
  { builder: 'Smith Douglas Homes', slug: 'smith-douglas-homes' },
  { builder: 'Eastwood Homes', slug: 'eastwood-homes' },
  { builder: 'Taylor Morrison', slug: 'taylor-morrison' },
  { builder: 'Century Communities', slug: 'century-communities' },
  { builder: 'Toll Brothers', slug: 'toll-brothers' },
  { builder: 'M/I Homes', slug: 'mi-homes' },
  { builder: 'Beazer Homes', slug: 'beazer-homes' },
  { builder: 'Stanley Martin Homes', slug: 'stanley-martin-homes' },
  { builder: 'David Weekley Homes', slug: 'david-weekley-homes' },
];

function makeId(url) {
  return `nhs_${crypto.createHash('md5').update(url || String(Math.random())).digest('hex').slice(0, 12)}`;
}

async function scrapeNewHomeSource() {
  try {
    const url = 'https://www.newhomesource.com/homes/nc/mecklenburg-county/charlotte';
    const resp = await axios.get(url, {
      params: { PropertyType: 'Townhouse', priceMax: 1500000, priceMin: 200000 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(resp.data);
    const results = [];

    $('[data-testid="listing-card"], .listing-card, .home-card').each((_, el) => {
      const $el = $(el);
      const address = $el.find('[data-testid="address"], .address').text().trim();
      if (!address) return;

      const priceText = $el.find('[data-testid="price"], .price').text().trim();
      const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

      results.push({
        id: makeId(address),
        source: 'newhomesource',
        url: $el.find('a').attr('href') ? `https://www.newhomesource.com${$el.find('a').attr('href')}` : null,
        address,
        city: extractCity(address),
        state: 'NC',
        price,
        beds: parseInt($el.find('.beds, [data-testid="beds"]').text()) || null,
        baths: parseFloat($el.find('.baths, [data-testid="baths"]').text()) || null,
        sqft: parseInt($el.find('.sqft, [data-testid="sqft"]').text().replace(/[^0-9]/g, '')) || null,
        builder: $el.find('.builder-name, [data-testid="builder"]').text().trim() || null,
        community: $el.find('.community-name, [data-testid="community"]').text().trim() || null,
        images: [$el.find('img').first().attr('src')].filter(Boolean),
        type: 'Townhome',
        status: 'for_sale',
        is_new_construction: 1,
      });
    });

    // An empty result set means the page structure changed or a bot wall was
    // served — report reality instead of inventing listings.
    return results;
  } catch (err) {
    console.error('[NewHomeSource] scrape error:', err.message);
    return [];
  }
}

function extractCity(address) {
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim().replace(/\s+[A-Z]{2}$/, '') : 'Charlotte';
}

module.exports = { scrapeNewHomeSource, CHARLOTTE_BUILDERS };
