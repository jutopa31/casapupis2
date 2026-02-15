import { getSupabase } from '@/lib/supabase'
import type { HistoriaMilestone } from '@/types/database'

// ---------------------------------------------------------------------------
// Fetch all milestones ordered by `orden`
// ---------------------------------------------------------------------------

export async function fetchMilestones(): Promise<{
  data: HistoriaMilestone[] | null
  error: string | null
}> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: 'Supabase no configurado' }

  try {
    const { data, error } = await supabase
      .from('historia_milestones')
      .select('*')
      .order('orden', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Error fetching milestones:', err)
    return { data: null, error: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Upsert (create or update) a milestone
// ---------------------------------------------------------------------------

export async function upsertMilestone(
  milestone: Partial<HistoriaMilestone> & { title: string; orden: number }
): Promise<{ data: HistoriaMilestone | null; error: string | null }> {
  const supabase = getSupabase()
  if (!supabase) return { data: null, error: 'Supabase no configurado' }

  try {
    const payload = {
      ...(milestone.id ? { id: milestone.id } : {}),
      orden: milestone.orden,
      date: milestone.date ?? null,
      title: milestone.title,
      description: milestone.description ?? null,
      image_url: milestone.image_url ?? null,
      spotify_url: milestone.spotify_url ?? null,
    }

    const { data, error } = await supabase
      .from('historia_milestones')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Error upserting milestone:', err)
    return { data: null, error: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Delete a milestone
// ---------------------------------------------------------------------------

export async function deleteMilestone(
  id: string
): Promise<{ error: string | null }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase no configurado' }

  try {
    const { error } = await supabase
      .from('historia_milestones')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('Error deleting milestone:', err)
    return { error: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Reorder milestones – receives an array of IDs in desired order
// ---------------------------------------------------------------------------

export async function reorderMilestones(
  orderedIds: string[]
): Promise<{ error: string | null }> {
  const supabase = getSupabase()
  if (!supabase) return { error: 'Supabase no configurado' }

  try {
    const updates = orderedIds.map((id, index) =>
      supabase
        .from('historia_milestones')
        .update({ orden: index + 1 })
        .eq('id', id)
    )

    const results = await Promise.all(updates)
    const firstError = results.find((r) => r.error)
    if (firstError?.error) throw firstError.error

    return { error: null }
  } catch (err) {
    console.error('Error reordering milestones:', err)
    return { error: String(err) }
  }
}

// ---------------------------------------------------------------------------
// Upload image to storage bucket `galeria-pareja` under `historia/`
// ---------------------------------------------------------------------------

export async function uploadMilestoneImage(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = getSupabase()
  if (!supabase) return { url: null, error: 'Supabase no configurado' }

  try {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const filePath = `historia/${timestamp}_${random}.jpg`

    const { error: storageError } = await supabase.storage
      .from('galeria-pareja')
      .upload(filePath, file, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (storageError) throw storageError

    const { data: publicUrlData } = supabase.storage
      .from('galeria-pareja')
      .getPublicUrl(filePath)

    return { url: publicUrlData.publicUrl, error: null }
  } catch (err) {
    console.error('Error uploading milestone image:', err)
    return { url: null, error: String(err) }
  }
}
