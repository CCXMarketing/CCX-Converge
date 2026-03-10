// src/modules/prospects/PartnerProspectImport.jsx
// Excel import wizard: Upload → Preview → Import → Done
// Reads Tab 1 of .xlsx/.xls, transforms rows, routes to partners or prospects collection

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

// =============================================================================
// DROPDOWN DATA
// =============================================================================

const RELATIONSHIP_TYPES = [
  'Affinity Partner',
  'Affiliate Partner',
  'Channel Partner',
  'Influencer Partner',
  'Technology Partner',
  'Funding Partner',
  'Prospect',
  'N/A',
];

const TARGET_TIERS = ['High Potential', 'Medium Potential', 'Low Potential'];

const LEGACY_TIER_MAP = {
  general: 'Medium Potential',
  'hi-po': 'High Potential',
};

const ORGANIZATION_TYPES = [
  'National Association',
  'Regional Association',
  'Municipal Association',
  "Municipal Gov't",
  "Regional Gov't",
  "Federal Gov't",
  'Private/Public Insurance',
  'Educational Institution',
  'Media',
  'Analysts',
  'Lobbyist/Grassroots',
  'Financial Institution',
  'EHR/EMR',
  'Integrator/MSP',
  'Care Management Solutions',
  'Claims Management Platform',
  'eMAR',
  'Other Private Industry',
];

const MARKETS = ['Canada', 'United States'];

const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
];

const SUB_SPECIALTIES = [
  'Skilled Nursing', 'Assisted Living/Independent Living', 'CCRC', 'Payer',
  'Hospital', 'Specialist', 'Generalist', 'Family', 'General Senior Care',
  'General Ambulatory', 'General Healthcare', 'Home Care',
  'General Post-Acute Care', 'Other',
];

const YES_NO_NA = ['Yes', 'No', 'NA'];

const APPROVAL_STATUSES = ['Approved', 'Declined'];

const DECLINE_REASONS = [
  'Focus Not Aligned (theme)',
  'Incorrect Contacts (Job Roles)',
  'Previously Participated with No ROI & No Potential for ROI in Future',
  'Too expensive/Not enough value',
  'Sponsorship/Partnership not Available',
  'Will Likely not Meet Expected ROI Ratio',
  'Not Industry Aligned',
  'Not Happening this Year',
  'Competitor Event/Partner',
  'Audience is Too Large',
];

const RENEWAL_RECOMMENDATIONS = ['Repeat With Mods', 'Do Not Repeat'];

// =============================================================================
// EXCEL COLUMN HEADERS (exact, including spacing quirks)
// =============================================================================

const COL = {
  PARTNER_NAME: 'Partner Name',
  RELATIONSHIP_TYPE: 'Relationship  Type',
  TARGET_TIER: 'Target Tier',
  ORG_TYPE: 'Organization Type',
  MARKET: 'Market',
  SUB_SPECIALITY: 'Sub-Speciality',
  MEMBERSHIP_SIZE: 'Membership / Install-base Size',
  CO_MARKETING: 'Co-Marketing Available',
  MEMBERSHIP_REQUIRED: 'Membership Required',
  ACCESS_MEMBERSHIP: 'Access to Memership Available',
  DIGITAL_PROMO: 'Digital Promo Available',
  EVENT_MARKETING: 'Event Marketing Available',
  THOUGHT_LEADERSHIP: 'Content Submission/ Thought Leadership',
  LOBBY_GOVT: "Lobby/Gov't Relations",
  MARKET_INTELLIGENCE: 'Access Market Intelligence',
  BOARD_SEAT: 'Committee/\nBoard Seat',
  PARTNER_PROGRAM: 'Partner Program Exists?',
  RESELLER_PROGRAM: 'Reseller Program Exists?',
  MARKETPLACE: 'Marketplace Exists?',
  SOLUTION_ALIGNMENT: 'Solution Alignment?',
  AVAILABLE_API: 'Available API?',
  ADDRESS: 'Partner Address',
  URL: 'Partner URL',
  CONTACT_NAME: ' Contact Name',
  CONTACT_EMAIL: ' Contact Email',
  CONTACT_LI: 'Contact LI',
  CONTACT_TITLE: 'Contact Title',
  EXISTING_PARTNER: 'Existing Partner?',
  SPONSORSHIP_USD: 'Sponsorship USD',
  SPONSORSHIP_CAD: 'Sponsorship CAD',
  APPROVAL_STATUS: 'Approval Status',
  REASON_DECLINE: 'Reason for Decline',
  START_DATE: 'Start Date',
  END_DATE: 'End Date',
  RENEWAL_RECO: 'Renewal Reco?',
  PREVIOUS_NOTES: 'Previous Year Notes',
};

