'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="clinicalintel"
      title="ClinicalIntel Trial Radar"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Enrollment trend"
      chartKind="line"
      sidePanelText="Site performance + outcome signals"
      tableLabels={["Name", "Phase", "Enrollment"]}
    />
  )
}
