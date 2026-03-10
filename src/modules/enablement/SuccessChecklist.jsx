// =============================================================================
// src/modules/enablement/SuccessChecklist.jsx
// Module 8 – Enablement: Onboarding tasks / success checklist
// =============================================================================

import { useMemo } from 'react';

/**
 * SuccessChecklist — renders a list of onboarding tasks that partners
 * can mark as complete.
 *
 * @param {Object}   props
 * @param {Array}    props.items    – checklist items from useEnablement
 * @param {Function} props.onToggle – callback(taskId) to toggle completion
 */
export default function SuccessChecklist({ items = [], onToggle }) {
  const completedCount = useMemo(
    () => items.filter((i) => i.completed).length,
    [items],
  );

  const progressPct = items.length > 0
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500">No checklist items available.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {/* ── Progress summary ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: 'Nunito Sans, sans-serif', color: '#02475A' }}
          >
            Onboarding Progress
          </h2>
          <span className="text-sm font-medium text-gray-600">
            {completedCount} / {items.length} complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 w-full rounded-full bg-gray-200">
          <div
            className="h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: '#ADC837' }}
          />
        </div>
      </div>

      {/* ── Task list ── */}
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
              item.completed
                ? 'border-gray-100 bg-gray-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                item.completed
                  ? 'border-transparent text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={
                item.completed
                  ? { backgroundColor: '#ADC837' }
                  : undefined
              }
              aria-label={
                item.completed
                  ? `Mark "${item.title}" as incomplete`
                  : `Mark "${item.title}" as complete`
              }
            >
              {item.completed && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  item.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-900'
                }`}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {item.description}
                </p>
              )}
              {item.category && (
                <span
                  className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: '#ADC83720', color: '#6B8A1A' }}
                >
                  {item.category}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
