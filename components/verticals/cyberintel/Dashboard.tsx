'use client'

import GenericDashboard from '@/components/verticals/shared/GenericDashboard'

export default function Dashboard() {
  return (
    <GenericDashboard
      verticalKey="cyberintel"
      title="CyberIntel Threat Console"
      kpiLabels={["Targets", "Unlocked", "Selected", "Cost"]}
      chartTitle="Risk signal trend"
      chartKind="line"
      sidePanelText="Compliance + incident posture with always-dark local styling."
      tableLabels={["Organization", "Exposure", "Signal"]}
      localForceDark
    />
  )
}
