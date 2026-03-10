import React from 'react';
import { useDashboard } from '../../shared/hooks/useDashboard';
import KPICards from './KPICards';
import AlertsWidget from './AlertsWidget';
import ActivityFeed from './ActivityFeed';
import TierChart from './TierChart';

/**
 * DashboardLayout - Main dashboard view
 */
export default function DashboardLayout() {
  const { kpis, alerts, activities, distribution, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#02475A]">Dashboard</h1>
        <p className="text-gray-600 mt-2">Partner program overview and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8">
        <KPICards data={kpis} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <AlertsWidget alerts={alerts} />
          <ActivityFeed activities={activities} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <TierChart distribution={distribution} />
        </div>
      </div>
    </div>
  );
}