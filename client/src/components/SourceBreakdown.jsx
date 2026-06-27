import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f97316', '#14b8a6', '#6366f1', '#ec4899', '#22c55e', '#a855f7', '#f59e0b', '#64748b'];

const SOURCE_LABELS = {
  gmail: 'Your Inbox',
  zillow: 'Zillow', realtor: 'Realtor.com', opendoor: 'Opendoor',
  newhomesource: 'NewHomeSource', homes: 'Homes.com', drhorton: 'D.R. Horton',
  lennar: 'Lennar', ryanhomes: 'Ryan Homes', meritage: 'Meritage',
  eastwood: 'Eastwood', smithdouglas: 'Smith Douglas', builders: 'Builders',
};

export default function SourceBreakdown({ bySource, byBuilder }) {
  const sourceData = (bySource || []).map(s => ({
    name: SOURCE_LABELS[s.source] || s.source,
    count: s.count,
  }));

  const builderData = (byBuilder || []).filter(b => b.builder).slice(0, 8).map(b => ({
    name: b.builder.replace('Homes', '').replace(' Communities', '').trim(),
    count: b.count,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Listings by Source</h3>
        {sourceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sourceData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Builders in Charlotte</h3>
        {builderData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={builderData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={85} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {builderData.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
        )}
      </div>
    </div>
  );
}
