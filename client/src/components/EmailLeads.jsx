import { Mail, ExternalLink } from 'lucide-react';

const fmt = n => n ? `$${parseInt(n).toLocaleString()}` : null;

export default function EmailLeads({ leads }) {
  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
        <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 font-medium">No email leads yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Configure Gmail credentials in <code className="bg-gray-100 px-1 rounded">server/.env</code> to scan your inbox daily
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Mail className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-700">Gmail Leads ({leads.length})</h3>
      </div>
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {leads.map(lead => (
          <div key={lead.id} className="px-4 py-3 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{lead.subject}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.sender}</p>
                {lead.body_snippet && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{lead.body_snippet}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {lead.price && (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      {fmt(lead.price)}
                    </span>
                  )}
                  {lead.builder && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {lead.builder}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {lead.received_at ? new Date(lead.received_at).toLocaleDateString() : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
