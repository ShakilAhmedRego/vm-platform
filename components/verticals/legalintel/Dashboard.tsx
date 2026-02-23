'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="legalintel"
      title="LegalIntel Docket Watch"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Case volume"
      chartKind="bar"
      sidePanelText="Filing cadence + risk flags"
      tableLabels={["Name", "Court", "Status"]}
    />
  )
}
