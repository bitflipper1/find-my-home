import { useState, useEffect, useCallback } from 'react';
import { Home, LayoutGrid, List, MapPin, Mail, Activity, Info, ClipboardList, Target, BookOpen, Building2, Lock } from 'lucide-react';
import InvestTab from './components/InvestTab';
import ResearchTab from './components/ResearchTab';
import DealRoom from './components/DealRoom';
import BuilderProfilesTab from './components/BuilderProfilesTab';
import StatsBar from './components/StatsBar';
import FilterPanel from './components/FilterPanel';
import ListingCard from './components/ListingCard';
import ListingModal from './components/ListingModal';
import SourceBreakdown from './components/SourceBreakdown';
import EmailLeads from './components/EmailLeads';
import ActivityLog from './components/ActivityLog';
import MyTours from './components/MyTours';
import {
  fetchListings, fetchStats, triggerRefresh, fetchLogs, fetchBuilders, fetchCities, fetchEmailLeads,
  fetchTracked, saveTracked, deleteTracked, fetchMarket, fetchResearch, fetchBuilderProfiles,
} from './api';

const TABS = [
  { id: 'listings', label: 'Listings', icon: LayoutGrid },
  { id: 'invest', label: 'Invest', icon: Target },
  { id: 'research', label: 'Research', icon: BookOpen },
  { id: 'dealroom', label: 'Deal Room', icon: Lock },
  { id: 'builders', label: 'Builder KB', icon: Building2 },
  { id: 'tours', label: 'My Tours', icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'email', label: 'Email Leads', icon: Mail },
  { id: 'log', label: 'Activity Log', icon: Info },
];

