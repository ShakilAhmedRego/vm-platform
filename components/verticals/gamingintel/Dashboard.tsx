'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="gamingintel"
      title="GamingIntel Studio Tracker"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="DAU/MAU proxy"
      chartKind="line"
      sidePanelText="Region mix + release cadence"
      tableLabels={["Name", "Country", "DAU"]}
    />
  )
}
