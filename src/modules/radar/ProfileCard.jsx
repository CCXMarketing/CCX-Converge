import { useState, useCallback, useEffect } from 'react';
import { usePartnerHealth } from '../../shared/hooks/usePartnerHealth';
import { usePartnerActions } from '../../shared/hooks/usePartners';
import { useTags, useTagActions } from '../../shared/hooks/useTags';
import { getPartner } from '../../shared/services/partnersService';

export default function ProfileCard({ partnerId }) {
  const { healthScore, dataCompleteness, loading: healthLoading, error: healthError, refresh: refreshHealth } = usePartnerHealth(partnerId);
  const { update, archive, restore, loading: actionLoading, error: actionError } = usePartnerActions();
  const { tags, loading: tagsLoading } = useTags();
  const { addToPartner, removeFromPartner, create: createTag, loading: tagActionLoading } = useTagActions();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', region: '', tier: '', notes: '' });
  const [tagInput, setTagInput] = useState('');
  const [partnerTags, setPartnerTags] = useState([]);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [partner, setPartner] = useState(null);

  // Fetch partner data and resolve tags on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchPartner() {
      const result = await getPartner(partnerId);
      if (cancelled) return;
      if (result?.success && result.data) {
        setPartner(result.data);
        // Resolve tag IDs to tag objects
        if (result.data.tags?.length && tags.length) {
          const resolved = tags.filter((t) => result.data.tags.includes(t.id));
          setPartnerTags(resolved);
        }
      }
    }
    if (partnerId) fetchPartner();
    return () => { cancelled = true; };
  }, [partnerId, tags]);

  // Initialize form when entering edit mode
  const handleStartEdit = useCallback(() => {
    setForm({
      name: partner?.contact_name || '',
      company: partner?.company_name || '',
      email: partner?.contact_email || '',
      phone: partner?.contact_phone || '',
      region: partner?.region || '',
      tier: partner?.tier || '',
      notes: partner?.notes || '',
    });
    setEditing(true);
  }, [partner]);

  const handleCancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const handleFormChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const updates = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value && value.trim()) {
        updates[key] = value.trim();
      }
    });
    if (Object.keys(updates).length > 0) {
      const result = await update(partnerId, updates);
      if (result?.success) {
        setEditing(false);
      }
    }
  }, [form, partnerId, update]);

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

    // Check if tag already exists
    let tag = tags.find((t) => t.name?.toLowerCase() === trimmed.toLowerCase());
    if (!tag) {
      const result = await createTag({ name: trimmed });
      if (result?.success && result.data) {
        tag = result.data;
      } else {
        return;
      }
    }

    const result = await addToPartner(partnerId, tag.id);
    if (result?.success) {
      setPartnerTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  }, [tagInput, tags, createTag, addToPartner, partnerId]);

  const handleRemoveTag = useCallback(async (tagId) => {
    const result = await removeFromPartner(partnerId, tagId);
    if (result?.success) {
      setPartnerTags((prev) => prev.filter((t) => t.id !== tagId));
    }
  }, [removeFromPartner, partnerId]);

  const handleTagKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const scoreColor = (score) => {
    if (score == null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const scoreBarColor = (score) => {
    if (score == null) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const error = healthError || actionError;

  return (
    <div className="p-6 space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Health Score Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Partner Health</h3>
          <button
            type="button"
            onClick={refreshHealth}
            className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Refresh
          </button>
        </div>

        {healthLoading ? (
          <div className="flex items-center justify-center py-4 text-sm text-gray-400">Loading health data…</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Health Score */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500">Health Score</span>
                <span className={`text-2xl font-bold ${scoreColor(healthScore)}`}>
                  {healthScore != null ? healthScore : '—'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(healthScore)}`}
                  style={{ width: `${healthScore ?? 0}%` }}
                />
              </div>
            </div>

            {/* Data Completeness */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500">Data Completeness</span>
                <span className={`text-2xl font-bold ${scoreColor(dataCompleteness)}`}>
                  {dataCompleteness != null ? `${dataCompleteness}%` : '—'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(dataCompleteness)}`}
                  style={{ width: `${dataCompleteness ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Details / Edit Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Profile Details</h3>
          {!editing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={actionLoading}
                className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'company', label: 'Company', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'region', label: 'Region', type: 'text' },
              { key: 'tier', label: 'Tier', type: 'select', options: ['Gold', 'Silver', 'Bronze'] },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={form[field.key]}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select…</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={form[field.key]}
                    onChange={(e) => handleFormChange(field.key, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                )}
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Company', value: partner?.company_name },
              { label: 'Contact Name', value: partner?.contact_name },
              { label: 'Email', value: partner?.contact_email },
              { label: 'Phone', value: partner?.contact_phone },
              { label: 'Region', value: partner?.region },
              { label: 'Tier', value: partner?.tier },
              { label: 'Status', value: partner?.status },
              { label: 'Partner Type', value: partner?.partner_type },
            ].map((field) => (
              <div key={field.label}>
                <span className="block text-xs font-medium text-gray-500">{field.label}</span>
                <span className="text-sm text-gray-900">{field.value || '—'}</span>
              </div>
            ))}
            <div className="col-span-2">
              <span className="block text-xs font-medium text-gray-500">Notes</span>
              <span className="text-sm text-gray-900 whitespace-pre-wrap">{partner?.notes || '—'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Tags</h3>

        {/* Current tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {partnerTags.length === 0 && !tagsLoading && (
            <span className="text-sm text-gray-400 italic">No tags assigned.</span>
          )}
          {partnerTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                disabled={tagActionLoading}
                className="text-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                aria-label={`Remove tag ${tag.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Add tag input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={tagActionLoading || !tagInput.trim()}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {tagActionLoading ? 'Adding…' : 'Add'}
          </button>
        </div>

        {/* Tag suggestions from existing tags */}
        {tagInput.trim() && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags
              .filter(
                (t) =>
                  t.name?.toLowerCase().includes(tagInput.toLowerCase()) &&
                  !partnerTags.some((pt) => pt.id === t.id),
              )
              .slice(0, 5)
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTagInput(t.name);
                  }}
                  className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Actions</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRestore}
            disabled={actionLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Restore
          </button>

          {!showArchiveConfirm ? (
            <button
              type="button"
              onClick={() => setShowArchiveConfirm(true)}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Archive Partner
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Are you sure?</span>
              <button
                type="button"
                onClick={handleArchive}
                disabled={actionLoading}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Archiving…' : 'Yes, archive'}
              </button>
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
