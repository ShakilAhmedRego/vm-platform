'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="marketresearch"
      title="MarketResearch Pulse"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Channel trend"
      chartKind="area"
      sidePanelText="Sentiment + channel performance"
      tableLabels={["Name", "Channel", "Sentiment"]}
    />
  )
}
