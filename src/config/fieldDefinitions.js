// src/config/fieldDefinitions.js
// Master field definitions for Converge - defines all partner/prospect fields
// Used by: Import Wizard (field mapping), Profile Card, Data Completeness calculations

/**
 * Field Categories:
 * - core: Required/primary identification fields
 * - classification: How we categorize the partner
 * - contact: People and contact info
 * - capabilities: The 14 yes/no capability fields from the partner matrix
 * - financial: Sponsorship and cost data
 * - lifecycle: Dates, renewal, status tracking
 * - notes: Free-text fields
 * - system: Auto-calculated, not importable
 */

export const FIELD_DEFINITIONS = {
  // ═══════════════════════════════════════════
  // CORE IDENTIFICATION
  // ═══════════════════════════════════════════
  company_name: {
    key: 'company_name',
    label: 'Partner / Organization Name',
    type: 'text',
    category: 'core',
    required: true,
    importable: true,
    searchable: true,
    showInGrid: true,
    description: 'Legal or commonly used name of the organization',
  },
  website_url: {
    key: 'website_url',
    label: 'Partner URL / Website',
    type: 'url',
    category: 'core',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Primary website URL',
  },
  partner_address: {
    key: 'partner_address',
    label: 'Partner Address',
    type: 'text',
    category: 'core',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Physical address of the organization',
  },

  // ═══════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════
  relationship_type: {
    key: 'relationship_type',
    label: 'Relationship Type',
    type: 'select',
    category: 'classification',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: true,
    options: [
      'Affinity Partner',
      'Affiliate Partner',
      'Channel Partner',
      'Technology Partner',
    ],
    description: 'Type of partnership relationship',
  },
  organization_type: {
    key: 'organization_type',
    label: 'Organization Type',
    type: 'select',
    category: 'classification',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: true,
    options: [
      'Regional Association',
      'National Association',
      'EHR/EMR',
      'Integrator/MSP',
      'Care Management Solutions',
      'Claims Management Platform',
      'Educational Institution',
      'Regional Gov\'t',
      'Other Private Industry',
    ],
    description: 'What kind of organization this is',
  },
  tier: {
    key: 'tier',
    label: 'Target Tier',
    type: 'select',
    category: 'classification',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: true,
    options: ['Bronze', 'Silver', 'Gold', 'General', 'Hi-Po'],
    description: 'Partner tier level',
  },
  market: {
    key: 'market',
    label: 'Market / Geography',
    type: 'select',
    category: 'classification',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: true,
    options: [
      // Canada
      'Canada', 'Canada - AB', 'Canada - BC', 'Canada - MB', 'Canada - NB',
      'Canada - NL', 'Canada - NS', 'Canada - NT', 'Canada - NU',
      'Canada - ON', 'Canada - PEI', 'Canada - QC', 'Canada - SK', 'Canada - YT',
      // US (major states)
      'US', 'US - AL', 'US - AK', 'US - AZ', 'US - AR', 'US - CA', 'US - CO',
      'US - CT', 'US - DE', 'US - FL', 'US - GA', 'US - HI', 'US - ID',
      'US - IL', 'US - IN', 'US - IA', 'US - KS', 'US - KY', 'US - LA',
      'US - ME', 'US - MD', 'US - MA', 'US - MI', 'US - MN', 'US - MS',
      'US - MO', 'US - MT', 'US - NE', 'US - NV', 'US - NH', 'US - NJ',
      'US - NM', 'US - NY', 'US - NC', 'US - ND', 'US - OH', 'US - OK',
      'US - OR', 'US - PA', 'US - RI', 'US - SC', 'US - SD', 'US - TN',
      'US - TX', 'US - UT', 'US - VT', 'US - VA', 'US - WA', 'US - WV',
      'US - WI', 'US - WY', 'US - DC',
      // UK & Global
      'UK', 'UK - England', 'UK - Scotland', 'UK - Wales', 'UK - N. Ireland',
      'Global', 'Global (Not Priority)',
    ],
    allowCustom: true,
    description: 'Primary geographic market',
  },
  sub_specialty: {
    key: 'sub_specialty',
    label: 'Sub-Speciality',
    type: 'select',
    category: 'classification',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: false,
    options: [
      'General Senior Care',
      'Skilled Nursing',
      'Assisted Living/Independent Living',
      'Home Care',
      'General Post-Acute Care',
      'General Healthcare',
      'General Ambulatory',
      'Payer',
      'Other',
    ],
    description: 'Healthcare sub-specialty focus',
  },
  membership_size: {
    key: 'membership_size',
    label: 'Membership / Install-base Size',
    type: 'text',
    category: 'classification',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Number of members, facilities, or install base size',
  },
  source: {
    key: 'source',
    label: 'Lead Source',
    type: 'select',
    category: 'classification',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: false,
    options: [
      'Conference',
      'Referral',
      'Inbound',
      'Scout Research',
      'Partner Recommendation',
      'Industry Directory',
      'Spreadsheet Import',
      'Other',
    ],
    description: 'How this prospect/partner was discovered',
  },

  // ═══════════════════════════════════════════
  // CONTACT INFORMATION
  // ═══════════════════════════════════════════
  contact_name: {
    key: 'contact_name',
    label: 'Contact Name',
    type: 'text',
    category: 'contact',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: false,
    description: 'Primary contact person',
  },
  contact_email: {
    key: 'contact_email',
    label: 'Contact Email',
    type: 'email',
    category: 'contact',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: false,
    description: 'Primary contact email address',
  },
  contact_phone: {
    key: 'contact_phone',
    label: 'Contact Phone',
    type: 'text',
    category: 'contact',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Primary contact phone number',
  },
  contact_title: {
    key: 'contact_title',
    label: 'Contact Title',
    type: 'text',
    category: 'contact',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Primary contact job title',
  },
  contact_linkedin: {
    key: 'contact_linkedin',
    label: 'Contact LinkedIn',
    type: 'url',
    category: 'contact',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Primary contact LinkedIn profile URL',
  },

  // ═══════════════════════════════════════════
  // CAPABILITIES MATRIX (14 boolean fields)
  // ═══════════════════════════════════════════
  cap_co_marketing: {
    key: 'cap_co_marketing',
    label: 'Co-Marketing Available',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Partner offers co-marketing opportunities',
  },
  cap_membership_required: {
    key: 'cap_membership_required',
    label: 'Membership Required',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Membership is required to access benefits',
  },
  cap_membership_available: {
    key: 'cap_membership_available',
    label: 'Access to Membership Available',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Membership access is available to CliniCONEX',
  },
  cap_digital_promo: {
    key: 'cap_digital_promo',
    label: 'Digital Promo Available',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Digital promotional opportunities available',
  },
  cap_event_marketing: {
    key: 'cap_event_marketing',
    label: 'Event Marketing Available',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Event marketing and sponsorship opportunities',
  },
  cap_thought_leadership: {
    key: 'cap_thought_leadership',
    label: 'Content / Thought Leadership',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Content submission or thought leadership opportunities',
  },
  cap_lobby_govt: {
    key: 'cap_lobby_govt',
    label: 'Lobby / Gov\'t Relations',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Access to government relations or lobbying',
  },
  cap_market_intelligence: {
    key: 'cap_market_intelligence',
    label: 'Access Market Intelligence',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Access to market research and intelligence',
  },
  cap_board_seat: {
    key: 'cap_board_seat',
    label: 'Committee / Board Seat',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Opportunity for committee or board participation',
  },
  cap_partner_program: {
    key: 'cap_partner_program',
    label: 'Partner Program Exists',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Organization has an existing partner program',
  },
  cap_reseller_program: {
    key: 'cap_reseller_program',
    label: 'Reseller Program Exists',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Organization has a reseller program',
  },
  cap_marketplace: {
    key: 'cap_marketplace',
    label: 'Marketplace Exists',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Organization has a marketplace or app store',
  },
  cap_solution_alignment: {
    key: 'cap_solution_alignment',
    label: 'Solution Alignment',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Solutions are aligned with ACP offering',
  },
  cap_api_available: {
    key: 'cap_api_available',
    label: 'Available API',
    type: 'boolean',
    category: 'capabilities',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Organization has a public API available',
  },

  // ═══════════════════════════════════════════
  // FINANCIAL
  // ═══════════════════════════════════════════
  sponsorship_usd: {
    key: 'sponsorship_usd',
    label: 'Sponsorship (USD)',
    type: 'currency',
    category: 'financial',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Sponsorship cost in US dollars',
  },
  sponsorship_cad: {
    key: 'sponsorship_cad',
    label: 'Sponsorship (CAD)',
    type: 'currency',
    category: 'financial',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Sponsorship cost in Canadian dollars',
  },

  // ═══════════════════════════════════════════
  // LIFECYCLE & STATUS
  // ═══════════════════════════════════════════
  status: {
    key: 'status',
    label: 'Status',
    type: 'select',
    category: 'lifecycle',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: true,
    options: ['Active', 'Onboarding', 'Inactive', 'Archived', 'Prospect'],
    description: 'Current relationship status',
  },
  existing_partner: {
    key: 'existing_partner',
    label: 'Existing Partner?',
    type: 'boolean',
    category: 'lifecycle',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Whether this is an existing active partner',
  },
  pipeline_stage: {
    key: 'pipeline_stage',
    label: 'Pipeline Stage',
    type: 'select',
    category: 'lifecycle',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: true,
    options: ['New', 'Researching', 'Outreach Sent', 'Meeting Scheduled', 'Evaluating Fit'],
    description: 'Current stage in the prospect pipeline',
  },
  contract_start: {
    key: 'contract_start',
    label: 'Start Date',
    type: 'date',
    category: 'lifecycle',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Contract or engagement start date',
  },
  contract_end: {
    key: 'contract_end',
    label: 'End Date',
    type: 'date',
    category: 'lifecycle',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Contract or engagement end date',
  },
  renewal_recommendation: {
    key: 'renewal_recommendation',
    label: 'Renewal Recommendation',
    type: 'select',
    category: 'lifecycle',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    options: ['Repeat', 'Do Not Repeat', 'Repeat w Modification', 'N/A'],
    description: 'Recommendation for renewal',
  },

  // ═══════════════════════════════════════════
  // NOTES & FREE TEXT
  // ═══════════════════════════════════════════
  notes: {
    key: 'notes',
    label: 'Notes',
    type: 'textarea',
    category: 'notes',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: false,
    description: 'General notes about this partner/prospect',
  },
  previous_year_notes: {
    key: 'previous_year_notes',
    label: 'Previous Year Notes',
    type: 'textarea',
    category: 'notes',
    required: false,
    importable: true,
    searchable: true,
    showInGrid: false,
    description: 'Notes and context from the previous year',
  },
  reason_for_decline: {
    key: 'reason_for_decline',
    label: 'Reason for Decline',
    type: 'text',
    category: 'notes',
    required: false,
    importable: true,
    searchable: false,
    showInGrid: false,
    description: 'Why partnership was declined or not pursued',
  },

  // ═══════════════════════════════════════════
  // SYSTEM (auto-calculated, not importable)
  // ═══════════════════════════════════════════
  health_score: {
    key: 'health_score',
    label: 'Health Score',
    type: 'number',
    category: 'system',
    required: false,
    importable: false,
    searchable: false,
    showInGrid: true,
    description: 'Auto-calculated partner health (0-100)',
  },
  data_completeness: {
    key: 'data_completeness',
    label: 'Data Completeness',
    type: 'number',
    category: 'system',
    required: false,
    importable: false,
    searchable: false,
    showInGrid: false,
    description: 'Auto-calculated record completeness percentage',
  },
  tags: {
    key: 'tags',
    label: 'Tags',
    type: 'tags',
    category: 'system',
    required: false,
    importable: false,
    searchable: true,
    showInGrid: true,
    description: 'User-defined tags for segmentation',
  },
};

