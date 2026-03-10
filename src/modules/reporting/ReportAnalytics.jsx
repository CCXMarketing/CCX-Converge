import { useState, useEffect } from 'react';
import {
  calculateROI,
  getDataGapAnalysis,
  comparePartners,
  exportToPresentation
} from '../../shared/services/reportingService';

// ============================================
// ROI CALCULATOR
// ============================================
const ROICalculator = () => {
  const [roiData, setRoiData] = useState(null);
  const [sortField, setSortField] = useState('revenue');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    setRoiData(calculateROI());
  }, []);

  if (!roiData) return null;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...roiData.partners].sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const SortIcon = ({ field }) => (
    <span className="ml-1 inline-block">
      {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  const formatCurrency = (val) => `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#02475A]">{formatCurrency(roiData.totals.revenue)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#404041]">{formatCurrency(roiData.totals.cost)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Cost</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <p className={`text-2xl font-bold ${roiData.totals.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {roiData.totals.roi}%
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Overall ROI</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#02475A]">{roiData.partners.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Partners Tracked</p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-[#02475A] mb-3">Cost Breakdown</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Commissions</span>
              <span className="font-medium text-[#404041]">{formatCurrency(roiData.totals.commissions)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#02475A] rounded-full"
                style={{ width: `${roiData.totals.cost > 0 ? (roiData.totals.commissions / roiData.totals.cost * 100) : 0}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>MDF Spend</span>
              <span className="font-medium text-[#404041]">{formatCurrency(roiData.totals.mdf)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ADC837] rounded-full"
                style={{ width: `${roiData.totals.cost > 0 ? (roiData.totals.mdf / roiData.totals.cost * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Per-Partner ROI Table */}
      {sorted.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-semibold text-[#02475A]">Per-Partner ROI</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Partner</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Tier</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-[#02475A]" onClick={() => handleSort('revenue')}>
                    Revenue<SortIcon field="revenue" />
                  </th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-[#02475A]" onClick={() => handleSort('totalCost')}>
                    Cost<SortIcon field="totalCost" />
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-[#02475A]" onClick={() => handleSort('roi')}>
                    ROI<SortIcon field="roi" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-2.5 font-medium text-[#404041]">{p.partner_name}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.tier}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-[#404041]">{formatCurrency(p.revenue)}</td>
                    <td className="px-3 py-2.5 text-right text-[#404041]">{formatCurrency(p.totalCost)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-semibold ${p.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {p.roi}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No partner financial data available.</p>
          <p className="text-gray-400 text-xs mt-1">Add commission and MDF records in Economics to see ROI calculations.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// DATA GAP VISUALIZER
// ============================================
const DataGapVisualizer = () => {
  const [gapData, setGapData] = useState(null);

  useEffect(() => {
    setGapData(getDataGapAnalysis());
  }, []);

  if (!gapData) return null;

  const getBarColor = (pct) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-[#ADC837]';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = (pct) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 60) return 'text-[#ADC837]';
    if (pct >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
        <div className={`text-5xl font-bold ${getTextColor(gapData.overallCompleteness)}`}>
          {gapData.overallCompleteness}%
        </div>
        <p className="text-sm text-gray-500 mt-1">Overall Data Completeness</p>
        <p className="text-xs text-gray-400 mt-0.5">Across {gapData.partnerCount} partner records</p>
        <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden max-w-md mx-auto">
          <div
            className={`h-full rounded-full transition-all ${getBarColor(gapData.overallCompleteness)}`}
            style={{ width: `${gapData.overallCompleteness}%` }}
          />
        </div>
      </div>

      {/* Field Breakdown */}
      {gapData.partnerCount > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-semibold text-[#02475A]">Field-by-Field Completeness</h4>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by least complete first — prioritize these for data cleanup.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {gapData.fields.map((field) => (
              <div key={field.key} className="px-4 py-3 flex items-center gap-4">
                <div className="w-36 shrink-0">
                  <p className="text-sm font-medium text-[#404041]">{field.field}</p>
                  <p className="text-xs text-gray-400">{field.filled} of {field.total} filled</p>
                </div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all flex items-center justify-end pr-2 ${getBarColor(field.completeness)}`}
                      style={{ width: `${Math.max(field.completeness, 5)}%` }}
                    >
                      {field.completeness >= 20 && (
                        <span className="text-[10px] text-white font-bold">{field.completeness}%</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-12 text-right shrink-0">
                  <span className={`text-sm font-bold ${getTextColor(field.completeness)}`}>
                    {field.completeness}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No partner records found.</p>
          <p className="text-gray-400 text-xs mt-1">Add partners in Radar to see data completeness analysis.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// PARTNER COMPARISON
// ============================================
const PartnerComparison = () => {
  const [partners, setPartners] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('converge_partners') || '[]');
      setPartners(data);
    } catch { setPartners([]); }
  }, []);

  const togglePartner = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(p => p !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selected.length < 2) return;
    setComparison(comparePartners(selected));
  };

  const handleClear = () => {
    setSelected([]);
    setComparison([]);
  };

  const formatCurrency = (val) => `$${(val || 0).toLocaleString()}`;

  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const metrics = [
    { key: 'tier', label: 'Tier', format: (v) => v },
    { key: 'status', label: 'Status', format: (v) => v },
    { key: 'health_score', label: 'Health Score', format: (v) => `${v}/100`, isHealth: true },
    { key: 'data_completeness', label: 'Data Completeness', format: (v) => `${v}%` },
    { key: 'deal_count', label: 'Deal Count', format: (v) => v },
    { key: 'deal_value', label: 'Deal Value', format: (v) => formatCurrency(v) },
    { key: 'interaction_count', label: 'Interactions', format: (v) => v },
    { key: 'last_contact', label: 'Last Contact', format: (v) => v },
    { key: 'commission_cost', label: 'Commissions', format: (v) => formatCurrency(v) },
    { key: 'mdf_spent', label: 'MDF Spent', format: (v) => formatCurrency(v) },
    { key: 'total_cost', label: 'Total Cost', format: (v) => formatCurrency(v) },
    { key: 'roi', label: 'ROI', format: (v) => `${v}%`, isROI: true },
    { key: 'onboarding_progress', label: 'Onboarding', format: (v) => `${v}%` },
    { key: 'contract_end', label: 'Contract End', format: (v) => v },
    { key: 'source', label: 'Source', format: (v) => v }
  ];

  return (
    <div className="space-y-4">
      {/* Partner Selector */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-[#02475A] mb-1">Select Partners to Compare</h4>
        <p className="text-xs text-gray-400 mb-3">Choose 2-4 partners for side-by-side comparison.</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {partners.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePartner(p.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  isSelected
                    ? 'border-[#ADC837] bg-[#ADC837]/10 text-[#02475A] font-medium'
                    : 'border-gray-300 text-gray-500 hover:border-[#ADC837] hover:text-[#02475A]'
                }`}
              >
                {isSelected && <span className="mr-1">✓</span>}
                {p.company_name}
              </button>
            );
          })}
        </div>

        {partners.length === 0 && (
          <p className="text-xs text-gray-400">No partners available. Add partners in Radar first.</p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleCompare}
            disabled={selected.length < 2}
            className="bg-[#02475A] hover:bg-[#035d77] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Compare ({selected.length} selected)
          </button>
          {selected.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-[#02475A] px-3 py-2 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {comparison.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h4 className="text-sm font-semibold text-[#02475A]">Partner Comparison</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 bg-gray-50 w-40">Metric</th>
                  {comparison.map(p => (
                    <th key={p.id} className="text-center px-4 py-3 text-xs font-semibold text-[#02475A] bg-gray-50 min-w-[140px]">
                      {p.company_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, idx) => (
                  <tr key={metric.key} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-500">{metric.label}</td>
                    {comparison.map(p => {
                      const val = p[metric.key];
                      let cellClass = 'text-[#404041]';
                      if (metric.isHealth) cellClass = getHealthColor(val).split(' ')[0];
                      if (metric.isROI) cellClass = val >= 0 ? 'text-green-600' : 'text-red-600';

                      // Highlight best value
                      let isBest = false;
                      if (['health_score', 'deal_count', 'deal_value', 'roi', 'interaction_count', 'onboarding_progress', 'data_completeness'].includes(metric.key)) {
                        const maxVal = Math.max(...comparison.map(c => c[metric.key] || 0));
                        isBest = val === maxVal && maxVal > 0;
                      }

                      return (
                        <td key={p.id} className={`px-4 py-2.5 text-center text-sm ${cellClass} ${isBest ? 'font-bold' : ''}`}>
                          {metric.format(val)}
                          {isBest && <span className="ml-1 text-[#ADC837]">★</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN EXPORT
// ============================================
const ReportAnalytics = () => {
  const [activeTab, setActiveTab] = useState('roi');

  const tabs = [
    { id: 'roi', label: 'ROI Calculator', icon: '💰' },
    { id: 'gaps', label: 'Data Gaps', icon: '📊' },
    { id: 'compare', label: 'Compare Partners', icon: '⚖️' }
  ];

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#02475A] text-white shadow-sm'
                : 'text-gray-500 hover:text-[#02475A] hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToPresentation}
          className="text-xs bg-white border border-gray-200 text-[#02475A] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-1.5 shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Export Presentation
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'roi' && <ROICalculator />}
      {activeTab === 'gaps' && <DataGapVisualizer />}
      {activeTab === 'compare' && <PartnerComparison />}
    </div>
  );
};

export default ReportAnalytics;