// =============================================================================
// src/modules/dashboard/KPICards.jsx
// Three numbered KPI metric cards: Active Partners, MRR Pipeline, Partners Onboarding
// =============================================================================

const kpiConfig = [
  {
    number: 1,
    label: 'Active Partners',
    key: 'activePartners',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
    ),
  },
  {
    number: 2,
    label: 'MRR Pipeline',
    key: 'mrrPipeline',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    number: 3,
    label: 'Partners Onboarding',
    key: 'partnersOnboarding',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
        />
      </svg>
    ),
  },
];

/**
 * KPICards — renders three numbered KPI metric cards.
 *
 * @param {Object}  props
 * @param {Object}  props.data - KPI data object keyed by activePartners, mrrPipeline, partnersOnboarding.
 *                                Each value can be a primitive or { value, trend }.
 */
export default function KPICards({ data = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiConfig.map(({ number, label, key, icon }) => {
        const raw = data[key];
        const value =
          typeof raw === 'object' && raw !== null ? (raw.value ?? '—') : (raw ?? '—');
        const trend =
          typeof raw === 'object' && raw !== null ? raw.trend : undefined;

        return (
          <div
            key={key}
            className="rounded-lg bg-white p-5 shadow-sm border border-gray-200 flex items-start gap-4"
          >
            {/* Numbered icon badge */}
            <div className="relative shrink-0">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: '#ADC837', color: '#fff' }}
              >
                {icon}
              </div>
              <span
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: '#02475A' }}
              >
                {number}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {label}
              </p>
              <p
                className="mt-1 text-2xl font-bold truncate"
                style={{ color: '#02475A' }}
              >
                {value}
              </p>
              {trend != null && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    trend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
