import { Search, SlidersHorizontal, X } from 'lucide-react';

const SOURCE_LABELS = {
  gmail: 'Your Gmail Inbox',
  zillow: 'Zillow',
  realtor: 'Realtor.com',
  opendoor: 'Opendoor',
  newhomesource: 'NewHomeSource',
  homes: 'Homes.com',
  drhorton: 'D.R. Horton',
  lennar: 'Lennar',
  ryanhomes: 'Ryan Homes',
  meritage: 'Meritage',
  eastwood: 'Eastwood',
  smithdouglas: 'Smith Douglas',
  builders: 'Builder Sites',
};

export default function FilterPanel({ filters, onChange, cities, builders }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });
  const clear = () => onChange({});

  const hasFilters = Object.values(filters).some(v => v !== '' && v !== undefined && v !== false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </div>
        {hasFilters && (
          <button onClick={clear} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search address, community, builder…"
            value={filters.search || ''}
            onChange={e => set('search', e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Price range */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Min $"
            value={filters.minPrice || ''}
            onChange={e => set('minPrice', e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Max $"
            value={filters.maxPrice || ''}
            onChange={e => set('maxPrice', e.target.value)}
            className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Beds */}
        <select
          value={filters.beds || ''}
          onChange={e => set('beds', e.target.value)}
          className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any beds</option>
          <option value="2">2+ beds</option>
          <option value="3">3+ beds</option>
          <option value="4">4+ beds</option>
        </select>

        {/* Source */}
        <select
          value={filters.source || ''}
          onChange={e => set('source', e.target.value)}
          className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {/* City */}
        <select
          value={filters.city || ''}
          onChange={e => set('city', e.target.value)}
          className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All cities</option>
          {(cities || []).map(c => (
            <option key={c.city} value={c.city}>{c.city} ({c.count})</option>
          ))}
        </select>

        {/* Builder */}
        <select
          value={filters.builder || ''}
          onChange={e => set('builder', e.target.value)}
          className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All builders</option>
          {(builders || []).map(b => b.builder && (
            <option key={b.builder} value={b.builder}>{b.builder} ({b.count})</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${filters.sort || 'updated_at'}:${filters.order || 'desc'}`}
          onChange={e => {
            const [sort, order] = e.target.value.split(':');
            onChange({ ...filters, sort, order });
          }}
          className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="updated_at:desc">Newest updated</option>
          <option value="created_at:desc">Newest listed</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
          <option value="price_cut_pct:desc">Biggest Price Cut</option>
          <option value="sqft:desc">Largest</option>
          <option value="days_on_market:asc">Freshest on Market</option>
        </select>

        {/* Toggles */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.priceCut}
            onChange={e => set('priceCut', e.target.checked)}
            className="w-4 h-4 rounded text-red-500 border-gray-300 focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">Price cuts only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.isModel}
            onChange={e => set('isModel', e.target.checked)}
            className="w-4 h-4 rounded text-purple-500 border-gray-300 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">Model homes</span>
        </label>
      </div>
    </div>
  );
}
