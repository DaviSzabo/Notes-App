'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Paperclip, Tag, Download, ArrowLeft, Image as ImageIcon, Film, FileSpreadsheet, FileText, FileType2 } from 'lucide-react';

const LS_KEY = 'syn_notes_v4';

type Kind = 'image' | 'video' | 'pdf' | 'doc' | 'sheet' | 'file';
type Att = { id: string; name: string; size?: number; type?: string; kind: Kind; url: string; };
type Note = {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  createdAt: string;
  attachments: Att[];
};

const fmtBytes = (b?: number) => {
  if (b === 0) return '0 B';
  if (!b) return '';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.max(b, 1)) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
};

export default function NotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr: Note[] = raw ? JSON.parse(raw) : [];
      const n = arr.find(x => x.id === params.id) || null;
      setNote(n);
    } catch {
      setNote(null);
    }
  }, [params.id]);

  const prettyDate = (iso?: string) => {
    if (!iso) return '';
    try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); }
    catch { return iso; }
  };

  if (!note) {
    return (
      <div className="min-h-screen font-body max-w-4xl mx-auto px-4 py-8 text-slate-300">
        <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 text-slate-200 hover:text-white mb-6">
          <ArrowLeft className="size-4" /> Voltar ao feed
        </button>
        <div className="glass p-6 rounded-2xl">
          <h1 className="text-xl font-title mb-2">Nota não encontrada</h1>
          <p>Esta página depende das notas salvas no seu navegador (localStorage).</p>
        </div>
      </div>
    );
  }

  const first = note.attachments?.[0];

  return (
    <div className="min-h-screen font-body max-w-4xl mx-auto px-4 py-8 text-slate-200">
      <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 text-slate-200 hover:text-white mb-6">
        <ArrowLeft className="size-4" /> Voltar ao feed
      </button>

      <div className="glass rounded-2xl overflow-hidden">
        {first ? (
          first.kind === 'image' ? (
            <img src={first.url} alt={first.name} className="w-full max-h-[420px] object-cover" />
          ) : first.kind === 'video' ? (
            <video src={first.url} controls className="w-full bg-black" />
          ) : (
            <div className="w-full h-56 grid place-items-center bg-[var(--elev)] border-b border-[var(--border)]">
              <FileText className="size-8 text-slate-300" />
            </div>
          )
        ) : null}

        <div className="p-6">
          <div className="inline-flex items-center gap-2 tag px-2 py-1 mb-2">
            <span className="text-xs">Categoria:</span>
            <strong className="text-xs">{note.category}</strong>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold font-title">{note.title}</h1>
          <div className="mt-2 text-sm text-slate-400">
            {note.author || 'Anônimo'} • {prettyDate(note.createdAt)}
          </div>

          {note.content && (
            <p className="mt-4 leading-relaxed whitespace-pre-wrap">{note.content}</p>
          )}

          {note.attachments?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Anexos</h3>
              <div className="grid gap-2">
                {note.attachments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl bg-[var(--elev)] border border-[var(--border)]">
                    <FileText className="size-5" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm" title={a.name}>{a.name}</div>
                      {typeof a.size === 'number' ? <div className="text-xs text-slate-500">{fmtBytes(a.size)}</div> : null}
                    </div>
                    <a href={a.url} download={a.name} className="text-slate-200 hover:text-white" title="Baixar">
                      <Download className="size-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {first && (
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <a href={first.url} target="_blank" rel="noreferrer" className="button text-center">
                <span className="inline-flex items-center gap-2">Acessar conteúdo</span>
              </a>
              <Link href="/" className="button text-center">
                <span className="inline-flex items-center gap-2">Voltar ao feed</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
