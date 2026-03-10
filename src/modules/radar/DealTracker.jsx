import { useState, useCallback, useMemo } from 'react';
import { useDeals, useDealActions } from '../../shared/hooks/useDeals';

const STAGE_OPTIONS = ['All', 'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
const STAGE_FLOW = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'];
const STAGE_LABELS = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};
const PAGE_SIZE = 10;

export default function DealTracker({ partnerId }) {
  const [stageFilter, setStageFilter] = useState('All');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm, setRegForm] = useState({ productName: '', value: '', notes: '' });
  const [conflictWarning, setConflictWarning] = useState(null);
  const [regError, setRegError] = useState(null);

  const options = useMemo(() => {
    const opts = { limit };
    if (stageFilter !== 'All') opts.stage = stageFilter;
    return opts;
  }, [stageFilter, limit]);

  const { deals, loading, error, refresh } = useDeals(partnerId, options);
  const { register, updateStage, checkConflict, loading: actionLoading, error: actionError } = useDealActions();

  const handleStageFilterChange = useCallback((e) => {
    setStageFilter(e.target.value);
    setLimit(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + PAGE_SIZE);
  }, []);

  const handleRegFormChange = useCallback((field, value) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'productName') {
      setConflictWarning(null);
    }
  }, []);

  const handleCheckConflict = useCallback(async () => {
    if (!regForm.productName.trim()) return;
    const result = await checkConflict(partnerId, regForm.productName.trim());
    if (result?.success && result.data?.has_conflict) {
      setConflictWarning(result.data.message || 'A deal with this product already exists for this partner.');
    } else {
      setConflictWarning(null);
    }
  }, [regForm.productName, partnerId, checkConflict]);

  const handleRegister = useCallback(async () => {
    setRegError(null);

    if (!regForm.productName.trim()) {
      setRegError('Product name is required.');
      return;
    }

    const dealData = {
      partner_id: partnerId,
      deal_name: regForm.productName.trim(),
      description: regForm.notes.trim() || undefined,
    };

    if (regForm.value.trim()) {
      const numVal = parseFloat(regForm.value);
      if (!isNaN(numVal) && numVal > 0) {
        dealData.value = numVal;
      }
    }

    const result = await register(dealData);
    if (result?.success) {
      setRegForm({ productName: '', value: '', notes: '' });
      setShowRegForm(false);
      setConflictWarning(null);
      refresh();
    } else {
      setRegError(result?.error || 'Failed to register deal.');
    }
  }, [regForm, partnerId, register, refresh]);

  const handleAdvanceStage = useCallback(
    async (dealId, currentStage) => {
      const idx = STAGE_FLOW.indexOf(currentStage);
      if (idx < 0 || idx >= STAGE_FLOW.length - 1) return;
      const nextStage = STAGE_FLOW[idx + 1];
      const result = await updateStage(dealId, nextStage);
      if (result?.success) {
        refresh();
      }
    },
    [updateStage, refresh],
  );

  const handleMarkLost = useCallback(
    async (dealId) => {
      const result = await updateStage(dealId, 'closed_lost');
      if (result?.success) {
        refresh();
      }
    },
    [updateStage, refresh],
  );

  const stageBadgeColor = (stage) => {
    switch (stage) {
      case 'prospecting':
        return 'bg-gray-100 text-gray-800';
      case 'qualification':
        return 'bg-blue-100 text-blue-800';
      case 'proposal':
        return 'bg-indigo-100 text-indigo-800';
      case 'negotiation':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed_won':
        return 'bg-green-100 text-green-800';
      case 'closed_lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const canAdvance = (stage) => {
    const idx = STAGE_FLOW.indexOf(stage);
    return idx >= 0 && idx < STAGE_FLOW.length - 1;
  };

  const isClosed = (stage) => stage === 'closed_won' || stage === 'closed_lost';

  const formatCurrency = (val) => {
    if (val == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
  };

  const displayError = error || actionError;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Deal Tracker</h3>
        <div className="flex items-center gap-3">
          <select
            value={stageFilter}
            onChange={handleStageFilterChange}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {STAGE_LABELS[opt] || opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowRegForm((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Register Deal
          </button>
          <button
            type="button"
            onClick={refresh}
            className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Errors */}
      {displayError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{displayError}</div>
      )}

      {/* Registration Form */}
      {showRegForm && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Register New Deal</h4>

          {regError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{regError}</div>
          )}
          {conflictWarning && (
            <div className="rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-700">{conflictWarning}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Product Name *</label>
              <input
                type="text"
                value={regForm.productName}
                onChange={(e) => handleRegFormChange('productName', e.target.value)}
                onBlur={handleCheckConflict}
                placeholder="Enter product name…"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Value ($)</label>
              <input
                type="number"
                value={regForm.value}
                onChange={(e) => handleRegFormChange('value', e.target.value)}
                placeholder="0"
                min="0"
                step="any"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                rows={2}
                value={regForm.notes}
                onChange={(e) => handleRegFormChange('notes', e.target.value)}
                placeholder="Additional details…"
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowRegForm(false);
                setRegForm({ productName: '', value: '', notes: '' });
                setConflictWarning(null);
                setRegError(null);
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRegister}
              disabled={actionLoading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Registering…' : 'Register Deal'}
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && deals.length === 0 && (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400">Loading deals…</div>
      )}

      {/* Empty state */}
      {!loading && deals.length === 0 && (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400 italic">
          No deals registered yet.
        </div>
      )}

      {/* Deal list */}
      {deals.length > 0 && (
        <div className="space-y-3">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {deal.deal_name || 'Untitled Deal'}
                  </h4>
                  {deal.value != null && (
                    <span className="text-sm font-medium text-gray-600">
                      {formatCurrency(deal.value)}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadgeColor(
                    deal.stage,
                  )}`}
                >
                  {STAGE_LABELS[deal.stage] || deal.stage || 'Unknown'}
                </span>
              </div>

              {deal.notes && (
                <p className="text-sm text-gray-500 mb-3">{deal.notes}</p>
              )}

              {/* Stage progression actions */}
              {!isClosed(deal.stage) && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {canAdvance(deal.stage) && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage(deal.id, deal.stage)}
                      disabled={actionLoading}
                      className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading
                        ? 'Updating…'
                        : `Advance to ${STAGE_LABELS[STAGE_FLOW[STAGE_FLOW.indexOf(deal.stage) + 1]]}`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMarkLost(deal.id)}
                    disabled={actionLoading}
                    className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Mark Lost
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {deals.length >= limit && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
