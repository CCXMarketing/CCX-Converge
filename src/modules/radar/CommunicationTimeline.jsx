import { useState, useCallback, useMemo } from 'react';
import { useInteractions } from '../../shared/hooks/useInteractions';

const TYPE_OPTIONS = ['All', 'Call', 'Email', 'Meeting', 'Demo', 'Other'];
const PAGE_SIZE = 10;

export default function CommunicationTimeline({ partnerId }) {
  const [typeFilter, setTypeFilter] = useState('All');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const options = useMemo(() => {
    const opts = { limit };
    if (typeFilter !== 'All') opts.type = typeFilter;
    return opts;
  }, [typeFilter, limit]);

  const { interactions, loading, error, refresh } = useInteractions(partnerId, options);

  const handleTypeChange = useCallback((e) => {
    setTypeFilter(e.target.value);
    setLimit(PAGE_SIZE);
  }, []);

  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + PAGE_SIZE);
  }, []);

  const typeBadgeColor = (type) => {
    switch (type) {
      case 'Call':
        return 'bg-blue-100 text-blue-800';
      case 'Email':
        return 'bg-green-100 text-green-800';
      case 'Meeting':
        return 'bg-purple-100 text-purple-800';
      case 'Demo':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header with filter and refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Communication Timeline
        </h3>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={handleTypeChange}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={refresh}
            className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && interactions.length === 0 && (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400">
          Loading interactions…
        </div>
      )}

      {/* Empty state */}
      {!loading && interactions.length === 0 && (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400 italic">
          No interactions recorded yet.
        </div>
      )}

      {/* Timeline list */}
      {interactions.length > 0 && (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />

          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="relative flex items-start gap-4 pl-10"
              >
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />

                {/* Content card */}
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeColor(
                        interaction.type,
                      )}`}
                    >
                      {interaction.type || 'Other'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(interaction.date)}
                    </span>
                  </div>
                  {interaction.notes && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {interaction.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load more button */}
      {interactions.length >= limit && (
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
