// lib/upload.ts
import { supabase } from '@/lib/supabaseClient';
import { Att, kindOf } from '@/lib/types';

const slugify = (s: string) =>
  s.normalize('NFKD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-zA-Z0-9._-]/g, '-')
   .toLowerCase();

/** Faz upload dos arquivos no bucket "attachments" e retorna Att[] com URL pública */
export async function uploadAttachments(files: File[]): Promise<Att[]> {
  const out: Att[] = [];

  for (const f of files) {
    const fileName = `${Date.now()}-${slugify(f.name)}`;
    const path = fileName;

    const { error } = await supabase
      .storage
      .from('attachments')
      .upload(path, f, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Erro upload:', error);
      continue;
    }

    const { data: pub } = supabase
      .storage
      .from('attachments')
      .getPublicUrl(path);

    out.push({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      kind: kindOf(f.type, f.name),
      url: pub.publicUrl,
      path,
    });
  }

  return out;
}
