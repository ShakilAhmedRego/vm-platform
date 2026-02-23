'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData } from '../shared/useVerticalData'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerSection } from '../shared/Drawer'
import { safeRender } from '../shared/GenericDashboard'
import { asNumber, asString, containsCI, pickFirst } from '../shared/field'
import { BulkBar, EmptyCard, SavedViewsBar, SearchBox, SectionHeader, SegTabs, SortPills } from '../shared/ui'
import { exportCsv, filterSelectedUnlockedRows, filterUnlockedRows } from '../shared/exportCsv'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Lock } from 'lucide-react'
import { AlertTriangle, ShieldCheck, Truck, Globe2 } from 'lucide-react'
import type { ReactNode } from 'react'

const verticalKey = 'supplyintel'
const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#94a3b8']

function riskTier(score: number): 'Compliant' | 'Watchlist' | 'High Risk' {
  if (score >= 80) return 'Compliant'
  if (score >= 55) return 'Watchlist'
  return 'High Risk'
}

export default function Dashboard() {
  useEffect(() => { supabase.auth.getUser() }, [])
  const d = useVerticalData(verticalKey)
  const rows = d.data

  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<'all'|'compliant'|'watch'|'high'>('all')
  const [sort, setSort] = useState<'risk'|'name'>('risk')
  const [filters, setFilters] = useState<Record<string,string>>({ geo: 'All' })

  const filtered = useMemo(() => {
    let list = rows.slice()
    const q = search.trim()
    if (segment !== 'all') {
      list = list.filter(r => {
        const s = asNumber(pickFirst(r, ['risk_score','score']), 0)
        const t = riskTier(s)
        if (segment === 'compliant') return t === 'Compliant'
        if (segment === 'watch') return t === 'Watchlist'
        return t === 'High Risk'
      })
    }
    if ((filters.geo ?? 'All') !== 'All') {
      list = list.filter(r => asString(pickFirst(r, ['region','country','geo']), '—') === filters.geo)
    }
    if (q) {
      list = list.filter(r => {
        const s = [
          asString(pickFirst(r, ['supplier_name','name','supplier']), ''),
          asString(pickFirst(r, ['region','country','geo']), ''),
          asString(pickFirst(r, ['category','industry']), ''),
        ].join(' ')
        return containsCI(s, q)
      })
    }
    list.sort((a,b) => {
      if (sort === 'name') return asString(pickFirst(a, ['supplier_name','name','supplier']), '').localeCompare(asString(pickFirst(b, ['supplier_name','name','supplier']), ''))
      return asNumber(pickFirst(a, ['risk_score','score']), 0) - asNumber(pickFirst(b, ['risk_score','score']), 0)
    })
    return list
  }, [rows, search, segment, sort, filters])

  const geoOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      const v = asString(pickFirst(r, ['region','country','geo']), '')
      if (v && v !== '—') set.add(v)
    }
    return ['All', ...Array.from(set).slice(0, 10)]
  }, [rows])

  const riskMix = useMemo(() => {
    const m = { Compliant: 0, Watchlist: 0, 'High Risk': 0 }
    for (const r of filtered) m[riskTier(asNumber(pickFirst(r, ['risk_score','score']), 0))]++
    return [
      { name: 'Compliant', value: m.Compliant },
      { name: 'Watchlist', value: m.Watchlist },
      { name: 'High Risk', value: m['High Risk'] },
    ]
  }, [filtered])

  const drivers = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of filtered) {
      const key = asString(pickFirst(r, ['risk_driver','driver','issue','flag']), 'Unspecified')
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts).map(([k,v]) => ({ key: k, count: v })).sort((a,b)=>b.count-a.count).slice(0,6)
  }, [filtered])

  const kpis = useMemo(() => {
    const compliant = riskMix.find(x => x.name==='Compliant')?.value ?? 0
    const total = filtered.length || 1
    const compliancePct = Math.round((compliant/total)*100)
    const high = riskMix.find(x => x.name==='High Risk')?.value ?? 0
    const geoSpread = new Set(filtered.map(r => asString(pickFirst(r, ['region','country','geo']), '—'))).size
    return { compliancePct, high, geoSpread, total: filtered.length }
  }, [riskMix, filtered])

  const selectedUnlockedCount = useMemo(() => {
    let c=0; for (const id of d.selectedIds) if (d.unlockedIds.has(id)) c++
    return c
  }, [d.selectedIds, d.unlockedIds])

  function exportUnlocked(all: boolean) {
    const out = all ? filterUnlockedRows(rows, d.unlockedIds) : filterSelectedUnlockedRows(rows, d.unlockedIds, d.selectedIds)
    exportCsv({
      filename: all ? 'supplyintel-unlocked.csv' : 'supplyintel-selected-unlocked.csv',
      rows: out,
      columns: [
        { key: 'supplier_name', label: 'Supplier', keys: ['supplier_name','name','supplier'] },
        { key: 'region', label: 'Geography', keys: ['region','country','geo'] },
        { key: 'category', label: 'Category', keys: ['category','industry'] },
        { key: 'risk_score', label: 'Risk Score', keys: ['risk_score','score'] },
        { key: 'risk_driver', label: 'Risk Driver', keys: ['risk_driver','driver','issue'] },
      ],
    })
  }

  function drawerTabs(row: Record<string,unknown>, unlocked: boolean): {label:string; content:ReactNode}[] {
    const masked = (v: unknown) => (unlocked ? safeRender(v) : <span className="text-gray-300 dark:text-gray-700">●●●●</span>)
    return [
      { label: 'Supplier', content: (
        <div className="space-y-5">
          <DrawerSection title="Profile">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-gray-400">Supplier</div><div className="font-medium">{safeRender(pickFirst(row, ['supplier_name','name','supplier']))}</div></div>
              <div><div className="text-xs text-gray-400">Category</div><div className="font-medium">{safeRender(pickFirst(row, ['category','industry']))}</div></div>
              <div><div className="text-xs text-gray-400">Geography</div><div className="font-medium">{safeRender(pickFirst(row, ['region','country','geo']))}</div></div>
              <div><div className="text-xs text-gray-400">Owner</div><div className="font-medium">{masked(pickFirst(row, ['account_owner','owner']))}</div></div>
            </div>
          </DrawerSection>
          <DrawerSection title="Signals">
            <div className="text-sm text-gray-600 dark:text-gray-300">{masked(pickFirst(row, ['notes','summary']))}</div>
          </DrawerSection>
          <DrawerSection title="Actions">
            <div className="text-sm text-gray-600 dark:text-gray-300">Flag suppliers for review and export unlocked only.</div>
          </DrawerSection>
        </div>
      )},
      { label: 'Compliance', content: (
        <div className="space-y-5">
          <DrawerSection title="Compliance">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-gray-400">Compliance Score</div><div className="font-medium">{masked(pickFirst(row, ['compliance_score','compliance']))}</div></div>
              <div><div className="text-xs text-gray-400">Certifications</div><div className="font-medium">{masked(pickFirst(row, ['certifications','certs']))}</div></div>
            </div>
          </DrawerSection>
          <DrawerSection title="Notes">
            <div className="text-sm text-gray-600 dark:text-gray-300">{safeRender(pickFirst(row, ['compliance_notes','notes']))}</div>
          </DrawerSection>
        </div>
      )},
      { label: 'Geography', content: (
        <div className="space-y-5">
          <DrawerSection title="Footprint">{masked(pickFirst(row, ['sites','locations','facilities']))}</DrawerSection>
          <DrawerSection title="Risk">{safeRender(pickFirst(row, ['geo_risk','risk']))}</DrawerSection>
          <DrawerSection title="Summary"><div className="text-sm text-gray-600 dark:text-gray-300">Geo spread is derived on the dashboard for demo richness.</div></DrawerSection>
        </div>
      )},
      { label: 'Risk', content: (
        <div className="space-y-5">
          <DrawerSection title="Risk Assessment">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-gray-400">Risk Score</div><div className="font-medium">{safeRender(pickFirst(row, ['risk_score','score']))}</div></div>
              <div><div className="text-xs text-gray-400">Driver</div><div className="font-medium">{safeRender(pickFirst(row, ['risk_driver','driver','issue']))}</div></div>
            </div>
          </DrawerSection>
          <DrawerSection title="Recommendations"><div className="text-sm text-gray-600 dark:text-gray-300">{masked(pickFirst(row, ['recommendations','actions']))}</div></DrawerSection>
        </div>
      )},
    ]
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="rounded-3xl border border-emerald-100 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
              <Truck className="w-3.5 h-3.5" /> Supplier Risk Dashboard
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">Supply Chain Intelligence</h1>
            <p className="text-sm text-gray-500 mt-1">Risk strip + compliance donut + driver rankings — demo-ready even when empty.</p>
          </div>
          <div className="flex items-center gap-2">
            <SavedViewsBar verticalKey={verticalKey} current={{search,segment,sort,filters}} onApply={s=>{setSearch(s.search);setSegment(s.segment as any);setSort(s.sort as any);setFilters(s.filters||{})}}/>
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-white/70 dark:bg-gray-950/40 px-4 py-3">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider">Credits</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{d.creditBalance}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="Search supplier, geo, category…"/>
          <SegTabs value={segment} onChange={v=>setSegment(v as any)} options={[
            {key:'all', label:'All'},
            {key:'compliant', label:'Compliant'},
            {key:'watch', label:'Watchlist'},
            {key:'high', label:'High Risk'},
          ]}/>
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-white/70 dark:bg-gray-950/40 p-3 flex items-center justify-between gap-2">
            <div className="text-xs text-gray-500 flex items-center gap-2"><Globe2 className="w-3.5 h-3.5"/>Geo</div>
            <select value={filters.geo ?? 'All'} onChange={e=>setFilters(p=>({...p, geo: e.target.value}))} className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              {geoOptions.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
            <SortPills value={sort} onChange={v=>setSort(v as any)} options={[{key:'risk', label:'Sort: Risk'},{key:'name', label:'Sort: Name'}]}/>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-white/60 dark:bg-gray-950/40 p-4">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5"/>Compliance</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{kpis.compliancePct}%</div>
          </div>
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-white/60 dark:bg-gray-950/40 p-4">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5"/>High Risk</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{kpis.high}</div>
          </div>
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-white/60 dark:bg-gray-950/40 p-4">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider">Geo Spread</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{kpis.geoSpread}</div>
          </div>
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-white/60 dark:bg-gray-950/40 p-4">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider">Suppliers</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{kpis.total}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <SectionHeader title="Compliance Donut" hint="Distribution across risk tiers from current view."/>
          <div className="mt-4 h-[240px]">
            {riskMix.every(x=>x.value===0) ? <EmptyCard icon="🛡️" title="No suppliers in view" body="Adjust segments or import sample suppliers to populate charts."/> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskMix} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {riskMix.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {riskMix.map((x,i)=>(
              <div key={x.name} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                <div className="text-xs text-gray-500">{x.name}</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{x.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader title="Top Risk Drivers" hint="Computed from issue/driver fields." />
            <div className="mt-4 h-[240px]">
              {drivers.length === 0 ? <EmptyCard icon="⚠️" title="No drivers yet" body="When you add driver/issue fields, this panel ranks them automatically."/> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={drivers} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="key" tick={{ fontSize: 11 }} width={120} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }}/>
                    <Bar dataKey="count" radius={[0,8,8,0]} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Supplier Directory</div>
              <div className="text-xs text-gray-400">Click for drawer</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/40 text-left">
                  <tr>
                    <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded" onChange={e=>e.target.checked?d.selectAll():d.clearSelection()} /></th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Geo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.slice(0, 120).map((r:any)=>{
                    const id=String(r.id)
                    const unlocked=d.unlockedIds.has(id)
                    const selected=d.selectedIds.has(id)
                    const score=asNumber(pickFirst(r,['risk_score','score']),0)
                    const tier=riskTier(score)
                    return (
                      <tr key={id} className={['cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30', selected?'bg-emerald-50 dark:bg-emerald-900/20':''].join(' ')} onClick={()=>d.setDrawerRow(r)}>
                        <td className="px-4 py-3" onClick={e=>{e.stopPropagation(); d.toggleSelect(id)}}>
                          <input type="checkbox" checked={selected} onChange={()=>d.toggleSelect(id)} className="rounded"/>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {!unlocked ? <Lock className="w-3.5 h-3.5 text-gray-300"/> : null}
                            <div className="font-medium text-gray-900 dark:text-gray-100">{safeRender(pickFirst(r,['supplier_name','name','supplier']))}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{safeRender(pickFirst(r,['region','country','geo']))}</td>
                        <td className="px-4 py-3">
                          <span className={[
                            'text-[10px] px-2 py-0.5 rounded-full',
                            tier==='Compliant'?'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300':
                            tier==='Watchlist'?'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300':
                            'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          ].join(' ')}>{tier}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{safeRender(pickFirst(r,['risk_driver','driver','issue']))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <UnlockBar selectedCount={d.selectedIds.size} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />

      <BulkBar
        selectedCount={d.selectedIds.size}
        unlockedSelectedCount={selectedUnlockedCount}
        onClearSelection={d.clearSelection}
        onExportUnlocked={() => exportUnlocked(true)}
        onExportSelectedUnlocked={() => exportUnlocked(false)}
      />

      {d.drawerRow ? (
        <Drawer
          open={!!d.drawerRow}
          onClose={() => d.setDrawerRow(null)}
          title={asString(pickFirst(d.drawerRow as any, ['supplier_name','name','supplier']), 'Supplier')}
          isUnlocked={d.unlockedIds.has(String((d.drawerRow as any).id))}
          onUnlock={() => { d.toggleSelect(String((d.drawerRow as any).id)); d.handleUnlock() }}
          unlocking={d.unlocking}
          tabs={drawerTabs(d.drawerRow, d.unlockedIds.has(String((d.drawerRow as any).id)))}
        />
      ) : null}
    </div>
  )
}
