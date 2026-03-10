import React from 'react';

/**
 * TierChart - Partner tier distribution visualization
 */
export default function TierChart({ distribution = {} }) {
  // Mock data if none provided
  const tiers = distribution.tiers || [
    { name: 'Gold', count: 5, revenue: 150000, color: 'bg-yellow-400' },
    { name: 'Silver', count: 12, revenue: 200000, color: 'bg-gray-400' },
    { name: 'Bronze', count: 18, revenue: 180000, color: 'bg-orange-400' }
  ];

  const totalPartners = tiers.reduce((sum, tier) => sum + tier.count, 0);
  const totalRevenue = tiers.reduce((sum, tier) => sum + tier.revenue, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#02475A] mb-4">Partner Tier Distribution</h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Total Partners</p>
          <p className="text-2xl font-bold text-[#02475A]">{totalPartners}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total MRR</p>
          <p className="text-2xl font-bold text-[#02475A]">
            ${(totalRevenue / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="space-y-4">
        {tiers.map((tier) => (
          <div key={tier.name}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${tier.color}`}></div>
                <span className="text-sm font-medium text-gray-700">{tier.name}</span>
              </div>
              <span className="text-sm text-gray-600">
                {tier.count} partners • ${(tier.revenue / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${tier.color}`}
                style={{ width: `${(tier.count / totalPartners) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}