// ═══════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════

/** Get all importable fields (for the Import Wizard field mapper) */
export const getImportableFields = () => {
  return Object.values(FIELD_DEFINITIONS).filter(f => f.importable);
};

/** Get fields by category */
export const getFieldsByCategory = (category) => {
  return Object.values(FIELD_DEFINITIONS).filter(f => f.category === category);
};

/** Get all capability fields */
export const getCapabilityFields = () => {
  return Object.values(FIELD_DEFINITIONS).filter(f => f.category === 'capabilities');
};

/** Get fields that should show in the Partner/Prospect grid */
export const getGridFields = () => {
  return Object.values(FIELD_DEFINITIONS).filter(f => f.showInGrid);
};

/** Get field definition by key */
export const getFieldDef = (key) => {
  return FIELD_DEFINITIONS[key] || null;
};

/**
 * Calculate data completeness for a record
 * Only counts importable fields (not system-calculated ones)
 */
export const calculateCompleteness = (record) => {
  const importableFields = getImportableFields();
  const total = importableFields.length;
  let filled = 0;

  importableFields.forEach(field => {
    const value = record[field.key];
    if (value !== null && value !== undefined && value !== '' && value !== false) {
      filled++;
    }
  });

  return {
    percentage: Math.round((filled / total) * 100),
    filled,
    total,
    missing: importableFields.filter(f => {
      const v = record[f.key];
      return v === null || v === undefined || v === '' || v === false;
    }).map(f => f.label),
  };
};