// =============================================================================
// FIELD MAPPING LEGEND
// =============================================================================

const FIELD_LEGEND = [
  { field: 'company_name', label: 'Partner Name', type: 'text' },
  { field: 'relationship_type', label: 'Relationship Type', type: 'dropdown' },
  { field: 'target_tier', label: 'Target Tier', type: 'dropdown' },
  { field: 'organization_type', label: 'Organization Type', type: 'dropdown' },
  { field: 'market', label: 'Market', type: 'market' },
  { field: 'market_region', label: 'Market Region', type: 'market' },
  { field: 'sub_speciality', label: 'Sub-Speciality', type: 'dropdown' },
  { field: 'sub_speciality_other', label: 'Sub-Speciality (Other)', type: 'text' },
  { field: 'membership_size', label: 'Membership / Install-base Size', type: 'text' },
  { field: 'cap_co_marketing', label: 'Co-Marketing Available', type: 'yesno' },
  { field: 'cap_membership_required', label: 'Membership Required', type: 'yesno' },
  { field: 'cap_membership_available', label: 'Access to Membership Available', type: 'yesno' },
  { field: 'cap_digital_promo', label: 'Digital Promo Available', type: 'yesno' },
  { field: 'cap_event_marketing', label: 'Event Marketing Available', type: 'yesno' },
  { field: 'cap_thought_leadership', label: 'Content Submission/Thought Leadership', type: 'yesno' },
  { field: 'cap_lobby_govt', label: "Lobby/Gov't Relations", type: 'yesno' },
  { field: 'cap_market_intelligence', label: 'Access Market Intelligence', type: 'yesno' },
  { field: 'cap_board_seat', label: 'Committee/Board Seat', type: 'yesno' },
  { field: 'cap_partner_program', label: 'Partner Program Exists?', type: 'yesno' },
  { field: 'cap_reseller_program', label: 'Reseller Program Exists?', type: 'yesno' },
  { field: 'cap_marketplace', label: 'Marketplace Exists?', type: 'yesno' },
  { field: 'cap_solution_alignment', label: 'Solution Alignment?', type: 'yesno' },
  { field: 'cap_api_available', label: 'Available API?', type: 'yesno' },
  { field: 'partner_address', label: 'Partner Address', type: 'text' },
  { field: 'partner_url', label: 'Partner URL', type: 'text' },
  { field: 'primary_contact.name', label: 'Contact Name', type: 'text' },
  { field: 'primary_contact.email', label: 'Contact Email', type: 'text' },
  { field: 'primary_contact.linkedin', label: 'Contact LinkedIn', type: 'text' },
  { field: 'primary_contact.title', label: 'Contact Title', type: 'text' },
  { field: 'existing_partner', label: 'Existing Partner?', type: 'yesno' },
  { field: 'sponsorship_usd', label: 'Sponsorship USD', type: 'text' },
  { field: 'sponsorship_cad', label: 'Sponsorship CAD', type: 'text' },
  { field: 'approval_status', label: 'Approval Status', type: 'dropdown' },
  { field: 'reason_for_decline', label: 'Reason for Decline', type: 'dropdown' },
  { field: 'contract_start', label: 'Start Date', type: 'date' },
  { field: 'contract_end', label: 'End Date', type: 'date' },
  { field: 'renewal_recommendation', label: 'Renewal Reco?', type: 'dropdown' },
  { field: 'previous_year_notes', label: 'Previous Year Notes', type: 'text' },
];

const TYPE_COLORS = {
  dropdown: 'bg-purple-400',
  yesno: 'bg-blue-400',
  date: 'bg-orange-400',
  market: 'bg-green-400',
  text: 'bg-gray-400',
};

// =============================================================================
// TRANSFORM HELPERS
// =============================================================================

function get(row, header) {
  const raw = row[header];
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === '' || s.toLowerCase() === 'nan') return null;
  return s;
}

