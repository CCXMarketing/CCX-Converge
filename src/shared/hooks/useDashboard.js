import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * useDashboard - Provides dashboard data from Firestore
 */
export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpis, setKpis] = useState({ activePartners: 0, mrrPipeline: 0, partnersOnboarding: 0 });
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [distribution, setDistribution] = useState({ tiers: [] });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Fetch partners
        const partnersSnap = await getDocs(collection(db, 'partners'));
        const partners = partnersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const active = partners.filter(p => p.status === 'Active').length;
        const onboarding = partners.filter(p => p.status === 'Onboarding').length;

        // Fetch deals for pipeline value
        const dealsSnap = await getDocs(collection(db, 'deals'));
        const deals = dealsSnap.docs.map(doc => doc.data());
        const pipeline = deals
          .filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
          .reduce((sum, d) => sum + (d.deal_value || 0), 0);

        setKpis({ activePartners: active, mrrPipeline: pipeline, partnersOnboarding: onboarding });

        // Build alerts from partner data
        const partnerAlerts = [];
        partners.forEach(p => {
          if (p.health_score < 40) {
            partnerAlerts.push({ id: `hs-${p.id}`, type: 'danger', title: 'Low Health Score', message: `${p.company_name} health score is ${p.health_score}`, partnerId: p.id });
          }
        });
        setAlerts(partnerAlerts);

        // Fetch recent interactions
        const interactionsSnap = await getDocs(collection(db, 'interactions'));
        const interactions = interactionsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const dateA = a.date?.toDate?.() || new Date(0);
            const dateB = b.date?.toDate?.() || new Date(0);
            return dateB - dateA;
          })
          .slice(0, 5)
          .map(i => ({
            id: i.id,
            partner: i.partner_name,
            type: i.type,
            date: i.date?.toDate?.()?.toISOString?.()?.split('T')[0] || '',
            notes: i.notes
          }));
        setActivities(interactions);

        // Build tier distribution
        const tierMap = {};
        partners.forEach(p => {
          const tier = p.tier || 'Unassigned';
          if (!tierMap[tier]) tierMap[tier] = { name: tier, count: 0, revenue: 0, color: 'bg-gray-400' };
          tierMap[tier].count++;
        });
        if (tierMap['Gold']) tierMap['Gold'].color = 'bg-yellow-400';
        if (tierMap['Silver']) tierMap['Silver'].color = 'bg-gray-400';
        if (tierMap['Bronze']) tierMap['Bronze'].color = 'bg-orange-400';
        setDistribution({ tiers: Object.values(tierMap) });

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

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
