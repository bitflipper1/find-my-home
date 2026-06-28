import { useState } from 'react';
import { Star, Trash2, Save } from 'lucide-react';
import { STATUSES } from '../track';

// Inline editor for tracking a place. Works for both an existing listing
// (pass `listing`) and an existing tracked row (pass `tracked`).
export default function TrackEditor({ listing, tracked, onSave, onRemove, compact }) {
  const init = tracked || {};
  const [status, setStatus] = useState(init.status || 'considering');
  const [rating, setRating] = useState(init.rating || 0);
  const [notes, setNotes] = useState(init.notes || '');
  const [visitDate, setVisitDate] = useState(init.visit_date || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload = {
      status,
      rating: rating || null,
      notes: notes.trim() || null,
      visit_date: visitDate || null,
    };
    if (tracked?.id) payload.id = tracked.id;
    if (listing?.id) payload.listing_id = listing.id;
    // Carry a snapshot for manual/standalone tracking
    const src = listing || tracked;
    if (src) {
      Object.assign(payload, {
        address: src.address, city: src.city, state: src.state, zip: src.zip,
        price: src.price, beds: src.beds, baths: src.baths, sqft: src.sqft,
        builder: src.builder, community: src.community, phone: src.phone, url: src.url,
      });
    }
    await onSave(payload);
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      {/* Status pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                status === s.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Your rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n === rating ? 0 : n)} type="button">
              <Star
                className={`w-5 h-5 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
              />
            </button>
          ))}
          {rating > 0 && (
            <button onClick={() => setRating(0)} className="ml-1 text-xs text-gray-400 hover:text-gray-600">clear</button>
          )}
        </div>
      </div>

      {/* Visit date */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          Visit date {status === 'scheduled' ? '(planned)' : status === 'visited' ? '(when you went)' : ''}
        </label>
        <input
          type="date"
          value={visitDate}
          onChange={e => setVisitDate(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={compact ? 2 : 3}
          placeholder="Who you spoke with, lot number, incentives offered, impressions…"
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : tracked?.id ? 'Update' : 'Save to My Tours'}
        </button>
        {tracked?.id && onRemove && (
          <button
            onClick={() => onRemove(tracked.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
