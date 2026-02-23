export interface VerticalConfig {
  key: string
  label: string
  shortLabel: string
  description: string
  icon: string
  accentColor: string
  table: string
  accessTable: string
  accessIdField: string
  rpc: string
  rpcParam: string
  nameField: string
  idField: string
}

// Single source of truth.
// Update table/accessTable/accessIdField/rpc/rpcParam/nameField to match your deployed schema exactly.
export const VERTICALS: Record<string, VerticalConfig> = {
  dealflow: {
    key: 'dealflow',
    label: 'Investment Deal Flow',
    shortLabel: 'Dealflow',
    description: 'Track companies, funding, stages, and signals.',
    icon: '💸',
    accentColor: '#6366f1',
    table: 'companies',
    accessTable: 'company_access',
    accessIdField: 'company_id',
    rpc: 'unlock_companies_secure',
    rpcParam: 'company_ids',
    nameField: 'name',
    idField: 'id'
  },
  salesintel: {
    key: 'salesintel',
    label: 'B2B Sales Intelligence',
    shortLabel: 'Sales',
    description: 'Contacts, accounts, and outreach readiness.',
    icon: '🎯',
    accentColor: '#ef4444',
    table: 'b2b_leads',
    accessTable: 'lead_access',
    accessIdField: 'lead_id',
    rpc: 'unlock_leads_secure',
    rpcParam: 'lead_ids',
    nameField: 'name',
    idField: 'id'
  },
  supplyintel: {
    key: 'supplyintel',
    label: 'Supply Chain Intelligence',
    shortLabel: 'Supply',
    description: 'Suppliers, compliance, and risk signals.',
    icon: '🚚',
    accentColor: '#64748b',
    table: 'suppliers',
    accessTable: 'supplier_access',
    accessIdField: 'supplier_id',
    rpc: 'unlock_suppliers_secure',
    rpcParam: 'supplier_ids',
    nameField: 'supplier_name',
    idField: 'id'
  },
  clinicalintel: {
    key: 'clinicalintel',
    label: 'Clinical Trial Intelligence',
    shortLabel: 'Clinical',
    description: 'Trials, enrollment, and outcomes tracking.',
    icon: '🧪',
    accentColor: '#14b8a6',
    table: 'clinical_trials',
    accessTable: 'clinical_trial_access',
    accessIdField: 'trial_id',
    rpc: 'unlock_trials_secure',
    rpcParam: 'trial_ids',
    nameField: 'title',
    idField: 'id'
  },
  legalintel: {
    key: 'legalintel',
    label: 'Legal Case Intelligence',
    shortLabel: 'Legal',
    description: 'Cases, filings, and litigation risk.',
    icon: '⚖️',
    accentColor: '#0f172a',
    table: 'legal_cases',
    accessTable: 'legal_case_access',
    accessIdField: 'case_id',
    rpc: 'unlock_cases_secure',
    rpcParam: 'case_ids',
    nameField: 'case_name',
    idField: 'id'
  },
  marketresearch: {
    key: 'marketresearch',
    label: 'Market Research Hub',
    shortLabel: 'Research',
    description: 'Trends, sentiment, and channel performance.',
    icon: '📊',
    accentColor: '#f97316',
    table: 'market_reports',
    accessTable: 'market_report_access',
    accessIdField: 'report_id',
    rpc: 'unlock_reports_secure',
    rpcParam: 'report_ids',
    nameField: 'title',
    idField: 'id'
  },
  academicintel: {
    key: 'academicintel',
    label: 'Academic Research',
    shortLabel: 'Academic',
    description: 'Papers, authors, and citations.',
    icon: '🎓',
    accentColor: '#3b82f6',
    table: 'papers',
    accessTable: 'paper_access',
    accessIdField: 'paper_id',
    rpc: 'unlock_papers_secure',
    rpcParam: 'paper_ids',
    nameField: 'title',
    idField: 'id'
  },
  creatorintel: {
    key: 'creatorintel',
    label: 'Creator Marketplace',
    shortLabel: 'Creators',
    description: 'Creators, engagement, and partnerships.',
    icon: '✨',
    accentColor: '#7c3aed',
    table: 'creators',
    accessTable: 'creator_access',
    accessIdField: 'creator_id',
    rpc: 'unlock_creators_secure',
    rpcParam: 'creator_ids',
    nameField: 'handle',
    idField: 'id'
  },
  gamingintel: {
    key: 'gamingintel',
    label: 'Gaming Studio Intelligence',
    shortLabel: 'Gaming',
    description: 'Studios, releases, and player metrics.',
    icon: '🎮',
    accentColor: '#111827',
    table: 'game_studios',
    accessTable: 'game_studio_access',
    accessIdField: 'studio_id',
    rpc: 'unlock_studios_secure',
    rpcParam: 'studio_ids',
    nameField: 'studio_name',
    idField: 'id'
  },
  realestateintel: {
    key: 'realestateintel',
    label: 'Real Estate Intelligence',
    shortLabel: 'Real Estate',
    description: 'Portfolios, cap rates, and debt signals.',
    icon: '🏢',
    accentColor: '#0ea5e9',
    table: 'properties',
    accessTable: 'property_access',
    accessIdField: 'property_id',
    rpc: 'unlock_properties_secure',
    rpcParam: 'property_ids',
    nameField: 'property_name',
    idField: 'id'
  },
  privatecreditintel: {
    key: 'privatecreditintel',
    label: 'Private Credit Intelligence',
    shortLabel: 'Credit',
    description: 'Exposure, covenants, and risk scoring.',
    icon: '🏦',
    accentColor: '#1e293b',
    table: 'credit_facilities',
    accessTable: 'credit_facility_access',
    accessIdField: 'facility_id',
    rpc: 'unlock_facilities_secure',
    rpcParam: 'facility_ids',
    nameField: 'borrower_name',
    idField: 'id'
  },
  cyberintel: {
    key: 'cyberintel',
    label: 'Cybersecurity Intelligence',
    shortLabel: 'Cyber',
    description: 'Threats, incidents, and exposure.',
    icon: '🛡️',
    accentColor: '#000000',
    table: 'organizations',
    accessTable: 'organization_access',
    accessIdField: 'organization_id',
    rpc: 'unlock_organizations_secure',
    rpcParam: 'organization_ids',
    nameField: 'org_name',
    idField: 'id'
  },
  biopharmintel: {
    key: 'biopharmintel',
    label: 'BioPharma Pipeline',
    shortLabel: 'BioPharma',
    description: 'Programs, phases, and milestones.',
    icon: '🧬',
    accentColor: '#2563eb',
    table: 'drug_programs',
    accessTable: 'drug_program_access',
    accessIdField: 'program_id',
    rpc: 'unlock_programs_secure',
    rpcParam: 'program_ids',
    nameField: 'program_name',
    idField: 'id'
  },
  industrialintel: {
    key: 'industrialintel',
    label: 'Industrial Intelligence',
    shortLabel: 'Industrial',
    description: 'OEE, downtime, and throughput.',
    icon: '🏭',
    accentColor: '#f59e0b',
    table: 'facilities',
    accessTable: 'facility_access',
    accessIdField: 'facility_id',
    rpc: 'unlock_facilities_secure',
    rpcParam: 'facility_ids',
    nameField: 'facility_name',
    idField: 'id'
  },
  govintel: {
    key: 'govintel',
    label: 'Government Contract Intelligence',
    shortLabel: 'Gov',
    description: 'Deadlines, agencies, and awards.',
    icon: '🧾',
    accentColor: '#111827',
    table: 'contracts',
    accessTable: 'contract_access',
    accessIdField: 'contract_id',
    rpc: 'unlock_contracts_secure',
    rpcParam: 'contract_ids',
    nameField: 'title',
    idField: 'id'
  },
  insuranceintel: {
    key: 'insuranceintel',
    label: 'Insurance Intelligence',
    shortLabel: 'Insurance',
    description: 'Rates, retention, and performance.',
    icon: '🧯',
    accentColor: '#0ea5e9',
    table: 'policies',
    accessTable: 'policy_access',
    accessIdField: 'policy_id',
    rpc: 'unlock_policies_secure',
    rpcParam: 'policy_ids',
    nameField: 'policy_name',
    idField: 'id'
  }
}