/**
 * Smart field mapping suggestions
 * Given a spreadsheet column header, suggests the best matching Converge field
 */
export const suggestFieldMapping = (columnHeader) => {
  if (!columnHeader) return null;
  const header = columnHeader.toLowerCase().trim().replace(/[\n\r]/g, ' ');

  const mappings = {
    'partner name': 'company_name',
    'company name': 'company_name',
    'organization name': 'company_name',
    'name': 'company_name',
    'relationship type': 'relationship_type',
    'relationship  type': 'relationship_type',
    'target tier': 'tier',
    'tier': 'tier',
    'organization type': 'organization_type',
    'org type': 'organization_type',
    'partner org type': 'organization_type',
    'market': 'market',
    'geography': 'market',
    'region': 'market',
    'sub-speciality': 'sub_specialty',
    'sub-specialty': 'sub_specialty',
    'sub speciality': 'sub_specialty',
    'specialty': 'sub_specialty',
    'membership / install-base size': 'membership_size',
    'membership size': 'membership_size',
    'install base': 'membership_size',
    'install-base size': 'membership_size',
    'co-marketing available': 'cap_co_marketing',
    'co-marketing': 'cap_co_marketing',
    'membership required': 'cap_membership_required',
    'access to memership available': 'cap_membership_available',
    'access to membership available': 'cap_membership_available',
    'digital promo available': 'cap_digital_promo',
    'digital promo': 'cap_digital_promo',
    'event marketing available': 'cap_event_marketing',
    'event marketing': 'cap_event_marketing',
    'content submission/ thought leadership': 'cap_thought_leadership',
    'content submission': 'cap_thought_leadership',
    'thought leadership': 'cap_thought_leadership',
    "lobby/gov't relations": 'cap_lobby_govt',
    'lobby': 'cap_lobby_govt',
    'govt relations': 'cap_lobby_govt',
    'access market intelligence': 'cap_market_intelligence',
    'market intelligence': 'cap_market_intelligence',
    'committee/ board seat': 'cap_board_seat',
    'committee/board seat': 'cap_board_seat',
    'committee board seat': 'cap_board_seat',
    'board seat': 'cap_board_seat',
    'partner program exists?': 'cap_partner_program',
    'partner program exists': 'cap_partner_program',
    'partner program': 'cap_partner_program',
    'reseller program exists?': 'cap_reseller_program',
    'reseller program exists': 'cap_reseller_program',
    'reseller program': 'cap_reseller_program',
    'marketplace exists?': 'cap_marketplace',
    'marketplace exists': 'cap_marketplace',
    'marketplace': 'cap_marketplace',
    'solution alignment?': 'cap_solution_alignment',
    'solution alignment': 'cap_solution_alignment',
    'available api?': 'cap_api_available',
    'available api': 'cap_api_available',
    'api available': 'cap_api_available',
    'partner address': 'partner_address',
    'address': 'partner_address',
    'partner url': 'website_url',
    'website': 'website_url',
    'website url': 'website_url',
    'url': 'website_url',
    'contact name': 'contact_name',
    'primary contact': 'contact_name',
    'contact email': 'contact_email',
    'email': 'contact_email',
    'contact li': 'contact_linkedin',
    'linkedin': 'contact_linkedin',
    'contact linkedin': 'contact_linkedin',
    'contact title': 'contact_title',
    'title': 'contact_title',
    'job title': 'contact_title',
    'contact phone': 'contact_phone',
    'phone': 'contact_phone',
    'existing partner?': 'existing_partner',
    'existing partner': 'existing_partner',
    'sponsorship usd': 'sponsorship_usd',
    'sponsorship cad': 'sponsorship_cad',
    'approval status': 'status',
    'status': 'status',
    'start date': 'contract_start',
    'contract start': 'contract_start',
    'end date': 'contract_end',
    'contract end': 'contract_end',
    'renewal reco?': 'renewal_recommendation',
    'renewal reco': 'renewal_recommendation',
    'renewal recommendation': 'renewal_recommendation',
    'previous year notes': 'previous_year_notes',
    'notes': 'notes',
    'reason for decline': 'reason_for_decline',
    'source': 'source',
    'lead source': 'source',
  };

  // Exact match first
  if (mappings[header]) return mappings[header];

  // Fuzzy match - check if header contains any key
  for (const [pattern, fieldKey] of Object.entries(mappings)) {
    if (header.includes(pattern) || pattern.includes(header)) {
      return fieldKey;
    }
  }

  return null; // No match found - user maps manually
};