export default function App() {
  const [tab, setTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [builders, setBuilders] = useState([]);
  const [cities, setCities] = useState([]);
  const [emailLeads, setEmailLeads] = useState([]);
  const [tracked, setTracked] = useState([]);
  const [trackedIds, setTrackedIds] = useState([]);
  const [trackedStats, setTrackedStats] = useState(null);
  const [market, setMarket] = useState(null);
  const [allListings, setAllListings] = useState([]);
  const [research, setResearch] = useState(null);
  const [builderProfiles, setBuilderProfiles] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [error, setError] = useState(null);

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchListings(filters);
      setListings(data.listings || []);
      setError(null);
    } catch (err) {
      setError('Could not connect to server. Make sure the server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMeta = useCallback(async () => {
    try {
      const [s, b, c, e, l] = await Promise.allSettled([
        fetchStats(), fetchBuilders(), fetchCities(), fetchEmailLeads(), fetchLogs(),
      ]);
      if (s.status === 'fulfilled') setStats(s.value);
      if (b.status === 'fulfilled') setBuilders(b.value);
      if (c.status === 'fulfilled') setCities(c.value);
      if (e.status === 'fulfilled') setEmailLeads(e.value.leads || []);
      if (l.status === 'fulfilled') setLogs(l.value);
    } catch {}
  }, []);

  const loadInvest = useCallback(async () => {
    try {
      const [m, all, r, bp] = await Promise.allSettled([
        fetchMarket(), fetchListings({ limit: 1000 }), fetchResearch(), fetchBuilderProfiles(),
      ]);
      if (m.status === 'fulfilled') setMarket(m.value);
      if (all.status === 'fulfilled') setAllListings(all.value.listings || []);
      if (r.status === 'fulfilled') setResearch(r.value);
      if (bp.status === 'fulfilled') setBuilderProfiles(bp.value);
    } catch {}
  }, []);

  const loadTracked = useCallback(async () => {
    try {
      const data = await fetchTracked();
      setTracked(data.tracked || []);
      setTrackedIds(data.ids || []);
      setTrackedStats(data.stats || null);
    } catch {}
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);
  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadTracked(); }, [loadTracked]);
  useEffect(() => { loadInvest(); }, [loadInvest]);

  // Save/update a tracked place, then refresh the board
  const handleSaveTrack = useCallback(async (payload) => {
    await saveTracked(payload);
    await loadTracked();
  }, [loadTracked]);

  // Quick heart-toggle from a card: add as "considering", or remove if already tracked
  const handleQuickTrack = useCallback(async (listing) => {
    const existing = tracked.find(t => t.listing_id === listing.id);
    if (existing) {
      await deleteTracked(existing.id);
    } else {
      await saveTracked({ listing_id: listing.id, status: 'considering' });
    }
    await loadTracked();
  }, [tracked, loadTracked]);

  const handleRemoveTrack = useCallback(async (id) => {
    await deleteTracked(id);
    await loadTracked();
  }, [loadTracked]);

  // Poll for status if refreshing
  useEffect(() => {
    if (!refreshing) return;
    const interval = setInterval(async () => {
      await loadListings();
      await loadMeta();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshing, loadListings, loadMeta]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await triggerRefresh();
      setTimeout(async () => {
        await loadListings();
        await loadMeta();
        setRefreshing(false);
      }, 8000);
    } catch {
      setRefreshing(false);
    }
  }

  const priceCutListings = listings.filter(l => l.original_price > 0 && l.price < l.original_price);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">
              C
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">Charlotte Townhome Finder</h1>
              <p className="text-xs text-gray-500 mt-0.5">New construction · Greater Charlotte area</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.id === 'email' && emailLeads.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {emailLeads.length > 9 ? '9+' : emailLeads.length}
                  </span>
                )}
                {t.id === 'tours' && tracked.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
                    {tracked.length > 9 ? '9+' : tracked.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`p-2 rounded-lg ${tab === t.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}
              >
                <t.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Connection error:</strong> {error}
          </div>
        )}

        <StatsBar stats={stats} onRefresh={handleRefresh} refreshing={refreshing} />

        {tab === 'listings' && (
          <>
            {/* Price cut highlight bar */}
            {priceCutListings.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-700">
                  {priceCutListings.length} listing{priceCutListings.length !== 1 ? 's' : ''} with price cuts today!
                </span>
                <button
                  onClick={() => setFilters(f => ({ ...f, priceCut: true }))}
                  className="ml-auto text-xs font-medium text-red-600 hover:text-red-800 underline"
                >
                  Show only price cuts
                </button>
              </div>
            )}

            <FilterPanel
              filters={filters}
              onChange={setFilters}
              cities={cities}
              builders={builders}
            />

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {loading ? 'Loading…' : (
                  <>
                    <strong className="text-gray-900">{listings.length}</strong> townhomes found
                    {filters.priceCut ? ' · price cuts only' : ''}
                    {filters.city ? ` · ${filters.city}` : ''}
                  </>
                )}
              </p>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5 bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Listings grid */}
            {loading ? (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 h-72 animate-pulse">
                    <div className="h-44 bg-gray-100 rounded-t-xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <Home className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No listings found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or refreshing data</p>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-3'
              }>
                {listings.map(l => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    onClick={setSelected}
                    isTracked={trackedIds.includes(l.id)}
                    onTrack={handleQuickTrack}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'invest' && (
          <InvestTab listings={allListings} market={market} onOpen={setSelected} />
        )}

        {tab === 'dealroom' && (
          <DealRoom market={market} research={research} />
        )}

        {tab === 'research' && (
          <ResearchTab research={research} />
        )}

        {tab === 'builders' && (
          <BuilderProfilesTab data={builderProfiles} />
        )}

        {tab === 'tours' && (
          <MyTours
            tracked={tracked}
            stats={trackedStats}
            onSave={handleSaveTrack}
            onRemove={handleRemoveTrack}
          />
        )}

        {tab === 'analytics' && (
          <SourceBreakdown bySource={stats?.by_source} byBuilder={stats?.by_builder} />
        )}

        {tab === 'email' && (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800">
              <strong>📧 Gmail connector is live.</strong> A scheduled daily scan reads your inbox (mattmcg@bitfliptech.com) for
              Zillow/Redfin price-cut alerts, builder emails (Ryan Homes, David Weekley), and open houses — then feeds them
              straight into your listings and the leads below. No credentials or setup needed; it runs on its own.
            </div>
            <EmailLeads leads={emailLeads} />
          </div>
        )}

        {tab === 'log' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 p-4">
              Data sources checked: <strong>Zillow · Realtor.com · Opendoor · NewHomeSource · Homes.com · D.R. Horton · Lennar · Ryan Homes · Meritage · Eastwood · Smith Douglas</strong>
              <br />
              Schedule: Daily at <strong>7:00 AM</strong> and <strong>12:00 PM</strong> Eastern
            </div>
            <ActivityLog logs={logs} />
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selected && (
        <ListingModal
          listing={selected}
          onClose={() => setSelected(null)}
          trackedRecord={tracked.find(t => t.listing_id === selected.id) || null}
          onSaveTrack={handleSaveTrack}
          onRemoveTrack={handleRemoveTrack}
        />
      )}
    </div>
  );
}
