'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import KPICard from '@/components/verticals/shared/KPICard'
import UnlockBar from '@/components/verticals/shared/UnlockBar'
import Drawer from '@/components/verticals/shared/Drawer'
import { useVerticalData } from '@/components/verticals/shared/useVerticalData'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export type ChartKind = 'bar' | 'line' | 'area' | 'pie'

export const safeRender = (value: unknown): ReactNode => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined) return null
  return '—'
}

export const mask = (value: unknown) => {
  const v = safeRender(value)
  if (typeof v === 'string' && v.length > 0) return '●●●●●●●'
  if (typeof v === 'number') return '●●●●●'
  return '●●●●●'
}

export default function GenericDashboard({
  verticalKey,
  title,
  kpiLabels,
  chartTitle,
  chartKind,
  sidePanelText,
  tableLabels,
  localForceDark,
}: {
  verticalKey: string
  title: string
  kpiLabels: [string, string, string, string]
  chartTitle: string
  chartKind: ChartKind
  sidePanelText: string
  tableLabels: [string, string, string]
  localForceDark?: boolean
}) {
  const {
    vertical,
    rows,
    unlockedIds,
    selectedIds,
    drawerRow,
    setDrawerRow,
    loading,
    unlocking,
    error,
    toggleSelect,
    clearSelection,
    selectAll,
    handleUnlock,
    newCount,
  } = useVerticalData(verticalKey)

  const [activeTab, setActiveTab] = useState('overview')

  const total = rows.length
  const unlocked = unlockedIds.size
  const selected = selectedIds.size

  const chartData = useMemo(
    () =>
      rows.slice(0, 12).map((r, idx) => ({
        name: String(r?.[vertical.nameField] ?? `Item ${idx + 1}`).slice(0, 12),
        value: typeof r?.score === 'number' ? r.score : idx + 1,
      })),
    [rows, vertical.nameField]
  )

  const isUnlocked = (row: any) => {
    const id = row?.[vertical.idField]
    return typeof id === 'string' ? unlockedIds.has(id) : false
  }

  const rowId = (row: any): string | null => {
    const id = row?.[vertical.idField]
    return typeof id === 'string' ? id : null
  }

  const drawerTabs = (row: any) => {
    const locked = !isUnlocked(row)
    const keys = Object.keys(row ?? {})

    return [
      {
        key: 'overview',
        label: 'Overview',
        content: (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Table</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{vertical.table}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Record ID</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{safeRender(row?.[vertical.idField])}</div>
          </div>
        ),
      },
      {
        key: 'details',
        label: 'Details',
        content: (
          <div className="space-y-2">
            {keys.slice(0, 14).map((k) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">{k}</div>
                <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-[260px]">
                  {locked ? mask((row as any)[k]) : safeRender((row as any)[k])}
                </div>
              </div>
            ))}
          </div>
        ),
      },
    ]
  }

  const Chart = () => {
    if (chartKind === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="value" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (chartKind === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <XAxis dataKey="name" hide />
            <YAxis hide />
            <Tooltip />
            <Area type="monotone" dataKey="value" />
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    if (chartKind === 'pie') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90}>
              {chartData.map((_, i) => (
                <Cell key={i} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const wrapperClass = localForceDark ? 'dark bg-black text-white min-h-screen' : ''

  if (loading) {
    return <div className={`${wrapperClass} p-6 animate-pulse text-sm ${localForceDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading…</div>
  }

  return (
    <div className={wrapperClass}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`text-xs ${localForceDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{vertical.label}</div>
            <div className={`text-2xl font-semibold ${localForceDark ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{title}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} className={`px-3 py-2 rounded-md border text-sm ${localForceDark ? 'border-gray-800' : 'border-gray-200 dark:border-gray-800'}`}>Select all</button>
            <button onClick={clearSelection} className={`px-3 py-2 rounded-md border text-sm ${localForceDark ? 'border-gray-800' : 'border-gray-200 dark:border-gray-800'}`}>Clear</button>
          </div>
        </div>

        {error ? (
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${localForceDark ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>{error}</div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label={kpiLabels[0]} value={total} hint="Rows loaded (limit 200)" accentColor={vertical.accentColor} />
          <KPICard label={kpiLabels[1]} value={unlocked} hint="Unlocked items" accentColor={vertical.accentColor} />
          <KPICard label={kpiLabels[2]} value={selected} hint="Currently selected" accentColor={vertical.accentColor} />
          <KPICard label={kpiLabels[3]} value={newCount} hint="New unlock cost" accentColor={vertical.accentColor} />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`lg:col-span-2 rounded-2xl border p-4 ${localForceDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'}`}>
            <div className={`text-sm font-semibold ${localForceDark ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{chartTitle}</div>
            <div className="mt-4 h-56"><Chart /></div>
          </div>

          <div className={`rounded-2xl border p-4 ${localForceDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'}`}>
            <div className={`text-sm font-semibold ${localForceDark ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>Signal panel</div>
            <div className={`mt-3 text-xs ${localForceDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{sidePanelText}</div>
            <div className="mt-4 space-y-2">
              {rows.slice(0, 5).map((r, idx) => {
                const locked = !isUnlocked(r)
                return (
                  <div key={idx} className={`rounded-xl border p-3 ${localForceDark ? 'border-gray-800' : 'border-gray-200 dark:border-gray-800'}`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-sm font-medium truncate max-w-[220px] ${localForceDark ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        {safeRender(r?.[vertical.nameField] ?? `Item ${idx + 1}`)}
                      </div>
                      <div className="text-xs">
                        {locked ? <span className={localForceDark ? 'text-amber-300' : 'text-amber-600'}>🔒</span> : <span className={localForceDark ? 'text-emerald-300' : 'text-emerald-600'}>Unlocked</span>}
                      </div>
                    </div>
                    <div className={`mt-2 text-xs ${localForceDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {locked ? 'Masked preview — unlock to view.' : 'Full record available.'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className={`mt-6 rounded-2xl border overflow-hidden ${localForceDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'}`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${localForceDark ? 'border-gray-800' : 'border-gray-200 dark:border-gray-800'}`}>
            <div className={`text-sm font-semibold ${localForceDark ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>Records</div>
            <div className={`text-xs ${localForceDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>Click row for details</div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className={`text-xs ${localForceDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <tr>
                  <th className="px-4 py-3 text-left">Select</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">{tableLabels[0]}</th>
                  <th className="px-4 py-3 text-left">{tableLabels[1]}</th>
                  <th className="px-4 py-3 text-left">{tableLabels[2]}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const id = rowId(r)
                  const locked = !isUnlocked(r)
                  const isSel = id ? selectedIds.has(id) : false

                  const keys = Object.keys(r ?? {})
                  const aKey = keys.find((k) => k !== vertical.idField && k !== vertical.nameField) ?? keys[0]
                  const bKey = keys.find((k) => k !== vertical.idField && k !== vertical.nameField && k !== aKey) ?? keys[1]

                  return (
                    <tr
                      key={id ?? idx}
                      className={`border-t cursor-pointer ${localForceDark ? 'border-gray-900 hover:bg-gray-900/60' : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                      onClick={() => {
                        setDrawerRow(r)
                        setActiveTab('overview')
                      }}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSel} disabled={!id} onChange={() => id && toggleSelect(id)} />
                      </td>
                      <td className="px-4 py-3">
                        {locked ? (
                          <span className={`inline-flex items-center gap-2 ${localForceDark ? 'text-amber-300' : 'text-amber-600'}`}>🔒 Locked</span>
                        ) : (
                          <span className={`inline-flex items-center gap-2 ${localForceDark ? 'text-emerald-300' : 'text-emerald-600'}`}>● Unlocked</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-medium ${localForceDark ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        {safeRender(r?.[vertical.nameField] ?? '—')}
                      </td>
                      <td className={`px-4 py-3 ${localForceDark ? 'text-gray-200' : 'text-gray-700 dark:text-gray-200'}`}>
                        {locked ? mask((r as any)?.[aKey]) : safeRender((r as any)?.[aKey])}
                      </td>
                      <td className={`px-4 py-3 ${localForceDark ? 'text-gray-200' : 'text-gray-700 dark:text-gray-200'}`}>
                        {locked ? mask((r as any)?.[bKey]) : safeRender((r as any)?.[bKey])}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {rows.length === 0 ? (
              <div className={`p-6 text-sm ${localForceDark ? 'text-gray-400' : 'text-gray-500'}`}>No rows found.</div>
            ) : null}
          </div>
        </div>

        <Drawer
          open={!!drawerRow}
          title={String(drawerRow?.[vertical.nameField] ?? 'Record')}
          subtitle={vertical.label}
          locked={drawerRow ? !isUnlocked(drawerRow) : true}
          tabs={drawerRow ? drawerTabs(drawerRow) : []}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setDrawerRow(null)}
          onUnlock={async () => {
            const id = drawerRow ? rowId(drawerRow) : null
            if (!id) return
            // quick path: add to selection and unlock via shared handler
            toggleSelect(id)
            await handleUnlock()
          }}
        />

        {selectedIds.size > 0 ? (
          <UnlockBar selectedCount={selectedIds.size} newCount={newCount} onUnlock={handleUnlock} onClear={clearSelection} loading={unlocking} />
        ) : null}
      </div>
    </div>
  )
}