/**
 * Parse a value for import based on field type
 * Handles type conversion, boolean normalization, date parsing
 */
export const parseImportValue = (value, fieldKey) => {
  if (value === null || value === undefined || value === '') return null;

  const field = FIELD_DEFINITIONS[fieldKey];
  if (!field) return value;

  switch (field.type) {
    case 'boolean': {
      const str = String(value).toLowerCase().trim();
      if (['yes', 'true', '1', 'y'].includes(str)) return true;
      if (['no', 'false', '0', 'n'].includes(str)) return false;
      return null;
    }
    case 'currency':
    case 'number': {
      const num = parseFloat(String(value).replace(/[,$]/g, ''));
      return isNaN(num) ? null : num;
    }
    case 'date': {
      if (value instanceof Date) return value.toISOString().split('T')[0];
      const str = String(value).trim();
      if (str === 'TBD' || str === 'N/A') return null;
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
    }
    case 'select': {
      const str = String(value).trim();
      // Try to match against known options
      if (field.options) {
        const match = field.options.find(
          opt => opt.toLowerCase() === str.toLowerCase()
        );
        if (match) return match;
        // If allowCustom, accept the value as-is
        if (field.allowCustom) return str;
      }
      return str;
    }
    case 'url': {
      const str = String(value).trim();
      if (str && !str.startsWith('http')) return `https://${str}`;
      return str;
    }
    default:
      return String(value).trim();
  }
};

export default FIELD_DEFINITIONS;
