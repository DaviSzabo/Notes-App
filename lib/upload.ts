// app/lib/upload.ts
import { supabase } from '@/app/lib/supabaseClient'

// pega a extensão simples do nome
const extOf = (name: string) => {
  const p = name.split('.'); return p.length > 1 ? p.pop()! : 'bin'
}

const slug = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()

export async function uploadAttachments(files: File[]): Promise<Att[]> {
  const out: Att[] = []

  for (const f of files) {
    const filename = `${Date.now()}-${slug(f.name)}`
    const path = `${filename}`

    const { error } = await supabase
      .storage
      .from('attachments')
      .upload(path, f, { cacheControl: '3600', upsert: false })

    if (error) {
      console.error('Upload error:', error)
      continue
    }

    const { data: pub } = supabase.storage.from('attachments').getPublicUrl(path)

    out.push({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      kind: kindOf(f.type, f.name), // usa sua função existente do page.tsx
      url: pub.publicUrl,
      path
    })
  }

  return out
}
