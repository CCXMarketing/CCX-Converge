// =============================================================================
// src/modules/enablement/TierCriteria.jsx
// Module 8 – Enablement: Tier progression requirements
// =============================================================================

/**
 * TierCriteria — displays partner tier levels and the requirements needed
 * to progress through each.
 *
 * @param {Object} props
 * @param {Array}  props.tiers – tier objects from useEnablement
 */
export default function TierCriteria({ tiers = [] }) {
  if (tiers.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500">No tier information available.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h2
        className="mb-6 text-base font-semibold"
        style={{ fontFamily: 'Nunito Sans, sans-serif', color: '#02475A' }}
      >
        Partner Tier Progression
      </h2>

      <div className="space-y-4">
        {tiers.map((tier, idx) => {
          const isCurrentTier = tier.current;
          const metCount = (tier.requirements || []).filter(
            (r) => r.met,
          ).length;
          const totalReqs = (tier.requirements || []).length;
          const progressPct =
            totalReqs > 0 ? Math.round((metCount / totalReqs) * 100) : 0;

          return (
            <div
              key={tier.id || idx}
              className={`rounded-lg border p-5 transition-colors ${
                isCurrentTier
                  ? 'border-2 bg-white'
                  : 'border-gray-200 bg-white'
              }`}
              style={
                isCurrentTier ? { borderColor: '#ADC837' } : undefined
              }
            >
              {/* Tier header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: '#02475A' }}
                  >
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {tier.name}
                  </h3>
                  {isCurrentTier && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: '#ADC837' }}
                    >
                      Current
                    </span>
                  )}
                </div>

                <span className="text-xs text-gray-500">
                  {metCount} / {totalReqs} met
                </span>
              </div>

              {tier.description && (
                <p className="mb-3 text-sm text-gray-600">
                  {tier.description}
                </p>
              )}

              {/* Progress bar */}
              {totalReqs > 0 && (
                <div className="mb-4 h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: '#ADC837',
                    }}
                  />
                </div>
              )}

              {/* Requirements list */}
              {totalReqs > 0 && (
                <ul className="space-y-2">
                  {tier.requirements.map((req, rIdx) => (
                    <li
                      key={req.id || rIdx}
                      className="flex items-center gap-2 text-sm"
                    >
                      {/* Status icon */}
                      {req.met ? (
                        <svg
                          className="h-4 w-4 flex-shrink-0"
                          style={{ color: '#ADC837' }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300" />
                      )}

                      <span
                        className={
                          req.met ? 'text-gray-400 line-through' : 'text-gray-700'
                        }
                      >
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
