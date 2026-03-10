// =============================================================================
// src/modules/economics/MDFTracker.jsx
// Module 9 – Economics: MDF budget tracker table
// =============================================================================

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  exhausted: 'bg-red-100 text-red-800',
  upcoming: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-600',
};

const statusColor = (status) =>
  STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';

const formatCurrency = (val) => {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(val);
};

const formatDate = (val) => {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const COLUMNS = [
  { key: 'partnerName', label: 'Partner Name' },
  { key: 'allocated', label: 'MDF Allocated' },
  { key: 'spent', label: 'MDF Spent' },
  { key: 'remaining', label: 'MDF Remaining' },
  { key: 'budgetPeriodStart', label: 'Budget Period' },
  { key: 'status', label: 'Status' },
];

const STATUSES = ['all', 'active', 'exhausted', 'upcoming', 'expired'];

// ── component ────────────────────────────────────────────────────────────────

export default function MDFTracker({ mdf = [] }) {
  const [sortBy, setSortBy] = useState('partnerName');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ── derived data ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return mdf.filter((row) => {
      if (filterStatus !== 'all' && row.status !== filterStatus) return false;
      if (q && !row.partnerName?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mdf, search, filterStatus]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (['allocated', 'spent', 'remaining'].includes(sortBy)) {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortBy === 'budgetPeriodStart') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
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

  // ── utilization bar ────────────────────────────────────────────────────────

  const utilizationPct = (row) => {
    if (!row.allocated || row.allocated === 0) return 0;
    return Math.min(100, Math.round((row.spent / row.allocated) * 100));
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
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
            {sorted.map((row, idx) => {
              const pct = utilizationPct(row);

              return (
                <tr key={row.id ?? idx} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: '#02475A' }}>
                    {row.partnerName ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {formatCurrency(row.allocated)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(row.spent)}</span>
                      <div className="h-1.5 w-16 rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: pct >= 90 ? '#dc2626' : '#ADC837',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {formatCurrency(row.remaining)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {formatDate(row.budgetPeriodStart)}
                    {row.budgetPeriodEnd ? ` – ${formatDate(row.budgetPeriodEnd)}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(row.status)}`}
                    >
                      {row.status ?? '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Empty state ── */}
        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No MDF records found.
          </div>
        )}
      </div>
    </div>
  );
}

MDFTracker.propTypes = {
  mdf: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      partnerName: PropTypes.string,
      allocated: PropTypes.number,
      spent: PropTypes.number,
      remaining: PropTypes.number,
      budgetPeriodStart: PropTypes.string,
      budgetPeriodEnd: PropTypes.string,
      status: PropTypes.oneOf(['active', 'exhausted', 'upcoming', 'expired']),
    }),
  ),
};
