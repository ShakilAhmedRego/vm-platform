'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="biopharmintel"
      title="BioPharmIntel Pipeline"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Phase pipeline"
      chartKind="area"
      sidePanelText="Milestones + catalyst calendar"
      tableLabels={["Name", "Phase", "Indication"]}
    />
  )
}
