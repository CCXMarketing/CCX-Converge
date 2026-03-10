import { useState, useEffect } from 'react';

/**
 * useDashboard - Provides dashboard data
 * Returns mock data for now (Firebase auth not configured yet)
 */
export function useDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock KPIs
  const kpis = {
    activePartners: 35,
    mrrPipeline: 425000,
    partnersOnboarding: 8
  };

  // Mock alerts
  const alerts = [
    { id: 1, type: 'warning', title: 'Stalled Deal', message: 'Acme Corp deal - no activity for 45 days', partnerId: '1' },
    { id: 2, type: 'danger', title: 'Contract Expiring', message: 'TechVentures contract expires in 30 days', partnerId: '2' },
    { id: 3, type: 'warning', title: 'Stalled Deal', message: 'HealthTech Solutions - no response for 35 days', partnerId: '3' }
  ];

  // Mock recent activities
  const activities = [
    { id: 1, partner: 'Acme Corporation', type: 'Call', date: '2024-02-19', notes: 'Quarterly business review' },
    { id: 2, partner: 'TechVentures', type: 'Email', date: '2024-02-18', notes: 'Contract renewal discussion' },
    { id: 3, partner: 'HealthTech Solutions', type: 'Meeting', date: '2024-02-17', notes: 'Product demo and training' },
    { id: 4, partner: 'MedConnect', type: 'Call', date: '2024-02-16', notes: 'Support escalation resolved' },
    { id: 5, partner: 'CareWell Systems', type: 'Email', date: '2024-02-15', notes: 'New lead referral received' }
  ];

  // Mock tier distribution
  const distribution = {
    tiers: [
      { name: 'Gold', count: 5, revenue: 180000, color: 'bg-yellow-400' },
      { name: 'Silver', count: 12, revenue: 168000, color: 'bg-gray-400' },
      { name: 'Bronze', count: 18, revenue: 77000, color: 'bg-orange-400' }
    ]
  };

  return {
    kpis,
    alerts,
    activities,
    distribution,
    loading,
    error
  };
}

export default useDashboard;