import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderOpen, Upload, FileText, Image as ImageIcon, Trash2, ExternalLink, Loader2, Mic, Mail, File } from 'lucide-react';

// Private per-deal document vault. Uploads go to the loopback-gated server
// (gitignored server/data/deal-files/<slug>/); the Drive section renders the
// manifest.json index so documents that live in Google Drive are one click
// away. Only mounted in full-stack mode — never in the public static build.

const fmtSize = b => b == null ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const isImage = name => /\.(png|jpe?g|gif|webp|heic)$/i.test(name);

const TYPE_ICON = { pdf: FileText, gdoc: FileText, docx: FileText, txt: FileText, eml: Mail, audio: Mic };

export default function DealDocuments({ slug, title }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/deals/${slug}/files`);
      if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
      setData(await r.json());
      setErr('');
    } catch (e) {
      setErr(`Documents unavailable: ${e.message} — is ALLOW_PRIVATE_LOCAL=true set in server/.env?`);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = useCallback(async (fileList) => {
    if (!fileList?.length) return;
    setBusy(true);
    try {
      const form = new FormData();
      for (const f of fileList) form.append('files', f);
      const r = await fetch(`/api/deals/${slug}/files`, { method: 'POST', body: form });
      if (!r.ok) throw new Error((await r.json()).error || `Upload failed (HTTP ${r.status})`);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }, [slug, load]);

  async function remove(name) {
    if (!window.confirm(`Delete ${name}? (Removes the local copy only — Drive is untouched.)`)) return;
    await fetch(`/api/deals/${slug}/files/${encodeURIComponent(name)}`, { method: 'DELETE' });
    await load();
  }

  const uploads = data?.uploads || [];
  const drive = data?.drive;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">Documents — {title || slug}</h3>
        {drive?.drive_folder?.url && (
          <a href={drive.drive_folder.url} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
            Open Drive folder <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {err && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">{err}</p>}

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }} />
        {busy
          ? <p className="text-sm text-gray-500 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</p>
          : <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Drop photos or documents here, or click to choose (stored locally, never in Git)
            </p>}
      </div>

      {/* Local uploads */}
      {uploads.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Uploaded locally ({uploads.length})</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {uploads.map(f => (
              <div key={f.name} className="group relative rounded-lg border border-gray-200 overflow-hidden">
                <a href={`/api/deals/${slug}/files/${encodeURIComponent(f.name)}`} target="_blank" rel="noopener noreferrer" className="block">
                  {isImage(f.name) ? (
                    <img src={`/api/deals/${slug}/files/${encodeURIComponent(f.name)}`} alt={f.name} className="h-24 w-full object-cover" />
                  ) : (
                    <div className="h-24 flex items-center justify-center bg-gray-50"><FileText className="w-8 h-8 text-gray-300" /></div>
                  )}
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] font-medium text-gray-700 truncate">{f.name}</p>
                    <p className="text-[10px] text-gray-400">{fmtSize(f.size)}</p>
                  </div>
                </a>
                <button onClick={() => remove(f.name)} title="Delete local copy"
                  className="absolute top-1 right-1 p-1 rounded bg-white/90 shadow opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drive index */}
      {drive?.folders?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">
            In Google Drive ({drive.folders.reduce((n, f) => n + f.files.length, 0)} documents · synced {drive.synced_at})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {drive.folders.map(folder => (
              <div key={folder.name} className="rounded-lg border border-gray-200 p-3">
                <a href={folder.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold text-gray-800 hover:text-blue-700 flex items-center gap-1.5 mb-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-amber-500" /> {folder.name}
                  <span className="font-normal text-gray-400">({folder.files.length})</span>
                </a>
                <ul className="space-y-1">
                  {folder.files.map(f => {
                    const Icon = TYPE_ICON[f.type] || File;
                    return (
                      <li key={f.url}>
                        <a href={f.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-gray-600 hover:text-blue-700 hover:underline flex items-start gap-1.5">
                          <Icon className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
                          <span className="truncate">{f.title}</span>
                          {f.size && <span className="ml-auto shrink-0 text-[10px] text-gray-400">{fmtSize(f.size)}</span>}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
