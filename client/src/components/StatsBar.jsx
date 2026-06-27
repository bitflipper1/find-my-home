import { Home, TrendingDown, Star, DollarSign, RefreshCw } from 'lucide-react';

const fmt = n => n ? `$${(n / 1000).toFixed(0)}K` : 'N/A';
const fmtFull = n => n ? `$${n.toLocaleString()}` : 'N/A';

export default function StatsBar({ stats, onRefresh, refreshing }) {
  if (!stats) return null;

  const cards = [
    {
      label: 'Total Listings',
      value: stats.total ?? 0,
      sub: 'active townhomes',
      icon: Home,
      color: 'blue',
    },
    {
      label: 'Price Cuts',
      value: stats.price_cuts ?? 0,
      sub: 'with reductions',
      icon: TrendingDown,
      color: 'red',
    },
    {
      label: 'New Today',
      value: stats.new_today ?? 0,
      sub: 'added in last 24h',
      icon: Star,
      color: 'green',
    },
    {
      label: 'Avg Price',
      value: stats.avg_price ? fmtFull(Math.round(stats.avg_price)) : 'N/A',
      sub: stats.price_range ? `${fmt(stats.price_range.min_price)} – ${fmt(stats.price_range.max_price)}` : '',
      icon: DollarSign,
      color: 'purple',
    },
  ];

  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const iconColor = {
    blue: 'text-blue-500', red: 'text-red-500', green: 'text-green-500', purple: 'text-purple-500',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map(card => (
        <div key={card.label} className={`rounded-xl border p-4 ${colorMap[card.color]}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
              {card.sub && <p className="text-xs opacity-60 mt-0.5">{card.sub}</p>}
            </div>
            <card.icon className={`w-5 h-5 mt-1 ${iconColor[card.color]}`} />
          </div>
        </div>
      ))}

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="col-span-2 lg:col-span-4 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing data…' : 'Refresh All Sources Now'}
      </button>
    </div>
  );
}
