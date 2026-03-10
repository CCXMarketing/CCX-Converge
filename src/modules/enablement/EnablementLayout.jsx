// =============================================================================
// src/modules/enablement/EnablementLayout.jsx
// Module 8 – Enablement: Main layout with SuccessChecklist, TierCriteria,
// and AssetLibrary
// =============================================================================

import { useState, useCallback } from 'react';
import { useEnablement } from '../../shared/hooks/useEnablement';
import SuccessChecklist from './SuccessChecklist';
import TierCriteria from './TierCriteria';
import AssetLibrary from './AssetLibrary';

const TABS = ['checklist', 'tiers', 'assets'];

const TAB_LABELS = {
  checklist: 'Success Checklist',
  tiers: 'Tier Criteria',
  assets: 'Asset Library',
};

/**
 * EnablementLayout — top-level orchestration component for the Enablement module.
 *
 * Manages active tab state and delegates data to sub-components via the
 * useEnablement hook.
 */
export default function EnablementLayout() {
  const [activeTab, setActiveTab] = useState('checklist');

  const {
    checklist,
    tiers,
    assets,
    loading,
    error,
    toggleChecklistItem,
    downloadAsset,
    refresh,
  } = useEnablement();

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleToggleTask = useCallback(
    (taskId) => {
      toggleChecklistItem(taskId);
    },
    [toggleChecklistItem],
  );

  const handleDownloadAsset = useCallback(
    (assetId) => {
      downloadAsset(assetId);
    },
    [downloadAsset],
  );

  // ── render ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#02475A' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: 'Nunito Sans, sans-serif', color: '#02475A' }}
        >
          Enablement
        </h1>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#ADC837' }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {/* ── Tabs ── */}
      <nav className="flex border-b border-gray-200 bg-white">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              activeTab === tab
                ? 'border-b-2 text-[#02475A]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={
              activeTab === tab
                ? { borderBottomColor: '#ADC837', color: '#02475A' }
                : undefined
            }
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {/* ── Loading indicator ── */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: '#ADC837', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* ── Tab content ── */}
      {!loading && (
        <div className="flex-1 overflow-auto">
          {activeTab === 'checklist' && (
            <SuccessChecklist
              items={checklist}
              onToggle={handleToggleTask}
            />
          )}
          {activeTab === 'tiers' && (
            <TierCriteria tiers={tiers} />
          )}
          {activeTab === 'assets' && (
            <AssetLibrary
              assets={assets}
              onDownload={handleDownloadAsset}
            />
          )}
        </div>
      )}
    </div>
  );
}
