'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="govintel"
      title="GovIntel Deadline Board"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Deadline urgency"
      chartKind="line"
      sidePanelText="Agency pipeline + due dates"
      tableLabels={["Name", "Agency", "Due"]}
    />
  )
}
