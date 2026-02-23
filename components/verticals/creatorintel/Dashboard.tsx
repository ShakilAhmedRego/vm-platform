'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="creatorintel"
      title="CreatorIntel Marketplace"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Engagement bars"
      chartKind="bar"
      sidePanelText="Partnership fit + activity"
      tableLabels={["Name", "Platform", "Engagement"]}
    />
  )
}
