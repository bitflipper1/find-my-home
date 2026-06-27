import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const SOURCE_LABELS = {
  zillow: 'Zillow', realtor: 'Realtor.com', opendoor: 'Opendoor',
  newhomesource: 'NewHomeSource', homes: 'Homes.com', builders: 'Builder Sites',
};

export default function ActivityLog({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No scrape activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Scrape Activity</h3>
      </div>
      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {logs.slice(0, 20).map(log => (
          <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
            {log.status === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              : <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            }
            <span className="font-medium text-gray-700 w-28 shrink-0">
              {SOURCE_LABELS[log.source] || log.source}
            </span>
            {log.status === 'success' ? (
              <span className="text-gray-500 text-xs">
                {log.listings_found} found · {log.listings_new} new · {log.listings_updated} updated
              </span>
            ) : (
              <span className="text-red-500 text-xs truncate">{log.error}</span>
            )}
            <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
              {new Date(log.ran_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
