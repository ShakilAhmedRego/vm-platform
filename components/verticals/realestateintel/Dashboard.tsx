'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="realestateintel"
      title="RealEstateIntel Portfolio"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="ROI snapshot"
      chartKind="pie"
      sidePanelText="Cap-rate + distress indicators"
      tableLabels={["Name", "City", "Cap rate"]}
    />
  )
}
