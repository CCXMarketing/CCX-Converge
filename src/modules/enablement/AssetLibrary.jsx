// =============================================================================
// src/modules/enablement/AssetLibrary.jsx
// Module 8 – Enablement: Partner materials / asset library
// =============================================================================

import { useState, useMemo } from 'react';

const CATEGORIES = ['All', 'Documents', 'Presentations', 'Videos', 'Templates'];

const TYPE_ICONS = {
  document: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  presentation: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h16.5M3.75 3l3 11.25M21.75 3v11.25A2.25 2.25 0 0119.5 16.5h-2.25M21.75 3l-3 11.25M12 16.5V21m0 0l-3-3m3 3l3-3" />
    </svg>
  ),
  video: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
    </svg>
  ),
  template: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
};

function getIcon(type) {
  return TYPE_ICONS[type] || TYPE_ICONS.document;
}

/**
 * AssetLibrary — browsable library of partner enablement materials.
 *
 * @param {Object}   props
 * @param {Array}    props.assets     – asset objects from useEnablement
 * @param {Function} props.onDownload – callback(assetId) to trigger download
 */
export default function AssetLibrary({ assets = [], onDownload }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    let result = assets;

    if (category !== 'All') {
      const cat = category.toLowerCase().replace(/s$/, ''); // "Documents" → "document"
      result = result.filter((a) => a.type === cat);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.title || '').toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [assets, category, search]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h2
        className="mb-4 text-base font-semibold"
        style={{ fontFamily: 'Nunito Sans, sans-serif', color: '#02475A' }}
      >
        Partner Materials
      </h2>

      {/* ── Filters ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#ADC837' }}
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === cat
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                category === cat
                  ? { backgroundColor: '#02475A' }
                  : undefined
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-500">
            {assets.length === 0
              ? 'No assets available.'
              : 'No assets match your filters.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((asset) => (
            <li
              key={asset.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
            >
              {/* Icon */}
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#02475A15', color: '#02475A' }}
              >
                {getIcon(asset.type)}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {asset.title}
                </p>
                {asset.description && (
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {asset.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  {asset.type && (
                    <span className="capitalize">{asset.type}</span>
                  )}
                  {asset.size && <span>{asset.size}</span>}
                </div>
              </div>

              {/* Download button */}
              <button
                type="button"
                onClick={() => onDownload(asset.id)}
                className="flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#6B8A1A' }}
                aria-label={`Download ${asset.title}`}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
