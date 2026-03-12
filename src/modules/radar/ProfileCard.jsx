import { useState, useCallback, useEffect } from 'react';
import { usePartnerHealth } from '../../shared/hooks/usePartnerHealth';
import { usePartnerActions } from '../../shared/hooks/usePartners';
import { useTags, useTagActions } from '../../shared/hooks/useTags';
import { getPartner } from '../../shared/services/partnersService';
import { FIELD_DEFINITIONS, getCapabilityFields } from '../../config/fieldDefinitions';

// ---------------------------------------------------------------------------
//  Section field groupings
// ---------------------------------------------------------------------------
const PARTNERSHIP_FIELDS = [
  'company_name', 'website_url', 'partner_address', 'relationship_type',
  'organization_type', 'sub_specialty', 'market', 'membership_size',
  'tier', 'status', 'source', 'pipeline_stage',
];
const CONTACT_FIELDS = [
  'contact_name', 'contact_title', 'contact_email', 'contact_phone', 'contact_linkedin',
];
const CAP_FIELDS = getCapabilityFields().map(f => f.key);
const FINANCIAL_FIELDS = ['sponsorship_usd', 'sponsorship_cad'];
const LIFECYCLE_FIELDS = [
  'contract_start', 'contract_end', 'renewal_recommendation', 'existing_partner', 'pipeline_stage',
];
const NOTES_FIELDS = ['notes', 'previous_year_notes', 'reason_for_decline'];

const ALL_EDITABLE_KEYS = [
  ...new Set([
    ...PARTNERSHIP_FIELDS, ...CONTACT_FIELDS, ...CAP_FIELDS,
    ...FINANCIAL_FIELDS, ...LIFECYCLE_FIELDS, ...NOTES_FIELDS,
  ]),
];

// ---------------------------------------------------------------------------
//  Brand colours
// ---------------------------------------------------------------------------
const BRAND = { lime: '#ADC837', teal: '#02475A', charcoal: '#404041' };

