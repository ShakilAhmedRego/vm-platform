'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="insuranceintel"
      title="InsuranceIntel Book"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Retention trend"
      chartKind="area"
      sidePanelText="Rate change + renewals"
      tableLabels={["Name", "Carrier", "Retention"]}
    />
  )
}
