import { supabase } from './supabase'
import type { VerticalConfig } from './verticals'

export async function getUnlockedIds(
  userId: string,
  vertical: VerticalConfig
): Promise<Set<string>> {
  // NOTE: we intentionally use select('*') (not select(dynamicString))
  // to avoid Supabase's GenericStringError typing when the column name is dynamic.
  const { data, error } = await supabase
    .from(vertical.accessTable)
    .select('*')
    .eq('user_id', userId)

  if (error) throw error

  const ids = new Set<string>()
  for (const row of (data as unknown as Record<string, unknown>[] | null) ?? []) {
    ids.add(String(row[vertical.accessIdField]))
  }
  return ids
}

export async function unlockIds(vertical: VerticalConfig, ids: string[]) {
  const payload: Record<string, unknown> = { [vertical.rpcParam]: ids }
  return supabase.rpc(vertical.rpc, payload)
}
