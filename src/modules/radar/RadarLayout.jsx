// =============================================================================
// src/modules/radar/RadarLayout.jsx
// Module 2 – Radar: Main layout with Partner Grid, Profile Card, and QuickLog
// =============================================================================

import { useState, useCallback } from 'react';
import PartnerGrid from './PartnerGrid';
import ProfileCard from './ProfileCard';
import QuickLogModal from './QuickLogModal';
import CommunicationTimeline from './CommunicationTimeline';
import DealTracker from './DealTracker';

/**
 * RadarLayout — top-level orchestration component for the Radar module.
 *
 * Manages which partner is selected and which sub-panels are visible.
 */
export default function RadarLayout() {
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile | timeline | deals

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSelectPartner = useCallback((partnerId) => {
    setSelectedPartnerId(partnerId);
    setActiveTab('profile');
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPartnerId(null);
  }, []);

  const handleOpenQuickLog = useCallback(() => {
    setQuickLogOpen(true);
  }, []);

  const handleCloseQuickLog = useCallback(() => {
    setQuickLogOpen(false);
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Left: Partner Grid (always visible) ── */}
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${
          selectedPartnerId ? 'w-1/2' : 'w-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header bar */}
          <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Radar</h1>
            {selectedPartnerId && (
              <button
                type="button"
                onClick={handleOpenQuickLog}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <span className="text-lg leading-none">+</span> Quick Log
              </button>
            )}
          </header>

          {/* Grid */}
          <div className="flex-1 overflow-auto">
            <PartnerGrid
              selectedPartnerId={selectedPartnerId}
              onSelectPartner={handleSelectPartner}
            />
          </div>
        </div>
      </div>

      {/* ── Right: Detail panel (slides in when a partner is selected) ── */}
      {selectedPartnerId && (
        <aside className="w-1/2 max-w-2xl border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-gray-200">
            {['profile', 'timeline', 'deals'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium text-center capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCloseDetail}
              className="px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close detail panel"
            >
              ✕
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'profile' && (
              <ProfileCard partnerId={selectedPartnerId} />
            )}
            {activeTab === 'timeline' && (
              <CommunicationTimeline partnerId={selectedPartnerId} />
            )}
            {activeTab === 'deals' && (
              <DealTracker partnerId={selectedPartnerId} />
            )}
          </div>
        </aside>
      )}

      {/* ── Quick-log modal ── */}
      {quickLogOpen && selectedPartnerId && (
        <QuickLogModal
          partnerId={selectedPartnerId}
          onClose={handleCloseQuickLog}
        />
      )}
    </div>
  );
}
