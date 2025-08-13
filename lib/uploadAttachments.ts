import { supabase } from '@/app/lib/supabaseClient'

// função para slugify
const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()

export async function uploadAttachments(files: File[]): Promise<Att[]> {
  const out: Att[] = []
  for (const f of files) {
    const ext = f.name.split('.').pop() || 'bin'
    const fileName = `${Date.now()}-${slugify(f.name)}`
    const path = `${fileName}`

    const { error } = await supabase
      .storage
      .from('attachments')
      .upload(path, f, { cacheControl: '3600', upsert: false })

    if (error) {
      console.error('Erro upload:', error)
      continue
    }

    const { data: pub } = supabase
      .storage
      .from('attachments')
      .getPublicUrl(path)

    out.push({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      kind: kindOf(f.type, f.name),
      url: pub.publicUrl,
      path
    })
  }
  return out
}
