// lib/types.ts

export type Kind = 'image' | 'video' | 'pdf' | 'doc' | 'sheet' | 'file';

export const kindOf = (type?: string, name = ''): Kind => {
  const t = (type || '').toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
  return 'file';
};

export const fmtBytes = (b?: number) => {
  if (b === 0) return '0 B';
  if (!b) return '';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.max(b, 1)) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
};

export type Att = {
  id: string;
  name: string;
  size?: number;
  type?: string;
  kind: Kind;
  url: string;
  /** caminho do arquivo no bucket (para deletar/mover futuramente) */
  path?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  createdAt: string;
  attachments: Att[];
};
