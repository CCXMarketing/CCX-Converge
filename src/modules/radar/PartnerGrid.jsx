// =============================================================================
// src/modules/radar/PartnerGrid.jsx
// Module 2 – Radar: Sortable, filterable partner table
// =============================================================================

import { useState, useCallback, useMemo } from 'react';
import { usePartners } from '../../shared/hooks/usePartners';
import { useSegmentationViews, useSegmentationActions } from '../../shared/hooks/useSegmentation';

const TIER_OPTIONS = ['All', 'Gold', 'Silver', 'Bronze'];
const STATUS_OPTIONS = ['All', 'Active', 'Inactive', 'Prospect'];
const TYPE_OPTIONS = ['All', 'Reseller', 'Referral', 'Technology', 'Strategic'];
const SORT_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'tier', label: 'Tier' },
  { value: 'status', label: 'Status' },
  { value: 'created_at', label: 'Date Added' },
];

/**
 * PartnerGrid — sortable, filterable table of all partners.
 *
 * @param {{ selectedPartnerId: string|null, onSelectPartner: (id: string) => void }} props
 */
export default function PartnerGrid({ selectedPartnerId, onSelectPartner }) {
  // ── filter state ──────────────────────────────────────────────────────────
  const [filterTier, setFilterTier] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');

  // ── build filters object for the hook ─────────────────────────────────────
  const filters = useMemo(() => {
    const f = { sort_by: sortBy, sort_dir: sortDir };
    if (filterTier !== 'All') f.tier = filterTier;
    if (filterStatus !== 'All') f.status = filterStatus;
    if (filterType !== 'All') f.partner_type = filterType;
    return f;
  }, [filterTier, filterStatus, filterType, sortBy, sortDir]);

  const { partners, loading, error, refresh } = usePartners(filters);
  const { views } = useSegmentationViews();
  const { apply: applyView } = useSegmentationActions();

  // ── client-side search filter ─────────────────────────────────────────────
  const displayed = useMemo(() => {
    if (!search.trim()) return partners;
    const q = search.toLowerCase();
    return partners.filter(
      (p) =>
        (p.company_name && p.company_name.toLowerCase().includes(q)) ||
        (p.contact_name && p.contact_name.toLowerCase().includes(q)) ||
        (p.market && p.market.toLowerCase().includes(q)),
    );
  }, [partners, search]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (field) => {
      if (sortBy === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(field);
        setSortDir('asc');
      }
    },
    [sortBy],
  );

  const handleApplyView = useCallback(
    async (viewId) => {
      await applyView(viewId);
      refresh();
    },
    [applyView, refresh],
  );

  const sortIndicator = (field) => {
    if (sortBy !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  // ── tier badge color ──────────────────────────────────────────────────────
  const tierColor = (tier) => {
    switch (tier) {
      case 'Gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'Silver':
        return 'bg-gray-100 text-gray-800';
      case 'Bronze':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Prospect':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-4">
      {/* ── Toolbar: Search + Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search partners…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />

        {/* Tier */}
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {TIER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Tiers' : t}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All Statuses' : s}
            </option>
          ))}
        </select>

        {/* Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Types' : t}
            </option>
          ))}
        </select>

        {/* Saved views */}
        {views.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleApplyView(e.target.value);
            }}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Saved views…
            </option>
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}

        {/* Refresh */}
        <button
          type="button"
          onClick={refresh}
          className="ml-auto rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {SORT_FIELDS.map((col) => (
                <th
                  key={col.value}
                  onClick={() => handleSort(col.value)}
                  className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                >
                  {col.label}
                  {sortIndicator(col.value)}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading partners…
                </td>
              </tr>
            )}

            {!loading && displayed.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-gray-400">
                    {search.trim()
                      ? 'No partners match your search.'
                      : 'No partners yet. Add your first partner to get started.'}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              displayed.map((partner) => (
                <tr
                  key={partner.id}
                  onClick={() => onSelectPartner(partner.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedPartnerId === partner.id
                      ? 'bg-indigo-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {partner.company_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierColor(
                        partner.tier,
                      )}`}
                    >
                      {partner.tier || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                        partner.status,
                      )}`}
                    >
                      {partner.status || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {partner.created_at
                      ? new Date(partner.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {partner.partner_type || '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
