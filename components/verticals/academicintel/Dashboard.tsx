'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="academicintel"
      title="AcademicIntel Library"
      kpiLabels={["Inventory", "Unlocked", "Selected", "Cost"]}
      chartTitle="Citation curve"
      chartKind="line"
      sidePanelText="Author activity + impact"
      tableLabels={["Name", "Author", "Year"]}
    />
  )
}
