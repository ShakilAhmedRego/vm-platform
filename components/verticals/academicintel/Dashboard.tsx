"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import KPICard from '../shared/KPICard'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
const vertical = VERTICALS['academicintel']
const ACCENT = '#0284c7'
export default function Dashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)
  const nameField = vertical.nameField
  const numericField = d.rows[0] ? Object.keys(d.rows[0]).find(k => typeof d.rows[0][k] === 'number' && !['id'].includes(k)) : null
  const chartData = d.rows.slice(0, 8).map(r => ({ name: String(r[nameField] || '').substring(0, 14), value: Number(numericField ? r[numericField] : 0) || 0 }))
  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    const keys = Object.keys(row)
    return [
      { label: 'Overview', content: <div className="space-y-4"><DrawerSection title="Details">{keys.slice(0, 6).map(k => <DrawerField key={k} label={k.replace(/_/g,' ')} value={safeRender(row[k])} />)}</DrawerSection></div> },
      { label: 'Details', content: <div className="space-y-4"><DrawerSection title="More">{keys.slice(6, 12).map(k => <DrawerField key={k} label={k.replace(/_/g,' ')} value={safeRender(row[k])} masked={m && ['email','phone','contact','url'].some(x => k.includes(x))} />)}</DrawerSection></div> },
      { label: 'Analysis', content: <div className="space-y-4"><DrawerSection title="Analysis">{keys.slice(12, 18).map(k => <DrawerField key={k} label={k.replace(/_/g,' ')} value={safeRender(row[k])} />)}</DrawerSection></div> },
      { label: 'Actions', content: <div className="p-2 text-sm text-gray-500">{unlocked ? <span className="text-emerald-600 font-medium">Full access granted.</span> : 'Unlock to access all details.'}</div> },
    ]
  }
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vertical.label}</h1><p className="text-sm text-gray-500 mt-0.5">{vertical.description}</p></div>
      {d.error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600">{d.error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Records" value={d.rows.length} sub="in database" />
        <KPICard label="Unlocked" value={d.unlockedIds.size} sub="by you" trend={d.unlockedIds.size > 0 ? 'up' : 'neutral'} />
        <KPICard label="Credits" value={d.creditBalance} sub="remaining" />
        <KPICard label="Selected" value={d.selectedIds.size} sub="for unlock" />
      </div>
      {chartData.some(x => x.value > 0) && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Records by {numericField?.replace(/_/g, ' ') || 'Score'}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" radius={[4,4,0,0]}>{chartData.map((_, i) => <Cell key={i} fill={ACCENT} opacity={1 - i * 0.08} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{vertical.label} ({d.rows.length})</h3>
          <button onClick={d.selectAll} className="text-xs hover:opacity-80" style={{ color: ACCENT }}>Select all</button>
        </div>
        {d.loading ? <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading...</div> : d.rows.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No records found.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <th className="px-4 py-3 w-8"><input type="checkbox" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              {d.rows[0] && Object.keys(d.rows[0]).filter(k => !['id','created_at','updated_at',nameField].includes(k)).slice(0, 4).map(col => (
                <th key={col} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{col.replace(/_/g,' ')}</th>
              ))}
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Access</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {d.rows.map(row => {
                const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                const cols = d.rows[0] ? Object.keys(d.rows[0]).filter(k => !['id','created_at','updated_at',nameField].includes(k)).slice(0, 4) : []
                return (
                  <tr key={id} onClick={() => d.setDrawerRow(row)} className={'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ' + (selected ? 'bg-blue-50 dark:bg-blue-900/10' : '')}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} /></td>
                    <td className="px-4 py-3 max-w-[200px]"><div className="flex items-center gap-2">{!unlocked && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}<span className="font-medium text-gray-900 dark:text-gray-100 truncate">{safeRender(row[nameField])}</span>{unlocked && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">Unlocked</span>}</div></td>
                    {cols.map(col => <td key={col} className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[120px] truncate">{safeRender(row[col])}</td>)}
                    <td className="px-4 py-3"><span className={'text-xs px-2 py-0.5 rounded-full ' + (unlocked ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800')}>{unlocked ? 'Unlocked' : 'Locked'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow[nameField] ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
