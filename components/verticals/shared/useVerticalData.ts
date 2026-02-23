'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { VERTICALS } from '@/lib/verticals'
import { getUnlockedIds, unlockIds } from '@/lib/access'
import { getCreditBalance } from '@/lib/credits'

export function useVerticalData(verticalKey: string) {
  const vertical = useMemo(() => VERTICALS[verticalKey] ?? VERTICALS.dealflow, [verticalKey])

  const [rows, setRows] = useState<any[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerRow, setDrawerRow] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number>(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: userRes } = await supabase.auth.getUser()
    const user = userRes.user
    if (!user) {
      setLoading(false)
      setError('Not authenticated')
      return
    }

    try {
      const [unlocked, bal, rowsRes] = await Promise.all([
        getUnlockedIds(user.id, vertical),
        getCreditBalance(user.id).catch(() => 0),
        supabase.from(vertical.table).select('*').order(vertical.idField, { ascending: false }).limit(200),
      ])

      const { data, error: rowsErr } = rowsRes as any
      if (rowsErr) throw rowsErr

      setUnlockedIds(unlocked)
      setCredits(bal)
      setRows((data ?? []) as any[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [vertical])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectAll = () => {
    const next = new Set<string>()
    for (const r of rows) {
      const id = r?.[vertical.idField]
      if (typeof id === 'string') next.add(id)
    }
    setSelectedIds(next)
  }

  const newCount = useMemo(() => {
    let c = 0
    for (const id of selectedIds) if (!unlockedIds.has(id)) c += 1
    return c
  }, [selectedIds, unlockedIds])

  const handleUnlock = async () => {
    const newIds = Array.from(selectedIds).filter((id) => !unlockedIds.has(id))
    if (newIds.length === 0) {
      setError('Already unlocked')
      return
    }

    setUnlocking(true)
    setError(null)

    try {
      const { error: rpcError } = await unlockIds(vertical, newIds)
      if (rpcError) throw rpcError
      await refresh()
      clearSelection()
    } catch (e: any) {
      setError(e?.message ?? 'Unlock failed')
    } finally {
      setUnlocking(false)
    }
  }

  return {
    vertical,
    rows,
    unlockedIds,
    selectedIds,
    drawerRow,
    setDrawerRow,
    loading,
    unlocking,
    error,
    credits,
    toggleSelect,
    clearSelection,
    selectAll,
    handleUnlock,
    newCount,
    refresh,
  }
}
