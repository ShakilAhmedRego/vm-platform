'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import KPICard from '../shared/KPICard'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, Area, AreaChart, Legend
} from 'recharts'
import { Lock, TrendingUp, Building2, DollarSign, Zap, ArrowUpRight, Target } from 'lucide-react'
import type { ReactNode } from 'react'

const vertical = VERTICALS.dealflow

const STAGE_COLORS: Record<string, string> = {
  'Seed': '#818cf8',
  'Series A': '#6366f1',
  'Series B': '#4f46e5',
  'Series C': '#4338ca',
  'Series D+': '#3730a3',
  'Growth': '#a78bfa',
  'Pre-seed': '#c4b5fd',
}

const MOCK_TREND = [
  { month: 'Aug', deals: 12, raised: 45 },
  { month: 'Sep', deals: 18, raised: 78 },
  { month: 'Oct', deals: 15, raised: 62 },
  { month: 'Nov', deals: 22, raised: 95 },
  { month: 'Dec', deals: 19, raised: 88 },
  { month: 'Jan', deals: 28, raised: 124 },
]

export default function DealflowDashboard() {
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id)
    })
  }, [])

  const d = useVerticalData(vertical, userId)

  const totalRaised = d.rows.reduce(
    (sum, r) => sum + (Number(r.total_raised) || 0),
    0
  )

  const activeDeals = d.rows.filter(
    r => r.workflow_status === 'active' || r.workflow_status === 'prospect'
  ).length

  const avgIntel = d.rows.length
    ? Math.round(
        d.rows.reduce(
          (sum, r) => sum + (Number(r.intelligence_score) || 0),
          0
        ) / d.rows.length
      )
    : 0

  const highIntel = d.rows.filter(
    r => Number(r.intelligence_score) >= 75
  ).length

  // ✅ STRICT-TYPED REDUCE FIX
  const stageCounts = d.rows.reduce<Record<string, number>>(
    (acc, r) => {
      const stage = String(r.funding_stage ?? 'Unknown')
      acc[stage] = (acc[stage] ?? 0) + 1
      return acc
    },
    {}
  )

  const stageData = Object.entries(stageCounts)
    .map(([stage, count]) => ({
      stage: stage.replace('Series ', 'S.'),
      count,
      fullStage: stage,
    }))
    .sort((a, b) => b.count - a.count)

  const trendData = d.rows.length > 0 ? MOCK_TREND : []

  function drawerTabs(
    row: Record<string, unknown>,
    unlocked: boolean
  ): { label: string; content: ReactNode }[] {
    const masked = !unlocked

    return [
      {
        label: 'Company',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Profile">
              <DrawerField label="Company" value={safeRender(row.company_name)} />
              <DrawerField label="Sector" value={safeRender(row.sector)} />
              <DrawerField label="HQ Location" value={safeRender(row.hq_location)} />
              <DrawerField label="Founded" value={safeRender(row.founded_year)} />
            </DrawerSection>
          </div>
        ),
      },
    ]
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Active Deals" value={activeDeals || d.rows.length} icon={<Building2 className="w-4 h-4" />} />
        <KPICard label="High Intel Score" value={highIntel} icon={<Zap className="w-4 h-4" />} />
        <KPICard label="Avg Intel Score" value={`${avgIntel}/100`} icon={<TrendingUp className="w-4 h-4" />} />
        <KPICard label="Total Raised" value={`$${(totalRaised / 1e6).toFixed(0)}M`} icon={<DollarSign className="w-4 h-4" />} />
      </div>

      <div className="bg-white dark:bg-gray-900 border rounded-2xl p-5">
        {stageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stageData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="stage" />
              <Tooltip />
              <Bar dataKey="count">
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={STAGE_COLORS[entry.fullStage] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400">
            {d.loading ? 'Loading…' : 'No stage data yet'}
          </div>
        )}
      </div>

      <UnlockBar
        selectedCount={d.selectedIds.size}
        newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length}
        unlocking={d.unlocking}
        creditBalance={d.creditBalance}
        onUnlock={d.handleUnlock}
        onClear={d.clearSelection}
      />

      {d.drawerRow && (
        <Drawer
          open
          onClose={() => d.setDrawerRow(null)}
          title={String(d.drawerRow.company_name ?? '—')}
          isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))}
          unlocking={d.unlocking}
          onUnlock={() => {
            d.toggleSelect(String(d.drawerRow!.id))
            d.handleUnlock()
          }}
          tabs={drawerTabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))}
        />
      )}
    </div>
  )
}
