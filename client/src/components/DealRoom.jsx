import { Lock, ShieldAlert } from 'lucide-react';

export default function DealRoom() {
  return (
    <div className="max-w-xl mx-auto py-16">
      <div className="bg-white border border-amber-200 rounded-xl p-6 text-center shadow-sm">
        <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Deal Room unavailable</h2>
        <p className="text-sm text-gray-600 mt-2">
          Private underwriting is disabled until the application has server-side authentication.
          Client-side passphrases cannot protect data delivered by a public static site.
        </p>
        <div className="flex items-start gap-2 text-left text-xs text-amber-800 bg-amber-50 rounded-lg p-3 mt-4">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Keep contracts, negotiation notes, financial assumptions, and private source material outside the public repository and Pages build.
        </div>
      </div>
    </div>
  );
}
