'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="industrialintel"
      title="IndustrialIntel Ops"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Downtime bars"
      chartKind="bar"
      sidePanelText="OEE posture + throughput"
      tableLabels={["Name", "Line", "Downtime"]}
    />
  )
}
