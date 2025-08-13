// app/lib/db.ts
import { supabase } from '@/app/lib/supabaseClient'

export type DBNote = {
  id: string
  title: string
  content: string
  author: string
  category: string
  attachments: Att[]
  created_at: string
}

export async function fetchNotes(): Promise<DBNote[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  // Tipagem do Supabase vem como any -> convertemos
  return (data as any[]).map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    author: row.author,
    category: row.category,
    attachments: row.attachments || [],
    created_at: row.created_at,
  }))
}

export async function createNoteDB(n: Omit<DBNote, 'id' | 'created_at'>): Promise<DBNote> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: n.title,
      content: n.content,
      author: n.author,
      category: n.category,
      attachments: n.attachments,
    })
    .select()
    .single()

  if (error) throw error
  return {
    id: data!.id,
    title: data!.title,
    content: data!.content,
    author: data!.author,
    category: data!.category,
    attachments: data!.attachments || [],
    created_at: data!.created_at,
  }
}

export async function deleteNoteDB(id: string) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
