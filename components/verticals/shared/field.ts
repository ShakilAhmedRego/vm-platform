'use client'

export type AnyRow = Record<string, unknown>

export function pickFirst(row: AnyRow, keys: string[]): unknown {
  for (const k of keys) {
    if (k in row && row[k] !== null && row[k] !== undefined) return row[k]
  }
  return undefined
}

export function asString(v: unknown, fallback = '—'): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (v === null || v === undefined) return fallback
  return fallback
}

export function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''))
    return Number.isFinite(n) ? n : fallback
  }
  return fallback
}

export function rowId(row: AnyRow): string {
  const v = (row as any).id
  return typeof v === 'string' || typeof v === 'number' ? String(v) : ''
}

export function containsCI(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle.toLowerCase())
}
