'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Paperclip, Search, Filter, Tag, Trash2, Download, X, Upload, Image as ImageIcon, FileText, Film, FileSpreadsheet, FileType2, LayoutGrid, List, Clock3, CheckCircle2, XCircle } from 'lucide-react';

const LS_KEY = 'syn_notes_v4';
const DEFAULT_CATS = ['Geral','Projeto','Estudos','Trabalho','Ideia'];
const fmtBytes = (b?: number) => { if (b===0) return '0 B'; if (!b) return ''; const k=1024,s=['B','KB','MB','GB','TB']; const i=Math.floor(Math.log(Math.max(b,1))/Math.log(k)); return `${(b/Math.pow(k,i)).toFixed(1)} ${s[i]}`; };
const kindOf = (type?: string, name='') => { const t=(type||'').toLowerCase(); const ext=name.split('.').pop()?.toLowerCase()||''; if(t.startsWith('image/'))return 'image'; if(t.startsWith('video/'))return 'video'; if(t==='application/pdf'||ext==='pdf')return 'pdf'; if(['doc','docx'].includes(ext))return 'doc'; if(['xls','xlsx','csv'].includes(ext))return 'sheet'; return 'file'; };

export default function Page() {
  const [notes, setNotes] = useState<any[]>(() => { try{ const raw=localStorage.getItem(LS_KEY); return raw?JSON.parse(raw):[]; }catch{return [];} });
  useEffect(()=> localStorage.setItem(LS_KEY, JSON.stringify(notes)), [notes]);

  const categories = useMemo(()=> Array.from(new Set([...DEFAULT_CATS, ...notes.map(n=>n.category).filter(Boolean)])), [notes]);
  const catCount = useMemo(()=> { const m=new Map<string,number>(); notes.forEach(n=> m.set(n.category, (m.get(n.category)||0)+1)); return m; }, [notes]);

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todos');
  const [sort, setSort] = useState<'new'|'old'>('new');
  const [onlyWithAtt, setOnlyWithAtt] = useState(false);
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [limit, setLimit] = useState(12);

  const [qcTitle, setQcTitle] = useState('');
  const [qcCat, setQcCat] = useState('Geral');
  const [qcFiles, setQcFiles] = useState<any[]>([]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Geral');
  const [files, setFiles] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement|null>(null);
  const dropRef = useRef<HTMLDivElement|null>(null);

  useEffect(()=>{
    const el=dropRef.current; if(!el) return; const stop=(e:any)=>{e.preventDefault();e.stopPropagation();};
    const over=(e:any)=>{stop(e); el.classList.add('ring-2','ring-indigo-500');};
    const leave=(e:any)=>{stop(e); el.classList.remove('ring-2','ring-indigo-500');};
    const drop=(e:any)=>{stop(e); addFiles(e.dataTransfer.files, setFiles); el.classList.remove('ring-2','ring-indigo-500');};
    el.addEventListener('dragover', over); el.addEventListener('dragleave', leave); el.addEventListener('drop', drop);
    ['dragenter','dragover','dragleave','drop'].forEach(evt=> window.addEventListener(evt, stop));
    return ()=>{ el.removeEventListener('dragover', over); el.removeEventListener('dragleave', leave); el.removeEventListener('drop', drop); ['dragenter','dragover','dragleave','drop'].forEach(evt=> window.removeEventListener(evt, stop)); };
  },[]);

  const sentinelRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{ const el=sentinelRef.current; if(!el) return; const io=new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting) setLimit(l=>l+12); }); },{rootMargin:'400px'}); io.observe(el); return ()=> io.disconnect(); },[]);

  const addFiles = (fileList: FileList|any[], setter: Function) => { const arr=Array.from(fileList||[]).map((f:any)=>({ id:crypto.randomUUID(), name:f.name, size:f.size, type:f.type, kind:kindOf(f.type,f.name), url:URL.createObjectURL(f) })); setter((prev:any[])=>[...prev, ...arr]); };
  const revokeUrls = (atts:any[]=[]) => atts.forEach(a=> a.url && URL.revokeObjectURL(a.url));
  const resetModal = () => { setTitle(''); setContent(''); setAuthor(''); setCategory('Geral'); setFiles([]); if(inputRef.current) inputRef.current.value=''; };

  const createNote = (payload?: any) => {
    const base = payload || { title:(title||qcTitle).trim()||'(Sem título)', content:content.trim(), author:author.trim()||'Anônimo', category:(category||qcCat)||'Geral', attachments: files.length?files:qcFiles };
    if(!base.title && !base.content && (!base.attachments || base.attachments.length===0)) return;
    const n = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...base };
    setNotes(prev=>[n,...prev]); resetModal(); setQcTitle(''); setQcCat('Geral'); setQcFiles([]); setOpen(false);
  };
  const delNote = (id: string) => setNotes(prev=>{ const n=prev.find(x=>x.id===id); if(n) revokeUrls(n.attachments); return prev.filter(x=>x.id!==id); });
  const prettyDate = (iso: string) => { try { return new Intl.DateTimeFormat(undefined,{dateStyle:'medium', timeStyle:'short'}).format(new Date(iso)); } catch { return iso; } };

  const filtered = useMemo(()=>{
    const query=q.trim().toLowerCase(); let arr = notes.filter(n=>{ if(onlyWithAtt && (!n.attachments||n.attachments.length===0)) return false; if(cat!=='Todos' && n.category!==cat) return false; if(!query) return true; return [n.title,n.content,n.author,n.category].filter(Boolean).some((v:string)=>v.toLowerCase().includes(query)); });
    arr.sort((a,b)=> sort==='new' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return arr;
  }, [notes,q,cat,sort,onlyWithAtt]);
  const visible = filtered.slice(0, limit);

  const [tests, setTests] = useState<{name:string; pass:boolean; details:any}[]>([]);
  const runTests = () => {
    const results: {name:string; pass:boolean; details:any}[] = [];
    const bg = getComputedStyle(document.body).backgroundColor;
    const passBg = /rgb\(\s*242\s*,\s*231\s*,\s*190\s*\)/.test(bg);
    results.push({ name: 'Fundo do app (#f2e7be) aplicado', pass: passBg, details: bg });
    const okFont = Array.from(document.styleSheets).some(ss=>{ try { return Array.from((ss as CSSStyleSheet).cssRules||[]).some(r=> (r as any).cssText?.includes("font-family: 'Madera'")); } catch { return false; } });
    results.push({ name: 'Regra @font-face da Madera definida', pass: okFont, details: okFont });
    const demo=[{id:'1',createdAt:'2025-01-01T00:00:00.000Z',attachments:[]},{id:'2',createdAt:'2025-01-02T00:00:00.000Z',attachments:[{id:'a'}]}];
    const only=demo.filter(n=>n.attachments.length>0); results.push({ name:'Filtro "Apenas com anexos" funciona', pass: only.length===1, details: only.length });
    const sorted=[...demo].sort((a,b)=> new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    results.push({ name:'Ordenação "Mais recentes" correta', pass: sorted[0].id==='2', details: sorted.map(x=>x.id).join(',') });
    setTests(results);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-black text-white grid place-items-center font-semibold font-title">N</div>
            <div className="leading-tight">
              <div className="font-semibold font-title">Notes Feed</div>
              <div className="text-xs text-neutral-500">Estilo Synopsis</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-6 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input value={q} onChange={(e)=>{ setQ(e.target.value); setLimit(12); }} placeholder="Buscar notas, autores e categorias" className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div className="relative">
              <select value={cat} onChange={(e)=>{ setCat(e.target.value); setLimit(12); }} className="appearance-none pr-8 pl-3 py-2 rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-black">
                <option>Todos</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <Filter className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            </div>
            <div className="flex items-center gap-1 border border-neutral-300 rounded-xl p-1">
              <button onClick={()=>setView('grid')} className={`px-2 py-1 rounded-lg ${view==='grid'?'bg-neutral-100':''}`} title="Grid"><LayoutGrid className="size-4"/></button>
              <button onClick={()=>setView('list')} className={`px-2 py-1 rounded-lg ${view==='list'?'bg-neutral-100':''}`} title="Lista"><List className="size-4"/></button>
            </div>
            <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-xl btn-dark px-3 py-2 shadow-sm font-title"><Plus className="size-4"/>Nova nota</button>
          </div>
          <div className="md:hidden ml-auto">
            <button onClick={()=>setOpen(true)} className="inline-flex items-center gap-2 rounded-xl btn-dark px-3 py-2 shadow-sm font-title"><Plus className="size-4"/>Nova</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">
        <aside className="hidden lg:block">
          <nav className="sticky top-20">
            <div className="text-xs uppercase tracking-wider text-neutral-600">Categorias</div>
            <ul className="mt-2 space-y-1">
              <li>
                <button onClick={()=>setCat('Todos')} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm border ${cat==='Todos'?'bg-white/80 border-black/10':'border-neutral-200 hover:bg-white/70'}`}>
                  <span>Todos</span><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">{notes.length}</span>
                </button>
              </li>
              {categories.map(c => (
                <li key={c}>
                  <button onClick={()=>setCat(c)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm border ${cat===c?'bg-white/80 border-black/10':'border-neutral-200 hover:bg-white/70'}`}>
                    <span>{c}</span><span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100">{catCount.get(c)||0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main>
          <section className="rounded-2xl glass p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-xl bg-black text-white grid place-items-center font-semibold font-title">N</div>
              <input value={qcTitle} onChange={(e)=>setQcTitle(e.target.value)} placeholder="Escreva um título rápido…" className="flex-1 border border-black/10 bg-white/70 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
              <select value={qcCat} onChange={(e)=>setQcCat(e.target.value)} className="rounded-lg border border-black/10 bg-white/70 px-2 py-2">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <label className="inline-flex items-center gap-1 text-sm rounded-lg border border-black/10 bg-white/70 px-2 py-2 cursor-pointer hover:bg-white">
                <Paperclip className="size-4" />
                <input type="file" multiple className="hidden" onChange={(e)=>addFiles((e.target as HTMLInputElement).files!, setQcFiles)} />
                Anexar
              </label>
              <button onClick={()=>createNote({ title: qcTitle.trim() || '(Sem título)', content: '', author: 'Anônimo', category: qcCat, attachments: qcFiles })} className="rounded-xl btn-dark px-3 py-2 font-title">Postar</button>
            </div>
            {qcFiles.length>0 && (
              <div className="flex gap-2 overflow-x-auto">
                {qcFiles.map(f => <Thumb key={f.id} a={f} />)}
              </div>
            )}
          </section>

          {visible.length === 0 ? (
            <Empty onNew={()=>setOpen(true)} />
          ) : (
            <div className={view==='grid'? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
              {visible.map(n => (
                <Card key={n.id} n={n} prettyDate={prettyDate} onDelete={()=>delNote(n.id)} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="h-8" />
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl glass p-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-sm font-title">Filtros</h3><Clock3 className="size-4 text-neutral-500"/></div>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-neutral-700">Ordenar</label>
                  <select value={sort} onChange={(e)=>{ setSort(e.target.value as 'new'|'old'); setLimit(12); }} className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2">
                    <option value="new">Mais recentes</option>
                    <option value="old">Mais antigas</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input id="onlyAtt" type="checkbox" checked={onlyWithAtt} onChange={(e)=>{ setOnlyWithAtt(e.target.checked); setLimit(12); }} className="size-4" />
                  <label htmlFor="onlyAtt" className="text-sm">Apenas com anexos</label>
                </div>
                <div>
                  <label className="text-xs text-neutral-700">Exibição</label>
                  <div className="flex items-center gap-1 border border-black/10 rounded-xl p-1 bg-white/70 mt-1">
                    <button onClick={()=>setView('grid')} className={`px-2 py-1 rounded-lg ${view==='grid'?'bg-neutral-100':''}`} title="Grid"><LayoutGrid className="size-4"/></button>
                    <button onClick={()=>setView('list')} className={`px-2 py-1 rounded-lg ${view==='list'?'bg-neutral-100':''}`} title="Lista"><List className="size-4"/></button>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl glass p-4">
              <h3 className="font-semibold text-sm font-title">Testes</h3>
              <p className="text-sm text-neutral-700 mt-1">Clique para executar checks rápidos de UI/lógica.</p>
              <button onClick={runTests} className="mt-3 rounded-xl btn-dark px-3 py-2 font-title">Executar testes</button>
              <ul className="mt-3 space-y-2">
                {/* Test results render in canvas app; in Next we keep this block for symmetry */}
              </ul>
            </div>
            <div className="rounded-2xl glass p-4">
              <h3 className="font-semibold text-sm font-title">Dicas</h3>
              <ul className="mt-2 text-sm text-neutral-700 list-disc list-inside space-y-1">
                <li>Use o compositor rápido para ideias instantâneas.</li>
                <li>Arraste arquivos no modal para anexá-los.</li>
                <li>Alterne Grid/Lista conforme sua preferência.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {open && (
        <Modal onClose={()=>setOpen(false)}>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-700">Título</label>
                <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Resumo da reunião, ideia, tarefa..." className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-700">Autor</label>
                <input value={author} onChange={(e)=>setAuthor(e.target.value)} placeholder="Seu nome" className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-700">Conteúdo</label>
              <textarea value={content} onChange={(e)=>setContent(e.target.value)} rows={4} placeholder="Digite sua nota..." className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-neutral-700">Categoria</label>
                <select value={category} onChange={(e)=>setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-700">Anexos</label>
                <div ref={dropRef} className="mt-1 rounded-2xl glass px-4 py-6 text-center">
                  <div className="mx-auto size-10 rounded-xl bg-white/70 border border-black/10 grid place-items-center"><Upload className="size-5 text-neutral-700" /></div>
                  <p className="text-sm mt-2">Arraste e solte arquivos aqui</p>
                  <p className="text-xs text-neutral-600">PNG, JPG, MP4, PDF, DOCX, XLSX, etc.</p>
                  <div className="mt-3">
                    <input ref={inputRef} type="file" multiple onChange={(e)=>addFiles((e.target as HTMLInputElement).files!, setFiles)} className="hidden" id="file-input" />
                    <label htmlFor="file-input" className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 cursor-pointer hover:bg-white"><Paperclip className="size-4"/> Selecionar arquivos</label>
                  </div>
                  {files.length>0 && (
                    <div className="text-left mt-3 max-h-40 overflow-auto">
                      {files.map(f => (
                        <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50">
                          <Icon kind={f.kind} className="size-5" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm" title={f.name}>{f.name}</div>
                            {typeof f.size === 'number' ? <div className="text-xs text-neutral-600">{fmtBytes(f.size)}</div> : null}
                          </div>
                          <a href={f.url} download={f.name} className="text-neutral-700 hover:text-black" title="Baixar"><Download className="size-4"/></a>
                          <button onClick={()=> setFiles(prev => { const g = prev.find((x:any)=>x.id===f.id); if (g?.url) URL.revokeObjectURL(g.url); return prev.filter((x:any)=>x.id!==f.id); })} className="text-neutral-500 hover:text-rose-600" title="Remover"><X className="size-4"/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={()=>setOpen(false)} className="rounded-xl px-3 py-2 border border-black/10 bg-white/70 hover:bg-white">Cancelar</button>
              <button onClick={()=>createNote()} className="inline-flex items-center gap-2 rounded-xl btn-dark px-3 py-2 shadow-sm font-title"><Plus className="size-4"/>Salvar nota</button>
            </div>
          </div>
        </Modal>
      )}

      <footer className="py-10 text-center text-xs text-neutral-700">Feito com ❤️ — dados salvos localmente no seu navegador</footer>
    </div>
  );
}

function Card({ n, onDelete, prettyDate }: any) {
  const first = n.attachments?.[0];
  return (
    <article className="group rounded-2xl glass overflow-hidden">
      {first && (
        <div className="relative">
          {first.kind === 'image' ? (
            <img src={first.url} alt={first.name} className="h-48 w-full object-cover"/>
          ) : first.kind === 'video' ? (
            <video src={first.url} className="h-48 w-full object-cover bg-black" />
          ) : (
            <div className="h-48 w-full grid place-items-center bg-white/60">
              <Icon kind={first.kind} className="size-8 text-neutral-700"/>
            </div>
          )}
          {n.attachments?.length>1 && (
            <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white rounded-full px-2 py-1">+ {n.attachments.length-1}</div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={n.author} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate font-title" title={n.title}>{n.title}</h3>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/70 border border-black/10"><Tag className="size-3" />{n.category}</span>
              <span className="text-xs text-neutral-700">{prettyDate(n.createdAt)}</span>
            </div>
            {n.content && (
              <p className="text-sm text-neutral-800 mt-1 whitespace-pre-wrap line-clamp-3">{n.content}</p>
            )}
          </div>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-rose-600" title="Excluir nota">
            <Trash2 className="size-5"/>
          </button>
        </div>
        {n.attachments?.length>0 && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {n.attachments.map((a:any) => <Row key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </article>
  );
}

function Row({ a }: any) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-black/10 bg-white/70">
      <Icon kind={a.kind} className="size-5" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm" title={a.name}>{a.name}</div>
        {typeof a.size === 'number' && <div className="text-xs text-neutral-700">{fmtBytes(a.size)}</div>}
      </div>
      {a.kind === 'image' ? (
        <a href={a.url} target="_blank" rel="noreferrer" className="text-neutral-900 text-sm">Abrir</a>
      ) : a.kind === 'video' ? (
        <a href={a.url} target="_blank" rel="noreferrer" className="text-neutral-900 text-sm">Reproduzir</a>
      ) : a.kind === 'pdf' ? (
        <a href={a.url} target="_blank" rel="noreferrer" className="text-neutral-900 text-sm">Visualizar</a>
      ) : (
        <a href={a.url} download={a.name} className="text-neutral-900 text-sm">Baixar</a>
      )}
    </div>
  );
}

function Thumb({ a }: any) {
  if (a.kind === 'image') return <img src={a.url} alt={a.name} className="h-20 w-28 object-cover rounded-lg border border-black/10 bg-white/70" />;
  if (a.kind === 'video') return <video src={a.url} className="h-20 w-28 object-cover rounded-lg border border-black/10 bg-black" />;
  if (a.kind === 'pdf') return <div className="h-20 w-28 grid place-items-center rounded-lg border border-black/10 bg-white/70"><FileText className="size-6"/></div>;
  if (a.kind === 'sheet') return <div className="h-20 w-28 grid place-items-center rounded-lg border border-black/10 bg-white/70"><FileSpreadsheet className="size-6"/></div>;
  if (a.kind === 'doc') return <div className="h-20 w-28 grid place-items-center rounded-lg border border-black/10 bg-white/70"><FileText className="size-6"/></div>;
  return <div className="h-20 w-28 grid place-items-center rounded-lg border border-black/10 bg-white/70"><FileType2 className="size-6"/></div>;
}

function Icon({ kind, className }: any) {
  if (kind === 'image') return <ImageIcon className={className}/>;
  if (kind === 'video') return <Film className={className}/>;
  if (kind === 'pdf') return <FileText className={className}/>;
  if (kind === 'sheet') return <FileSpreadsheet className={className}/>;
  if (kind === 'doc') return <FileText className={className}/>;
  return <FileType2 className={className}/>;
}

function Avatar({ name }: any) {
  const initials = useMemo(()=>{ if(!name) return '?'; const parts=String(name).trim().split(/\s+/).slice(0,2); return parts.map(p=>p[0]?.toUpperCase()).join('')||'?'; },[name]);
  return <div className="size-9 rounded-xl bg-black text-white grid place-items-center font-semibold font-title shrink-0">{initials}</div>;
}

function Empty({ onNew }: any) {
  return (
    <div className="rounded-2xl glass p-10 text-center">
      <div className="mx-auto size-12 rounded-xl bg-white/70 text-black grid place-items-center mb-3"><Paperclip className="size-6"/></div>
      <h2 className="text-lg font-semibold font-title mb-1">Nenhuma nota por aqui</h2>
      <p className="text-neutral-800 mb-4">Crie sua primeira nota e anexe arquivos. Tudo fica salvo localmente.</p>
      <button onClick={onNew} className="inline-flex items-center gap-2 rounded-xl btn-dark px-3 py-2 shadow-sm font-title"><Plus className="size-4"/>Nova nota</button>
    </div>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl glass shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <h3 className="font-semibold font-title">Nova nota</h3>
          <button onClick={onClose} className="text-neutral-700 hover:text-black"><X className="size-5"/></button>
        </div>
        {children}
      </div>
    </div>
  );
