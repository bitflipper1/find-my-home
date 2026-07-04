import { useState, useMemo } from 'react';
import { Building2, ListOrdered, Database, ChevronRight } from 'lucide-react';
import Markdown from '../markdown';

const VIEWS = [
  { id: 'rankings', label: 'Rankings', icon: ListOrdered },
  { id: 'profiles', label: 'Builder Profiles', icon: Building2 },
  { id: 'sources', label: 'Source Index', icon: Database },
];

export default function BuilderProfilesTab({ data }) {
  const [view, setView] = useState('rankings');
  const [selectedSlug, setSelectedSlug] = useState(null);

  const profiles = data?.profiles || [];
  const selected = useMemo(
    () => profiles.find(p => p.slug === selectedSlug) || profiles[0],
    [profiles, selectedSlug]
  );

  if (!data || profiles.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Builder profiles not loaded yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        <strong>Charlotte Builder Knowledge Base</strong> — structured to match{' '}
        <a
          href="https://github.com/bitflipper1/Real-Estate-Knowledge/tree/8fbc132f201ec5bab37adf2d819b394ca09e7187/builders"
          target="_blank" rel="noopener noreferrer" className="underline"
        >
          bitflipper1/Real-Estate-Knowledge/builders
        </a>{' '}
        (Snapshot → Evidence-backed findings → Questions/risks → Sources, with a stable <code className="bg-blue-100 px-1 rounded">SRC-###</code> citation index).
        Every claim is dated, typed (fact / opinion aggregate / assumption), and traceable to a source — nothing is asserted from memory.
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              view === v.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
      </div>

      {view === 'rankings' && data.rankings && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <Markdown content={data.rankings} />
        </div>
      )}

      {view === 'sources' && data.source_index && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <Markdown content={data.source_index} />
        </div>
      )}

      {view === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-2 h-fit md:sticky md:top-20">
            {profiles.map(p => (
              <button
                key={p.slug}
                onClick={() => setSelectedSlug(p.slug)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg text-left transition ${
                  selected?.slug === p.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="truncate">{p.title}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
              </button>
            ))}
          </div>
          <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            {selected && <Markdown content={selected.content} />}
          </div>
        </div>
      )}
    </div>
  );
}
