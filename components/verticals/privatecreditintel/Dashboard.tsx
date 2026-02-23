'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="privatecreditintel"
      title="PrivateCreditIntel Risk Desk"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Exposure bars"
      chartKind="bar"
      sidePanelText="Covenant pressure + watchlist"
      tableLabels={["Name", "Borrower", "Exposure"]}
    />
  )
}
