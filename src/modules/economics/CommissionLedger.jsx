// =============================================================================
// src/modules/economics/CommissionLedger.jsx
// Module 9 – Economics: Commission tracking table
// =============================================================================

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
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
  { key: 'dealName', label: 'Deal Name' },
  { key: 'amount', label: 'Commission' },
  { key: 'status', label: 'Payment Status' },
  { key: 'date', label: 'Date' },
];

const STATUSES = ['all', 'pending', 'approved', 'paid', 'disputed'];

// ── component ────────────────────────────────────────────────────────────────

export default function CommissionLedger({ commissions = [], onExport }) {
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ── derived data ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return commissions.filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (
        q &&
        !c.partnerName?.toLowerCase().includes(q) &&
        !c.dealName?.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [commissions, search, filterStatus]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'amount') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortBy === 'date') {
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

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search partner or deal…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
          style={{ minWidth: 220 }}
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

        <div className="ml-auto">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#02475A' }}
          >
            Export
          </button>
        </div>
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
                  {row.dealName ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {formatCurrency(row.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(row.status)}`}
                  >
                    {row.status ?? '—'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {formatDate(row.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Empty state ── */}
        {sorted.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No commissions found.
          </div>
        )}
      </div>
    </div>
  );
}

CommissionLedger.propTypes = {
  commissions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      partnerName: PropTypes.string,
      dealName: PropTypes.string,
      amount: PropTypes.number,
      status: PropTypes.oneOf(['pending', 'approved', 'paid', 'disputed']),
      date: PropTypes.string,
    }),
  ),
  onExport: PropTypes.func,
};