function yn(row, header) {
  const raw = get(row, header);
  if (!raw) return 'NA';
  const lower = raw.toLowerCase();
  if (lower === 'yes' || lower === 'y' || lower === 'true' || lower === '1') return 'Yes';
  if (lower === 'no' || lower === 'n' || lower === 'false' || lower === '0') return 'No';
  return 'NA';
}

function dd(row, header, options) {
  const raw = get(row, header);
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const match = options.find((o) => o.toLowerCase() === lower);
  return match || raw;
}

function parseDate(row, header) {
  const raw = row[header];
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${day}`;
}

function parseNumber(row, header) {
  const raw = get(row, header);
  if (!raw) return null;
  const n = parseFloat(raw.replace(/[,$]/g, ''));
  return isNaN(n) ? null : n;
}

// =============================================================================
// TRANSFORM ROW
// =============================================================================

function transformRow(row) {
  const companyName = get(row, COL.PARTNER_NAME);
  if (!companyName) return null;

  // Tier with legacy mapping
  let tier = dd(row, COL.TARGET_TIER, TARGET_TIERS);
  if (tier) {
    const legacyMatch = LEGACY_TIER_MAP[tier.toLowerCase()];
    if (legacyMatch) tier = legacyMatch;
  }

  // Market: split "Canada - BC" on " - "
  const rawMarket = get(row, COL.MARKET);
  let market = null;
  let marketRegion = null;
  if (rawMarket) {
    const parts = rawMarket.split(' - ');
    market = parts[0]?.trim() || null;
    marketRegion = parts[1]?.trim() || null;
    // Normalize market name
    if (market) {
      const marketMatch = MARKETS.find((m) => m.toLowerCase() === market.toLowerCase());
      if (marketMatch) market = marketMatch;
    }
  }

  // Sub-specialty
  const rawSubSpec = get(row, COL.SUB_SPECIALITY);
  let subSpeciality = null;
  let subSpecialityOther = null;
  if (rawSubSpec) {
    const match = SUB_SPECIALTIES.find((s) => s.toLowerCase() === rawSubSpec.toLowerCase());
    if (match) {
      subSpeciality = match;
    } else {
      subSpeciality = 'Other';
      subSpecialityOther = rawSubSpec;
    }
  }

  // Existing partner routing
  const existingPartner = yn(row, COL.EXISTING_PARTNER);
  const isPartner = existingPartner === 'Yes';

  // Build base record
  const record = {
    company_name: companyName,
    relationship_type: dd(row, COL.RELATIONSHIP_TYPE, RELATIONSHIP_TYPES),
    target_tier: tier,
    organization_type: dd(row, COL.ORG_TYPE, ORGANIZATION_TYPES),
    market,
    market_region: marketRegion,
    sub_speciality: subSpeciality,
    sub_speciality_other: subSpecialityOther,
    membership_size: get(row, COL.MEMBERSHIP_SIZE),
    cap_co_marketing: yn(row, COL.CO_MARKETING),
    cap_membership_required: yn(row, COL.MEMBERSHIP_REQUIRED),
    cap_membership_available: yn(row, COL.ACCESS_MEMBERSHIP),
    cap_digital_promo: yn(row, COL.DIGITAL_PROMO),
    cap_event_marketing: yn(row, COL.EVENT_MARKETING),
    cap_thought_leadership: yn(row, COL.THOUGHT_LEADERSHIP),
    cap_lobby_govt: yn(row, COL.LOBBY_GOVT),
    cap_market_intelligence: yn(row, COL.MARKET_INTELLIGENCE),
    cap_board_seat: yn(row, COL.BOARD_SEAT),
    cap_partner_program: yn(row, COL.PARTNER_PROGRAM),
    cap_reseller_program: yn(row, COL.RESELLER_PROGRAM),
    cap_marketplace: yn(row, COL.MARKETPLACE),
    cap_solution_alignment: yn(row, COL.SOLUTION_ALIGNMENT),
    cap_api_available: yn(row, COL.AVAILABLE_API),
    partner_address: get(row, COL.ADDRESS),
    partner_url: get(row, COL.URL),
    primary_contact: {
      name: get(row, COL.CONTACT_NAME),
      email: get(row, COL.CONTACT_EMAIL),
      linkedin: get(row, COL.CONTACT_LI),
      title: get(row, COL.CONTACT_TITLE),
    },
    existing_partner: existingPartner,
    sponsorship_usd: parseNumber(row, COL.SPONSORSHIP_USD),
    sponsorship_cad: parseNumber(row, COL.SPONSORSHIP_CAD),
    approval_status: dd(row, COL.APPROVAL_STATUS, APPROVAL_STATUSES),
    reason_for_decline: dd(row, COL.REASON_DECLINE, DECLINE_REASONS),
    contract_start: parseDate(row, COL.START_DATE),
    contract_end: parseDate(row, COL.END_DATE),
    renewal_recommendation: dd(row, COL.RENEWAL_RECO, RENEWAL_RECOMMENDATIONS),
    previous_year_notes: get(row, COL.PREVIOUS_NOTES),
    tags: [
      dd(row, COL.RELATIONSHIP_TYPE, RELATIONSHIP_TYPES),
      market,
      subSpeciality,
    ].filter(Boolean),
    source: 'Import',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  // Collection-specific fields
  if (isPartner) {
    record.collection = 'partners';
    record.status = 'Active';
    record.notes_log = record.previous_year_notes
      ? [{ text: record.previous_year_notes, date: new Date().toISOString(), source: 'Import' }]
      : [];
    record.health_score = 0;
    record.data_completeness = 0;
  } else {
    record.collection = 'prospects';
    record.pipeline_stage = 'New';
    record.competitor_flag = 'Unassessed';
    record.notes = record.previous_year_notes
      ? [{ text: record.previous_year_notes, date: new Date().toISOString(), source: 'Import' }]
      : [];
  }

  return record;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function PartnerProspectImport({ onClose }) {
  const [step, setStep] = useState('upload');
  const [rows, setRows] = useState([]);
  const [preview, setPreview] = useState([]);
  const [stats, setStats] = useState({ partners: 0, prospects: 0, total: 0 });
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // ── FILE PARSING ──────────────────────────────────────────────────────────

  const parseFile = useCallback((file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

      // Filter empty Partner Name rows, then transform
      const transformed = json
        .filter((row) => {
          const name = row[COL.PARTNER_NAME];
          return name && String(name).trim() !== '';
        })
        .map(transformRow)
        .filter(Boolean);

      const partnerCount = transformed.filter((r) => r.collection === 'partners').length;
      const prospectCount = transformed.filter((r) => r.collection === 'prospects').length;

      setRows(transformed);
      setPreview(transformed.slice(0, 5));
      setStats({ partners: partnerCount, prospects: prospectCount, total: transformed.length });
      setStep('preview');
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  const handleBrowse = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  // ── IMPORT ────────────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    setStep('importing');
    setProgress(0);

    let success = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const collectionName = row.collection;
        // Remove the routing key before saving
        const doc = { ...row };
        delete doc.collection;

        await addDoc(collection(db, collectionName), doc);
        success++;
      } catch (err) {
        errors.push({ row: i + 2, company: row.company_name, message: err.message });
      }

      // Update progress every row
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }

    setResults({ success, errors });
    setStep('done');
  }, [rows]);

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && step !== 'importing' && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl font-['Nunito_Sans',sans-serif]">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-[#02475A]">Import Partners & Prospects</h2>
          {step !== 'importing' && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ──────────── STEP 1: UPLOAD ──────────── */}
          {step === 'upload' && (
            <div className="space-y-5">
              {/* Drop zone */}
              <div
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-[#ADC837] bg-[#ADC837]/5'
                    : 'border-gray-300 hover:border-[#02475A]/40'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('ppi-file-input').click()}
              >
                <div className="text-4xl mb-3">📁</div>
                <p className="text-gray-700 font-semibold mb-1">Drag & drop your Excel file here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
                <button
                  type="button"
                  className="mt-4 rounded-lg bg-[#02475A] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#02475A]/90"
                  onClick={(e) => { e.stopPropagation(); document.getElementById('ppi-file-input').click(); }}
                >
                  Browse File
                </button>
                <input
                  id="ppi-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleBrowse}
                  className="hidden"
                />
              </div>

              {/* Info box */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 space-y-1.5">
                <p className="font-semibold">How it works</p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-blue-700">
                  <li><strong>Existing Partner = Yes</strong> → saved to the <span className="font-semibold text-[#02475A]">partners</span> collection</li>
                  <li>All others → saved to the <span className="font-semibold text-[#ADC837]">prospects</span> collection</li>
                  <li>36 fields mapped automatically from Excel columns</li>
                  <li>Only <strong>Tab 1</strong> of the workbook is read</li>
                  <li>Old tier labels auto-converted: "General" → Medium Potential, "Hi-Po" → High Potential</li>
                </ul>
              </div>
            </div>
          )}

          {/* ──────────── STEP 2: PREVIEW ──────────── */}
          {step === 'preview' && (
            <div className="space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-gray-100 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
                  <div className="text-xs font-medium text-gray-500">Total Records</div>
                </div>
                <div className="rounded-lg bg-[#02475A]/10 p-4 text-center">
                  <div className="text-2xl font-bold text-[#02475A]">{stats.partners}</div>
                  <div className="text-xs font-medium text-[#02475A]/70">Partners</div>
                </div>
                <div className="rounded-lg bg-[#ADC837]/10 p-4 text-center">
                  <div className="text-2xl font-bold text-[#ADC837]">{stats.prospects}</div>
                  <div className="text-xs font-medium text-[#ADC837]/70">Prospects</div>
                </div>
              </div>

              {/* Field mapping legend */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Field Mapping ({FIELD_LEGEND.length} fields)
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {FIELD_LEGEND.map((f) => (
                    <div key={f.field} className="flex items-center gap-2 py-0.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[f.type]}`} />
                      <span className="text-xs text-gray-600 truncate">{f.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  {Object.entries(TYPE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-[10px] text-gray-400 capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview records */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Preview (first {preview.length} records)
                </h4>
                <div className="space-y-3">
                  {preview.map((rec, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            rec.collection === 'partners'
                              ? 'bg-[#02475A] text-white'
                              : 'bg-[#ADC837] text-white'
                          }`}
                        >
                          {rec.collection === 'partners' ? 'Partner' : 'Prospect'}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{rec.company_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
                        <div className="text-gray-500">
                          Relationship: <span className="text-gray-700">{rec.relationship_type || '—'}</span>
                        </div>
                        <div className="text-gray-500">
                          Tier: <span className="text-gray-700">{rec.target_tier || '—'}</span>
                        </div>
                        <div className="text-gray-500">
                          Market: <span className="text-gray-700">{[rec.market, rec.market_region].filter(Boolean).join(' — ') || '—'}</span>
                        </div>
                        <div className="text-gray-500">
                          Contact: <span className="text-gray-700">{rec.primary_contact?.name || '—'}</span>
                        </div>
                        <div className="text-gray-500">
                          Email: <span className="text-gray-700">{rec.primary_contact?.email || '—'}</span>
                        </div>
                        <div className="text-gray-500">
                          Title: <span className="text-gray-700">{rec.primary_contact?.title || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──────────── STEP 3: IMPORTING ──────────── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-4">⏳</div>
              <p className="text-xl font-bold text-[#02475A] mb-2">{progress}%</p>
              <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#02475A] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">Please don't close this window</p>
            </div>
          )}

          {/* ──────────── STEP 4: DONE ──────────── */}
          {step === 'done' && results && (
            <div className="space-y-5">
              <div className="text-center py-4">
                <div className="text-5xl mb-3">
                  {results.errors.length === 0 ? '✅' : '⚠️'}
                </div>
                <h3 className="text-xl font-bold text-[#02475A]">Import Complete</h3>
              </div>

              {/* Result stat cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{results.success}</div>
                  <div className="text-xs font-medium text-green-600">Successfully Imported</div>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{results.errors.length}</div>
                  <div className="text-xs font-medium text-red-600">Errors</div>
                </div>
              </div>

              {/* Error list */}
              {results.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Errors</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {results.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">
                        Row {err.row} ({err.company}): {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => { setStep('upload'); setRows([]); setPreview([]); }}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center gap-2 rounded-lg bg-[#ADC837] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#9AB52F] active:bg-[#8AA228]"
              >
                Import {stats.total} Records
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#02475A] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#02475A]/90"
            >
              Done — View in Radar / Prospects
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
