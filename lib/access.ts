import { supabase } from './supabase'
import type { VerticalConfig } from './verticals'

export async function getUnlockedIds(
  vertical: VerticalConfig,
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(vertical.accessTable)
    .select(vertical.accessIdField)
    .eq('user_id', userId)

  if (error) return new Set()

  // STRICT-SAFE FIX (no logic change)
  const raw = (data ?? []) as unknown
  const safeArray = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : []

  return new Set(
    safeArray.map(r =>
      String(r[vertical.accessIdField])
    )
  )
}

export async function unlockIds(
  vertical: VerticalConfig,
  ids: string[]
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc(vertical.rpc, {
    [vertical.rpcParam]: ids,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
