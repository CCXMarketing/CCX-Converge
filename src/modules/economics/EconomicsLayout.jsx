// =============================================================================
// src/modules/economics/EconomicsLayout.jsx
// Module 9 – Economics: Main layout with CommissionLedger, MDFTracker,
// PayoutStatus, and RevenueAttribution
// =============================================================================

import { useState, useCallback } from 'react';
import { useEconomics } from '../../shared/hooks/useEconomics';
import CommissionLedger from './CommissionLedger';
import MDFTracker from './MDFTracker';
import PayoutStatus from './PayoutStatus';
import RevenueAttribution from './RevenueAttribution';

const TABS = ['commissions', 'mdf', 'payouts', 'revenue'];

const TAB_LABELS = {
  commissions: 'Commissions',
  mdf: 'MDF Tracker',
  payouts: 'Payout Status',
  revenue: 'Revenue Attribution',
};

/**
 * EconomicsLayout — top-level orchestration component for the Economics module.
 *
 * Manages active tab state and delegates data to sub-components via the
 * useEconomics hook.
 */
export default function EconomicsLayout() {
  const [activeTab, setActiveTab] = useState('commissions');

  const {
    commissions,
    mdf,
    payouts,
    revenue,
    loading,
    error,
    refresh,
  } = useEconomics();

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleExportCommissions = useCallback(() => {
    // placeholder — delegate to hook when export is wired
  }, []);

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
          Economics
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
          {activeTab === 'commissions' && (
            <CommissionLedger
              commissions={commissions}
              onExport={handleExportCommissions}
            />
          )}
          {activeTab === 'mdf' && (
            <MDFTracker mdf={mdf} />
          )}
          {activeTab === 'payouts' && (
            <PayoutStatus payouts={payouts} />
          )}
          {activeTab === 'revenue' && (
            <RevenueAttribution revenue={revenue} />
          )}
        </div>
      )}
    </div>
  );
}
