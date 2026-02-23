'use client'

import type { AnyRow } from './field'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = typeof value === 'string' ? value : String(value)
  const needsWrap = /[",\n\r]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsWrap ? `"\${escaped}"` : escaped
}

export type ColumnSpec = { key: string; label: string; keys?: string[] }

export function exportCsv(opts: {
  filename: string
  rows: AnyRow[]
  columns: ColumnSpec[]
}) {
  const header = opts.columns.map(c => csvEscape(c.label)).join(',')
  const lines = opts.rows.map(r => {
    return opts.columns
      .map(c => {
        const v = c.keys
          ? c.keys.reduce((acc: unknown, k) => (acc ?? (r as any)[k]), undefined)
          : (r as any)[c.key]
        return csvEscape(v)
      })
      .join(',')
  })
  const csv = [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = opts.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function filterUnlockedRows(rows: AnyRow[], unlockedIds: Set<string>, idField = 'id'): AnyRow[] {
  return rows.filter(r => {
    const id = (r as any)[idField]
    const sid = typeof id === 'string' || typeof id === 'number' ? String(id) : ''
    return sid && unlockedIds.has(sid)
  })
}

export function filterSelectedUnlockedRows(
  rows: AnyRow[],
  unlockedIds: Set<string>,
  selectedIds: Set<string>,
  idField = 'id'
): AnyRow[] {
  return rows.filter(r => {
    const id = (r as any)[idField]
    const sid = typeof id === 'string' || typeof id === 'number' ? String(id) : ''
    return sid && selectedIds.has(sid) && unlockedIds.has(sid)
  })
}
