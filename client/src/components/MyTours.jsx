import { useState } from 'react';
import { MapPin, Phone, ExternalLink, Star, Pencil, Plus, X, Calendar, BedDouble, Bath, Ruler, Hammer } from 'lucide-react';
import { STATUSES, STATUS_MAP, STATUS_CLASSES } from '../track';
import TrackEditor from './TrackEditor';

const fmt = n => n ? `$${parseInt(n).toLocaleString()}` : 'Price TBD';

function TrackedCard({ place, onEdit }) {
  const st = STATUS_MAP[place.status] || STATUSES[0];
  const hasCut = place.original_price > 0 && place.price < place.original_price;
  const inactive = place.listing_id && place.listing_active === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base font-bold text-gray-900">{fmt(place.price)}</span>
            {hasCut && (
              <span className="text-xs font-semibold text-red-600">
                ↓ {fmt(place.original_price - place.price)}
              </span>
            )}
            {inactive && (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">off market</span>
            )}
          </div>
          <div className="flex items-start gap-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
            <span className="line-clamp-2">{place.address}</span>
          </div>
        </div>
        <button onClick={() => onEdit(place)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 shrink-0">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {(place.community || place.builder) && (
        <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1.5">
          <Hammer className="w-3 h-3" />
          {[place.community, place.builder].filter(Boolean).join(' · ')}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
        {place.beds != null && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{place.beds}</span>}
        {place.baths != null && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{place.baths}</span>}
        {place.sqft != null && <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3" />{place.sqft?.toLocaleString()}</span>}
      </div>

      {place.rating > 0 && (
        <div className="flex items-center gap-0.5 mt-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className={`w-3.5 h-3.5 ${n <= place.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
          ))}
        </div>
      )}

      {place.visit_date && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
          <Calendar className="w-3 h-3 text-gray-400" />
          {st.id === 'scheduled' ? 'Visiting' : 'Visited'} {new Date(place.visit_date + 'T00:00:00').toLocaleDateString()}
        </div>
      )}

      {place.notes && (
        <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-lg p-2 line-clamp-3">{place.notes}</p>
      )}

      <div className="flex gap-1.5 mt-2.5">
        {place.phone && (
          <a href={`tel:${place.phone}`} onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
            <Phone className="w-3 h-3" /> Call
          </a>
        )}
        {place.url && (
          <a href={place.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg">
            <ExternalLink className="w-3 h-3" /> View
          </a>
        )}
        {place.address && (
          <a href={`https://maps.google.com/?q=${encodeURIComponent(place.address)}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1.5 text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-lg" title="Directions">
            <MapPin className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function ManualAddForm({ onSave, onClose }) {
  const [form, setForm] = useState({ address: '', city: '', price: '', beds: '', baths: '', sqft: '', builder: '', community: '', phone: '', url: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.address.trim()) return;
    onSave({
      address: form.address.trim(),
      city: form.city.trim() || null,
      price: form.price ? parseInt(form.price) : null,
      beds: form.beds ? parseInt(form.beds) : null,
      baths: form.baths ? parseFloat(form.baths) : null,
      sqft: form.sqft ? parseInt(form.sqft) : null,
      builder: form.builder.trim() || null,
      community: form.community.trim() || null,
      phone: form.phone.trim() || null,
      url: form.url.trim() || null,
      status: 'considering',
    });
  }

  const field = (key, ph, type = 'text', span = '') => (
    <input
      type={type} placeholder={ph} value={form[key]}
      onChange={e => set(key, e.target.value)}
      className={`px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${span}`}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Add a place manually</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-3">For a community or model you found on your own (a yard sign, a friend's tip) that isn't in the feed yet.</p>
        <div className="grid grid-cols-2 gap-2">
          {field('address', 'Address or community *', 'text', 'col-span-2')}
          {field('city', 'City')}
          {field('price', 'Price', 'number')}
          {field('beds', 'Beds', 'number')}
          {field('baths', 'Baths', 'number')}
          {field('sqft', 'Sq ft', 'number')}
          {field('builder', 'Builder')}
          {field('community', 'Community')}
          {field('phone', 'Sales phone')}
          {field('url', 'Listing URL', 'text', 'col-span-2')}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={submit} disabled={!form.address.trim()}
            className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
            Add to My Tours
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function MyTours({ tracked, stats, onSave, onRemove }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const grouped = STATUSES.map(s => ({ ...s, items: tracked.filter(t => t.status === s.id) }));

  async function handleSave(payload) {
    await onSave(payload);
    setEditing(null);
    setAdding(false);
  }

  if (tracked.length === 0 && !adding) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-700 font-semibold">No saved places yet</p>
        <p className="text-sm text-gray-400 mt-1 mb-4">
          Hit the heart on any listing to start your tour list, or add a place you found on your own.
        </p>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
          <Plus className="w-4 h-4" /> Add a place manually
        </button>
        {adding && <ManualAddForm onSave={handleSave} onClose={() => setAdding(false)} />}
      </div>
    );
  }

  return (
    <div>
      {/* Summary + add */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <span className="font-semibold text-gray-900">{stats?.total || tracked.length} places tracked</span>
          {STATUSES.map(s => {
            const c = stats?.by_status?.[s.id] || 0;
            if (!c) return null;
            const cls = STATUS_CLASSES[s.color];
            return (
              <span key={s.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls.chip}`}>
                {s.emoji} {c} {s.label}
              </span>
            );
          })}
        </div>
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg">
          <Plus className="w-4 h-4" /> Add manually
        </button>
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {grouped.map(col => {
          const cls = STATUS_CLASSES[col.color];
          return (
            <div key={col.id} className={`bg-gray-50 rounded-xl border-t-4 ${cls.col} border border-gray-100 p-2.5`}>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-sm font-semibold text-gray-700">{col.emoji} {col.label}</span>
                <span className="text-xs font-medium text-gray-400 bg-white rounded-full px-2 py-0.5">{col.items.length}</span>
              </div>
              <div className="space-y-2.5">
                {col.items.map(place => (
                  <TrackedCard key={place.id} place={place} onEdit={setEditing} />
                ))}
                {col.items.length === 0 && (
                  <p className="text-xs text-gray-300 text-center py-4">Nothing here yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 pr-3">
                <h3 className="text-base font-bold text-gray-900 leading-tight">{editing.address}</h3>
                <p className="text-sm text-gray-500">{fmt(editing.price)}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <TrackEditor tracked={editing} onSave={handleSave} onRemove={onRemove} compact />
          </div>
        </div>
      )}

      {adding && <ManualAddForm onSave={handleSave} onClose={() => setAdding(false)} />}
    </div>
  );
}
