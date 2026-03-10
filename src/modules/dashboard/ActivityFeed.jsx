import React from 'react';

/**
 * ActivityFeed - Displays recent partner interactions
 */
export default function ActivityFeed({ activities = [] }) {
  // Mock data if none provided
  const displayActivities = activities.length > 0 ? activities : [
    { id: 1, partner: 'Sample Partner', type: 'Call', date: '2024-02-19', notes: 'Quarterly check-in' },
    { id: 2, partner: 'Demo Corp', type: 'Email', date: '2024-02-18', notes: 'Contract renewal discussion' },
    { id: 3, partner: 'Test Inc', type: 'Meeting', date: '2024-02-17', notes: 'Product demo' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#02475A] mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {displayActivities.slice(0, 5).map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
            <div className="flex-shrink-0 w-8 h-8 bg-[#ADC837] bg-opacity-10 rounded-full flex items-center justify-center">
              <span className="text-[#ADC837] text-xs font-semibold">
                {activity.type[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.partner}</p>
              <p className="text-xs text-gray-500">{activity.type} - {activity.date}</p>
              {activity.notes && (
                <p className="text-xs text-gray-600 mt-1">{activity.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {displayActivities.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
      )}
    </div>
  );
}