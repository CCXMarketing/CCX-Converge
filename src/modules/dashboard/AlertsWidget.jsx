// =============================================================================
// src/modules/dashboard/AlertsWidget.jsx
// Red-flag alerts list: Stalled deals & Expiring contracts
// =============================================================================

import { AlertTriangle, Clock } from 'lucide-react';

const alertTypes = {
  stalledDeal: {
    label: 'Stalled Deal',
    icon: Clock,
    accentColor: '#DC2626', // red-600
    bgColor: '#FEF2F2',    // red-50
  },
  expiringContract: {
    label: 'Expiring Contract',
    icon: AlertTriangle,
    accentColor: '#D97706', // amber-600
    bgColor: '#FFFBEB',    // amber-50
  },
};

/**
 * AlertsWidget — renders a list of red-flag alert cards.
 *
 * @param {Object}   props
 * @param {Array}    props.alerts - Array of alert objects.
 *   Each alert: { id, type: 'stalledDeal' | 'expiringContract', title, description, timestamp }
 */
export default function AlertsWidget({ alerts = [] }) {
  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-200 flex flex-col">
      {/* Section header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: '#02475A' }}
        >
          Alerts
        </h2>
      </div>

      {/* Alert cards */}
      <ul className="flex-1 divide-y divide-gray-100 overflow-auto">
        {alerts.length > 0 ? (
          alerts.map((alert, idx) => {
            const config = alertTypes[alert.type] ?? alertTypes.stalledDeal;
            const Icon = config.icon;

            return (
              <li key={alert.id ?? idx} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  {/* Icon badge */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: config.accentColor }}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ backgroundColor: config.accentColor }}
                    >
                      {config.label}
                    </span>
                    <p
                      className="mt-1 text-sm font-semibold truncate"
                      style={{ color: '#02475A' }}
                    >
                      {alert.title ?? '—'}
                    </p>
                    {alert.description && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {alert.description}
                      </p>
                    )}
                    {alert.timestamp && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        {alert.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })
        ) : (
          <li className="px-4 py-6 text-center text-sm text-gray-400">
            No alerts
          </li>
        )}
      </ul>
    </div>
  );
}