// ---------------------------------------------------------------------------
//  Formatting helpers
// ---------------------------------------------------------------------------
function fmtCurrency(val) {
  if (val == null || val === '') return '—';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '—';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
//  Shared CSS
// ---------------------------------------------------------------------------
const INPUT_CLS =
  'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:border-[#02475A] focus:ring-1 focus:ring-[#02475A]';
const LABEL_CLS = 'block text-xs font-medium text-gray-500 mb-1';

// ===========================================================================
//  Component
// ===========================================================================
export default function ProfileCard({ partnerId }) {
  const {
    healthScore, dataCompleteness,
    loading: healthLoading, error: healthError, refresh: refreshHealth,
  } = usePartnerHealth(partnerId);
  const { update, archive, restore, loading: actionLoading, error: actionError } = usePartnerActions();
  const { tags, loading: tagsLoading } = useTags();
  const { addToPartner, removeFromPartner, create: createTag, loading: tagActionLoading } = useTagActions();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [partnerTags, setPartnerTags] = useState([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [partner, setPartner] = useState(null);

  // ── Fetch partner data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchPartner() {
      const result = await getPartner(partnerId);
      if (cancelled) return;
      if (result?.success && result.data) {
        setPartner(result.data);
        if (result.data.tags?.length && tags.length) {
          setPartnerTags(tags.filter(t => result.data.tags.includes(t.id)));
        }
      }
    }
    if (partnerId) fetchPartner();
    return () => { cancelled = true; };
  }, [partnerId, tags]);

  // ── Edit lifecycle ──────────────────────────────────────────────────────
  const handleStartEdit = useCallback(() => {
    const initial = {};
    ALL_EDITABLE_KEYS.forEach(key => {
      const def = FIELD_DEFINITIONS[key];
      const val = partner?.[key];
      if (def?.type === 'boolean') {
        initial[key] = !!val;
      } else if (def?.type === 'currency' || def?.type === 'number') {
        initial[key] = val ?? '';
      } else {
        initial[key] = val ?? '';
      }
    });
    setForm(initial);
    setEditing(true);
  }, [partner]);

  const handleCancelEdit = useCallback(() => setEditing(false), []);

  const handleFormChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const updates = {};
    ALL_EDITABLE_KEYS.forEach(key => {
      const def = FIELD_DEFINITIONS[key];
      const val = form[key];
      if (def?.type === 'boolean') {
        updates[key] = !!val;
      } else if (def?.type === 'currency' || def?.type === 'number') {
        updates[key] = val === '' || val == null ? null : Number(val);
      } else {
        updates[key] = typeof val === 'string' ? val.trim() : (val ?? '');
      }
    });
    const result = await update(partnerId, updates);
    if (result?.success) {
      setPartner(prev => ({ ...prev, ...updates }));
      setEditing(false);
    }
  }, [form, partnerId, update]);

  // ── Tag handlers ────────────────────────────────────────────────────────
  const handleArchive = useCallback(async () => {
    await archive(partnerId);
    setShowArchiveConfirm(false);
  }, [archive, partnerId]);

  const handleRestore = useCallback(async () => {
    await restore(partnerId);
  }, [restore, partnerId]);

  const handleAddTag = useCallback(async () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    let tag = tags.find(t => t.name?.toLowerCase() === trimmed.toLowerCase());
    if (!tag) {
      const result = await createTag({ name: trimmed });
      if (result?.success && result.data) tag = result.data;
      else return;
    }
    const result = await addToPartner(partnerId, tag.id);
    if (result?.success) {
      setPartnerTags(prev => [...prev, tag]);
      setTagInput('');
    }
  }, [tagInput, tags, createTag, addToPartner, partnerId]);

  const handleRemoveTag = useCallback(async (tagId) => {
    const result = await removeFromPartner(partnerId, tagId);
    if (result?.success) setPartnerTags(prev => prev.filter(t => t.id !== tagId));
  }, [removeFromPartner, partnerId]);

  const handleTagKeyDown = useCallback(e => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
  }, [handleAddTag]);

  // ── Score colours ───────────────────────────────────────────────────────
  const scoreColor = s =>
    s == null ? 'text-gray-400' : s >= 80 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-600';
  const scoreBarColor = s =>
    s == null ? 'bg-gray-200' : s >= 80 ? 'bg-green-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  // ── Render helpers ──────────────────────────────────────────────────────
  const renderViewField = (key) => {
    const def = FIELD_DEFINITIONS[key] || {};
    const val = partner?.[key];
    const isWide = def.type === 'textarea';

    let display;
    if (def.type === 'url' && val) {
      display = (
        <a href={val} target="_blank" rel="noopener noreferrer"
          className="text-sm hover:underline break-all" style={{ color: BRAND.teal }}>
          {val}
        </a>
      );
    } else if (def.type === 'currency') {
      display = fmtCurrency(val);
    } else if (def.type === 'date') {
      display = fmtDate(val);
    } else if (def.type === 'boolean') {
      display = val ? '✓ Yes' : '✗ No';
    } else {
      display = val || '—';
    }

    return (
      <div key={key} className={isWide ? 'col-span-2' : ''}>
        <span className="block text-xs font-medium text-gray-500">{def.label || key}</span>
        {typeof display === 'string' ? (
          <span className={`text-sm ${isWide ? 'whitespace-pre-wrap' : ''}`} style={{ color: BRAND.charcoal }}>
            {display}
          </span>
        ) : display}
      </div>
    );
  };

  const renderEditField = (key) => {
    const def = FIELD_DEFINITIONS[key] || {};
    const val = form[key];
    const label = def.label || key;

    if (def.type === 'textarea') {
      return (
        <div key={key} className="col-span-2">
          <label className={LABEL_CLS}>{label}</label>
          <textarea rows={3} value={val || ''}
            onChange={e => handleFormChange(key, e.target.value)} className={INPUT_CLS} />
        </div>
      );
    }
    if (def.type === 'select') {
      return (
        <div key={key}>
          <label className={LABEL_CLS}>{label}</label>
          <select value={val || ''} onChange={e => handleFormChange(key, e.target.value)} className={INPUT_CLS}>
            <option value="">Select…</option>
            {def.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }
    if (def.type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between py-1">
          <span className="text-sm" style={{ color: BRAND.charcoal }}>{label}</span>
          <button type="button" onClick={() => handleFormChange(key, !val)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${!val ? 'bg-gray-300' : ''}`}
            style={val ? { backgroundColor: BRAND.teal } : undefined}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${val ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
      );
    }
    if (def.type === 'currency' || def.type === 'number') {
      return (
        <div key={key}>
          <label className={LABEL_CLS}>{label}</label>
          <input type="number" step={def.type === 'currency' ? '0.01' : '1'}
            value={val ?? ''} onChange={e => handleFormChange(key, e.target.value)} className={INPUT_CLS} />
        </div>
      );
    }
    if (def.type === 'date') {
      return (
        <div key={key}>
          <label className={LABEL_CLS}>{label}</label>
          <input type="date" value={val || ''}
            onChange={e => handleFormChange(key, e.target.value)} className={INPUT_CLS} />
        </div>
      );
    }
    const inputType = def.type === 'url' ? 'url' : def.type === 'email' ? 'email' : 'text';
    return (
      <div key={key}>
        <label className={LABEL_CLS}>{label}</label>
        <input type={inputType} value={val || ''}
          onChange={e => handleFormChange(key, e.target.value)} className={INPUT_CLS} />
      </div>
    );
  };

  const error = healthError || actionError;

  // =====================================================================
  //  JSX
  // =====================================================================
  return (
    <div className="p-6 space-y-6">
      {/* ── Error banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Health Score ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: BRAND.teal }}>
            Partner Health
          </h3>
          <button type="button" onClick={refreshHealth}
            className="text-xs hover:underline" style={{ color: BRAND.teal }}>
            Refresh
          </button>
        </div>

        {healthLoading ? (
          <div className="flex items-center justify-center py-4 text-sm text-gray-400">Loading health data…</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Health Score', value: healthScore, fmt: v => v != null ? v : '—' },
              { label: 'Data Completeness', value: dataCompleteness, fmt: v => v != null ? `${v}%` : '—' },
            ].map(({ label, value, fmt }) => (
              <div key={label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                  <span className={`text-2xl font-bold ${scoreColor(value)}`}>{fmt(value)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(value)}`}
                    style={{ width: `${value ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit / Save controls ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ color: BRAND.charcoal }}>Profile Details</h2>
        {!editing ? (
          <button type="button" onClick={handleStartEdit}
            className="rounded-md px-4 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: BRAND.teal }}>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCancelEdit}
              className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="button" onClick={handleSave} disabled={actionLoading}
              className="rounded-md px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
              style={{ backgroundColor: BRAND.lime, color: BRAND.charcoal }}>
              {actionLoading ? 'Saving…' : 'Save All'}
            </button>
          </div>
        )}
      </div>

      {/* ── Partnership Details ───────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Partnership Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {editing ? PARTNERSHIP_FIELDS.map(renderEditField) : PARTNERSHIP_FIELDS.map(renderViewField)}
        </div>
      </div>

      {/* ── Contact Information ───────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {editing ? CONTACT_FIELDS.map(renderEditField) : CONTACT_FIELDS.map(renderViewField)}
        </div>
      </div>

      {/* ── Capabilities Matrix ──────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Capabilities Matrix</h3>
        {editing ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {CAP_FIELDS.map(renderEditField)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {CAP_FIELDS.map(key => {
              const def = FIELD_DEFINITIONS[key];
              const val = partner?.[key];
              return (
                <div key={key} className="flex items-center gap-2 py-1">
                  <span className="text-base font-bold"
                    style={{ color: val ? BRAND.teal : '#9CA3AF' }}>
                    {val ? '✓' : '✗'}
                  </span>
                  <span className="text-sm"
                    style={{ color: val ? BRAND.charcoal : '#9CA3AF' }}>
                    {def?.label || key}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Financial ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Financial</h3>
        <div className="grid grid-cols-2 gap-4">
          {editing ? FINANCIAL_FIELDS.map(renderEditField) : FINANCIAL_FIELDS.map(renderViewField)}
        </div>
      </div>

      {/* ── Lifecycle ────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Lifecycle</h3>
        <div className="grid grid-cols-2 gap-4">
          {editing ? LIFECYCLE_FIELDS.map(renderEditField) : LIFECYCLE_FIELDS.map(renderViewField)}
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Notes</h3>
        <div className="grid grid-cols-2 gap-4">
          {editing ? NOTES_FIELDS.map(renderEditField) : NOTES_FIELDS.map(renderViewField)}
        </div>
      </div>

      {/* ── Tags ─────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Tags</h3>

        <div className="flex flex-wrap gap-2 mb-3">
          {partnerTags.length === 0 && !tagsLoading && (
            <span className="text-sm text-gray-400 italic">No tags assigned.</span>
          )}
          {partnerTags.map(tag => (
            <span key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: BRAND.teal }}>
              {tag.name}
              <button type="button" onClick={() => handleRemoveTag(tag.id)}
                disabled={tagActionLoading}
                className="opacity-70 hover:opacity-100 transition-opacity disabled:opacity-50"
                aria-label={`Remove tag ${tag.name}`}>
                ✕
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input type="text" placeholder="Add tag…" value={tagInput}
            onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
            className={`flex-1 ${INPUT_CLS}`} />
          <button type="button" onClick={handleAddTag}
            disabled={tagActionLoading || !tagInput.trim()}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: BRAND.teal }}>
            {tagActionLoading ? 'Adding…' : 'Add'}
          </button>
        </div>

        {tagInput.trim() && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags
              .filter(t =>
                t.name?.toLowerCase().includes(tagInput.toLowerCase()) &&
                !partnerTags.some(pt => pt.id === t.id))
              .slice(0, 5)
              .map(t => (
                <button key={t.id} type="button" onClick={() => setTagInput(t.name)}
                  className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                  {t.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: BRAND.teal }}>Actions</h3>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleRestore} disabled={actionLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Restore
          </button>

          {!showArchiveConfirm ? (
            <button type="button" onClick={() => setShowArchiveConfirm(true)}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Archive Partner
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Are you sure?</span>
              <button type="button" onClick={handleArchive} disabled={actionLoading}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {actionLoading ? 'Archiving…' : 'Yes, archive'}
              </button>
              <button type="button" onClick={() => setShowArchiveConfirm(false)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
