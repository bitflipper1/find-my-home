import { useState } from 'react';
import { Phone, ExternalLink, MapPin, BedDouble, Bath, Ruler, TrendingDown, Star, Hammer, Calendar } from 'lucide-react';

const SOURCE_COLORS = {
  gmail: 'bg-rose-100 text-rose-700',
  zillow: 'bg-blue-100 text-blue-700',
  realtor: 'bg-red-100 text-red-700',
  opendoor: 'bg-orange-100 text-orange-700',
  newhomesource: 'bg-teal-100 text-teal-700',
  homes: 'bg-indigo-100 text-indigo-700',
  drhorton: 'bg-green-100 text-green-700',
  lennar: 'bg-sky-100 text-sky-700',
  ryanhomes: 'bg-violet-100 text-violet-700',
  meritage: 'bg-pink-100 text-pink-700',
  eastwood: 'bg-amber-100 text-amber-700',
  smithdouglas: 'bg-lime-100 text-lime-700',
  builders: 'bg-slate-100 text-slate-700',
};

const SOURCE_NAMES = {
  gmail: '📧 Your Inbox',
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
  builders: 'Builder',
};

const fmt = n => n ? `$${parseInt(n).toLocaleString()}` : 'N/A';
const isNew = dateStr => dateStr && (Date.now() - new Date(dateStr).getTime()) < 48 * 60 * 60 * 1000;

export default function ListingCard({ listing, onClick }) {
  const [imgErr, setImgErr] = useState(false);
  const img = !imgErr && listing.images?.length > 0 ? listing.images[0] : null;
  const hasCut = listing.original_price > 0 && listing.price < listing.original_price;
  const cutAmt = hasCut ? listing.original_price - listing.price : 0;
  const cutPct = hasCut ? ((cutAmt / listing.original_price) * 100).toFixed(1) : 0;
  const newlyAdded = isNew(listing.created_at);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
      onClick={() => onClick && onClick(listing)}
    >
      {/* Image */}
      <div className="relative h-44 rounded-t-xl overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={img}
            alt={listing.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-300">
              <Hammer className="w-10 h-10 mx-auto mb-1" />
              <p className="text-xs">New Construction</p>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {newlyAdded && (
            <span className="badge-new">
              <Star className="w-3 h-3" /> New
            </span>
          )}
          {hasCut && (
            <span className="badge-cut">
              <TrendingDown className="w-3 h-3" /> -{cutPct}%
            </span>
          )}
          {listing.is_model === 1 && (
            <span className="badge-model">Model</span>
          )}
        </div>

        {/* Source tag */}
        <div className="absolute top-2 right-2">
          <span className={`source-tag ${SOURCE_COLORS[listing.source] || 'bg-gray-100 text-gray-600'}`}>
            {SOURCE_NAMES[listing.source] || listing.source}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-bold text-gray-900">{fmt(listing.price)}</span>
          {hasCut && (
            <span className="text-sm line-through text-gray-400">{fmt(listing.original_price)}</span>
          )}
          {hasCut && (
            <span className="text-xs font-semibold text-red-600">-{fmt(cutAmt)}</span>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
          <span className="line-clamp-2 leading-tight">{listing.address}</span>
        </div>

        {/* Community / Builder */}
        {(listing.community || listing.builder) && (
          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-2">
            <Hammer className="w-3 h-3" />
            {[listing.community, listing.builder].filter(Boolean).join(' · ')}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {listing.beds && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" /> {listing.beds}bd
            </span>
          )}
          {listing.baths && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" /> {listing.baths}ba
            </span>
          )}
          {listing.sqft && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" /> {listing.sqft?.toLocaleString()} sqft
            </span>
          )}
          {listing.days_on_market !== null && listing.days_on_market !== undefined && (
            <span className="flex items-center gap-1 ml-auto">
              <Calendar className="w-3.5 h-3.5" /> {listing.days_on_market}d
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          )}
          {listing.url && (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View
            </a>
          )}
          {listing.latitude && listing.longitude && (
            <a
              href={`https://maps.google.com/?q=${listing.latitude},${listing.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-lg transition"
              title="Get directions"
            >
              <MapPin className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
