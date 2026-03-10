// =============================================================================
// src/modules/economics/RevenueAttribution.jsx
// Module 9 – Economics: Partner revenue attribution breakdown
// =============================================================================

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

// ── helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  Sourced: 'bg-green-100 text-green-800',
  Influenced: 'bg-purple-100 text-purple-800',
};

const typeColor = (type) =>
  TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600';

const formatCurrency = (val) => {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(val);
};

const COLUMNS = [
  { key: 'partnerName', label: 'Partner Name' },
  { key: 'revenue', label: 'Revenue Generated' },
  { key: 'dealCount', label: 'Deal Count' },
  { key: 'attributionType', label: 'Attribution Type' },
];

const TYPES = ['all', 'Sourced', 'Influenced'];

// ── component ────────────────────────────────────────────────────────────────

export default function RevenueAttribution({ revenue = [] }) {
  const [sortBy, setSortBy] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  // ── derived data ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return revenue.filter((row) => {
      if (filterType !== 'all' && row.attributionType !== filterType) return false;
      if (q && !row.partnerName?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [revenue, search, filterType]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'revenue' || sortBy === 'dealCount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal ?? '').toLowerCase();
        bVal = String(bVal ?? '').toLowerCase();
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key) => {
    if (sortBy !== key) return null;
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search partner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
          style={{ minWidth: 220, focusRingColor: 'rgba(173,200,55,0.2)' }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All Types' : t}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {col.label}
                  {sortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sorted.map((row, idx) => (
              <tr key={row.id ?? idx} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: '#02475A' }}>
                  {row.partnerName ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {formatCurrency(row.revenue)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {row.dealCount ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor(row.attributionType)}`}
                  >
                    {row.attributionType ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Empty state ── */}
        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No revenue records found.
          </div>
        )}
      </div>
    </div>
  );
}

RevenueAttribution.propTypes = {
  revenue: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      partnerName: PropTypes.string,
      revenue: PropTypes.number,
      dealCount: PropTypes.number,
      attributionType: PropTypes.oneOf(['Sourced', 'Influenced']),
    }),
  ),
};
