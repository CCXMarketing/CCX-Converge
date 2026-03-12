// Reporting Module - Service Layer
// Data aggregation, calculations, and export utilities

// ============================================
// DATA LOADERS
// ============================================

const getPartners = () => {
  try { return JSON.parse(localStorage.getItem('converge_partners') || '[]'); }
  catch { return []; }
};

const getProspects = () => {
  try { return JSON.parse(localStorage.getItem('converge_prospects') || '[]'); }
  catch { return []; }
};

const getCommissions = () => {
  try { return JSON.parse(localStorage.getItem('converge_commissions') || '[]'); }
  catch { return []; }
};

const getMdf = () => {
  try { return JSON.parse(localStorage.getItem('converge_mdf') || '[]'); }
  catch { return []; }
};

const getPayouts = () => {
  try { return JSON.parse(localStorage.getItem('converge_payouts') || '[]'); }
  catch { return []; }
};

const getInteractions = () => {
  try { return JSON.parse(localStorage.getItem('converge_interactions') || '[]'); }
  catch { return []; }
};

const getDeals = () => {
  try { return JSON.parse(localStorage.getItem('converge_deals') || '[]'); }
  catch { return []; }
};

const getChecklists = () => {
  try { return JSON.parse(localStorage.getItem('converge_checklists') || '[]'); }
  catch { return []; }
};

// ============================================
// PORTFOLIO SUMMARY
// ============================================

export const getPortfolioSummary = () => {
  const partners = getPartners();
  const prospects = getProspects();
  const commissions = getCommissions();
  const mdf = getMdf();
  const deals = getDeals();
  const interactions = getInteractions();

  const activePartners = partners.filter(p => p.status === 'Active');
  const onboardingPartners = partners.filter(p => p.status === 'Onboarding');

  // Tier distribution
  const tierCounts = {};
  partners.forEach(p => {
    const tier = p.tier || 'Unassigned';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });

  // Health score stats
  const healthScores = partners.map(p => p.health_score || 0).filter(h => h > 0);
  const avgHealth = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0;
  const atRisk = partners.filter(p => (p.health_score || 0) < 40).length;

  // Financial totals
  const totalCommissions = commissions.reduce((sum, c) => sum + (parseFloat(c.commission_amount) || 0), 0);
  const totalMdfAllocated = mdf.reduce((sum, m) => sum + (parseFloat(m.mdf_allocated) || 0), 0);
  const totalMdfSpent = mdf.reduce((sum, m) => sum + (parseFloat(m.mdf_spent) || 0), 0);

  // Deal stats
  const totalDealValue = deals.reduce((sum, d) => sum + (parseFloat(d.deal_value) || 0), 0);
  const closedDeals = deals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed');

  // Recent interactions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentInteractions = interactions.filter(i => new Date(i.date) >= thirtyDaysAgo);

  // Prospect pipeline
  const pipelineStages = {};
  prospects.forEach(p => {
    const stage = p.pipeline_stage || 'New';
    pipelineStages[stage] = (pipelineStages[stage] || 0) + 1;
  });

  return {
    partners: {
      total: partners.length,
      active: activePartners.length,
      onboarding: onboardingPartners.length,
      tierDistribution: tierCounts,
      avgHealthScore: avgHealth,
      atRiskCount: atRisk
    },
    prospects: {
      total: prospects.length,
      pipeline: pipelineStages
    },
    financials: {
      totalCommissions,
      totalMdfAllocated,
      totalMdfSpent,
      mdfRemaining: totalMdfAllocated - totalMdfSpent,
      totalDealValue,
      closedDeals: closedDeals.length
    },
    activity: {
      totalInteractions: interactions.length,
      last30Days: recentInteractions.length
    }
  };
};

// ============================================
// ROI CALCULATOR
// ============================================

export const calculateROI = () => {
  const partners = getPartners();
  const commissions = getCommissions();
  const mdf = getMdf();

  const partnerROI = partners.map(partner => {
    const name = partner.company_name;

    // Partner costs
    const partnerCommissions = commissions
      .filter(c => c.partner_name === name)
      .reduce((sum, c) => sum + (parseFloat(c.commission_amount) || 0), 0);

    const partnerMdf = mdf
      .filter(m => m.partner_name === name)
      .reduce((sum, m) => sum + (parseFloat(m.mdf_spent) || 0), 0);

    const totalCost = partnerCommissions + partnerMdf;

    // Partner revenue (from deal values in commissions)
    const partnerRevenue = commissions
      .filter(c => c.partner_name === name)
      .reduce((sum, c) => sum + (parseFloat(c.deal_value) || 0), 0);

    // ROI calculation
    const roi = totalCost > 0 ? ((partnerRevenue - totalCost) / totalCost * 100) : 0;
    const costPerAcquisition = partnerRevenue > 0 ? (totalCost / partnerRevenue * 100) : 0;

    return {
      id: partner.id,
      partner_name: name,
      tier: partner.tier || 'Unassigned',
      revenue: partnerRevenue,
      commissions: partnerCommissions,
      mdf: partnerMdf,
      totalCost,
      roi: Math.round(roi * 100) / 100,
      costPerAcquisition: Math.round(costPerAcquisition * 100) / 100,
      status: partner.status
    };
  });

  // Aggregate
  const totals = partnerROI.reduce((acc, p) => ({
    revenue: acc.revenue + p.revenue,
    cost: acc.cost + p.totalCost,
    commissions: acc.commissions + p.commissions,
    mdf: acc.mdf + p.mdf
  }), { revenue: 0, cost: 0, commissions: 0, mdf: 0 });

  totals.roi = totals.cost > 0 ? Math.round((totals.revenue - totals.cost) / totals.cost * 10000) / 100 : 0;

  return { partners: partnerROI, totals };
};

// ============================================
// DATA GAP ANALYSIS
// ============================================

export const getDataGapAnalysis = () => {
  const partners = getPartners();
  
  const fields = [
    { key: 'primary_contact', label: 'Primary Contact' },
    { key: 'tech_stack', label: 'Tech Stack', isArray: true },
    { key: 'contract_start', label: 'Contract Start' },
    { key: 'contract_end', label: 'Contract End' },
    { key: 'tier', label: 'Tier Level' },
    { key: 'tags', label: 'Tags', isArray: true },
    { key: 'website_url', label: 'Website URL' },
    { key: 'source', label: 'Lead Source' },
    { key: 'strategic_fit_scores', label: 'Strategic Fit Scores', isObject: true }
  ];

  const analysis = fields.map(field => {
    let filled = 0;
    partners.forEach(p => {
      const val = p[field.key];
      if (field.isArray) {
        if (Array.isArray(val) && val.length > 0) filled++;
      } else if (field.isObject) {
        if (val && typeof val === 'object' && Object.keys(val).length > 0) filled++;
      } else {
        if (val && val !== '' && val !== null && val !== undefined) filled++;
      }
    });

    const total = partners.length;
    const missing = total - filled;
    const completeness = total > 0 ? Math.round((filled / total) * 100) : 0;

    return {
      field: field.label,
      key: field.key,
      filled,
      missing,
      total,
      completeness
    };
  });

  // Sort by most incomplete first
  analysis.sort((a, b) => a.completeness - b.completeness);

  // Overall completeness
  const overallCompleteness = analysis.length > 0
    ? Math.round(analysis.reduce((sum, a) => sum + a.completeness, 0) / analysis.length)
    : 0;

  return { fields: analysis, overallCompleteness, partnerCount: partners.length };
};

// ============================================
// PARTNER COMPARISON
// ============================================

export const comparePartners = (partnerIds) => {
  const partners = getPartners();
  const commissions = getCommissions();
  const mdf = getMdf();
  const deals = getDeals();
  const interactions = getInteractions();
  const checklists = getChecklists();

  return partnerIds.map(id => {
    const partner = partners.find(p => p.id === id);
    if (!partner) return null;

    const name = partner.company_name;

    const partnerDeals = deals.filter(d => d.partner_id === id || d.partner_name === name);
    const partnerInteractions = interactions.filter(i => i.partner_id === id);
    const partnerCommissions = commissions.filter(c => c.partner_name === name);
    const partnerMdf = mdf.filter(m => m.partner_name === name);
    const partnerChecklists = checklists.filter(c => c.partner_id === id);

    const revenue = partnerCommissions.reduce((sum, c) => sum + (parseFloat(c.deal_value) || 0), 0);
    const commissionCost = partnerCommissions.reduce((sum, c) => sum + (parseFloat(c.commission_amount) || 0), 0);
    const mdfSpent = partnerMdf.reduce((sum, m) => sum + (parseFloat(m.mdf_spent) || 0), 0);

    const completedChecklist = partnerChecklists.filter(c => c.status === 'complete' || c.completed).length;
    const totalChecklist = partnerChecklists.length;

    return {
      id: partner.id,
      company_name: name,
      tier: partner.tier || 'Unassigned',
      status: partner.status || 'Active',
      health_score: partner.health_score || 0,
      data_completeness: partner.data_completeness || 0,
      deal_count: partnerDeals.length,
      deal_value: revenue,
      interaction_count: partnerInteractions.length,
      last_contact: partner.last_contact || 'N/A',
      commission_cost: commissionCost,
      mdf_spent: mdfSpent,
      total_cost: commissionCost + mdfSpent,
      roi: (commissionCost + mdfSpent) > 0
        ? Math.round((revenue - commissionCost - mdfSpent) / (commissionCost + mdfSpent) * 10000) / 100
        : 0,
      onboarding_progress: totalChecklist > 0
        ? Math.round((completedChecklist / totalChecklist) * 100)
        : 0,
      strategic_fit: partner.strategic_fit_scores || {},
      contract_end: partner.contract_end || 'N/A',
      source: partner.source || 'N/A'
    };
  }).filter(Boolean);
};

// ============================================
// AI UPDATE GENERATOR (uses Gemini via Stan)
// ============================================

export const generateUpdateReport = async (timeRange) => {
  const summary = getPortfolioSummary();
  const roiData = calculateROI();
  const gapData = getDataGapAnalysis();

  const apiKey = (() => {
    try {
      const settings = JSON.parse(localStorage.getItem('converge_settings') || '{}');
      if (settings.geminiApiKey) return settings.geminiApiKey;
    } catch { /* fall through */ }
    return import.meta.env.VITE_GEMINI_API_KEY || null;
  })();

  const prompt = `You are Stan, the AI assistant for Converge — CliniCONEX's Partner Relationship Management platform.

Generate a professional partnership program update report for the ${timeRange} period.

PORTFOLIO DATA:
${JSON.stringify(summary, null, 2)}

ROI DATA:
${JSON.stringify(roiData.totals, null, 2)}

DATA COMPLETENESS: ${gapData.overallCompleteness}%

Write a narrative-style update (not bullet points) covering:
1. Executive Summary — 2-3 sentences on overall program health
2. Partner Portfolio — Active partners, tier distribution, health trends
3. Pipeline Update — Prospect movement, new additions
4. Financial Performance — Revenue, commissions, MDF utilization, ROI
5. Key Highlights — Notable wins, milestones, achievements
6. Action Items — Top 3-5 priorities for the next period
7. Data Quality — Current completeness and improvement areas

Use specific numbers from the data. Write in a professional but conversational tone suitable for leadership review. Keep the total report under 500 words.`;

  if (!apiKey) {
    // Return mock report
    return `# Partnership Program Update — ${timeRange}

## Executive Summary
The partner program currently manages ${summary.partners.total} partners with an average health score of ${summary.partners.avgHealthScore}/100. The portfolio shows ${summary.partners.active} active partners and ${summary.partners.onboarding} in onboarding.

## Partner Portfolio
The current portfolio includes ${summary.partners.total} total partners distributed across tiers. ${summary.partners.atRiskCount} partner(s) are flagged as at-risk with health scores below 40. Average portfolio health sits at ${summary.partners.avgHealthScore}%.

## Pipeline Update
The prospect pipeline contains ${summary.prospects.total} active prospects across various qualification stages. Continued focus on pipeline velocity will be important for meeting recruitment targets.

## Financial Performance
Total commissions tracked: $${summary.financials.totalCommissions.toLocaleString()}. MDF allocated: $${summary.financials.totalMdfAllocated.toLocaleString()} with $${summary.financials.totalMdfSpent.toLocaleString()} spent (${summary.financials.totalMdfAllocated > 0 ? Math.round(summary.financials.totalMdfSpent / summary.financials.totalMdfAllocated * 100) : 0}% utilization). Total deal pipeline value: $${summary.financials.totalDealValue.toLocaleString()}.

## Activity Summary
${summary.activity.last30Days} interactions logged in the last 30 days across ${summary.activity.totalInteractions} total recorded touchpoints.

## Data Quality
Overall data completeness stands at ${gapData.overallCompleteness}% across ${gapData.partnerCount} partners. Priority fields for improvement have been identified in the Data Gap Visualizer.

---
*Configure your Gemini API key in Integrations to generate AI-powered narrative reports.*`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No report generated.';
  } catch (err) {
    throw new Error(`Failed to generate report: ${err.message}`);
  }
};

// ============================================
// PDF EXPORT
// ============================================

export const exportToPDF = (title, content) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @media print { @page { margin: 1in; } }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #404041;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #02475A;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #02475A;
      margin: 0 0 4px 0;
      font-size: 24px;
    }
    .header .subtitle {
      color: #ADC837;
      font-size: 14px;
      font-weight: 600;
    }
    .header .date {
      color: #888;
      font-size: 12px;
      margin-top: 8px;
    }
    h2 { color: #02475A; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    h3 { color: #02475A; font-size: 14px; margin-top: 16px; }
    p { margin: 8px 0; font-size: 13px; }
    pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th { background: #02475A; color: white; padding: 8px 12px; text-align: left; }
    td { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-green { background: #ecfdf5; color: #059669; }
    .badge-amber { background: #fffbeb; color: #d97706; }
    .badge-red { background: #fef2f2; color: #dc2626; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="subtitle">CliniCONEX Partner Program</div>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} | Converge PRM</div>
  </div>
  <pre>${content}</pre>
  <div class="footer">
    Confidential — CliniCONEX Inc. Internal Use Only<br>
    Generated by Converge PRM — ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
};

// ============================================
// PRESENTATION EXPORT (HTML-based)
// ============================================

export const exportToPresentation = () => {
  const summary = getPortfolioSummary();
  const roiData = calculateROI();
  const gapData = getDataGapAnalysis();

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Partner Program Overview</title>
  <style>
    @media print { 
      .slide { page-break-after: always; } 
      .slide:last-child { page-break-after: avoid; }
    }
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 0; color: #404041; }
    .slide {
      width: 100%;
      max-width: 960px;
      margin: 20px auto;
      padding: 48px;
      min-height: 540px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-sizing: border-box;
      position: relative;
    }
    .slide-title {
      background: linear-gradient(135deg, #02475A, #035d77);
      color: white;
    }
    .slide-title h1 { font-size: 36px; margin: 60px 0 12px; }
    .slide-title .subtitle { color: #ADC837; font-size: 18px; }
    .slide-title .date { color: rgba(255,255,255,0.7); font-size: 14px; margin-top: 40px; }
    h2 { color: #02475A; font-size: 24px; border-bottom: 3px solid #ADC837; padding-bottom: 8px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 24px; }
    .kpi-card { background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center; border-left: 4px solid #ADC837; }
    .kpi-card .value { font-size: 36px; font-weight: 700; color: #02475A; }
    .kpi-card .label { font-size: 13px; color: #666; margin-top: 4px; }
    .bar-row { display: flex; align-items: center; gap: 12px; margin: 8px 0; }
    .bar-label { width: 140px; font-size: 13px; font-weight: 500; }
    .bar-bg { flex: 1; height: 28px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 6px; display: flex; align-items: center; padding-left: 10px; font-size: 11px; color: white; font-weight: 600; }
    .bar-fill-green { background: #ADC837; }
    .bar-fill-teal { background: #02475A; }
    .bar-fill-amber { background: #f59e0b; }
    .bar-fill-red { background: #ef4444; }
    .slide-footer { position: absolute; bottom: 16px; left: 48px; right: 48px; font-size: 10px; color: #ccc; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <!-- Slide 1: Title -->
  <div class="slide slide-title">
    <h1>Partner Program Overview</h1>
    <div class="subtitle">CliniCONEX — Automated Care Platform</div>
    <div class="date">${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <div class="slide-footer" style="color:rgba(255,255,255,0.4)"><span>Confidential</span><span>Converge PRM</span></div>
  </div>

  <!-- Slide 2: KPIs -->
  <div class="slide">
    <h2>Portfolio Snapshot</h2>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="value">${summary.partners.total}</div><div class="label">Total Partners</div></div>
      <div class="kpi-card"><div class="value">${summary.partners.active}</div><div class="label">Active Partners</div></div>
      <div class="kpi-card"><div class="value">${summary.partners.avgHealthScore}%</div><div class="label">Avg Health Score</div></div>
      <div class="kpi-card"><div class="value">${summary.prospects.total}</div><div class="label">Active Prospects</div></div>
      <div class="kpi-card"><div class="value">$${summary.financials.totalDealValue.toLocaleString()}</div><div class="label">Pipeline Value</div></div>
      <div class="kpi-card"><div class="value">${summary.partners.atRiskCount}</div><div class="label">At Risk</div></div>
    </div>
    <div class="slide-footer"><span>Confidential</span><span>2</span></div>
  </div>

  <!-- Slide 3: Financials -->
  <div class="slide">
    <h2>Financial Performance</h2>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="value">$${summary.financials.totalCommissions.toLocaleString()}</div><div class="label">Total Commissions</div></div>
      <div class="kpi-card"><div class="value">$${summary.financials.totalMdfAllocated.toLocaleString()}</div><div class="label">MDF Allocated</div></div>
      <div class="kpi-card"><div class="value">$${summary.financials.totalMdfSpent.toLocaleString()}</div><div class="label">MDF Spent</div></div>
    </div>
    <div style="margin-top:32px">
      <h3 style="color:#02475A;font-size:16px">Program ROI</h3>
      <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr);margin-top:12px">
        <div class="kpi-card"><div class="value">${roiData.totals.roi}%</div><div class="label">Overall ROI</div></div>
        <div class="kpi-card"><div class="value">$${roiData.totals.revenue.toLocaleString()}</div><div class="label">Total Revenue</div></div>
      </div>
    </div>
    <div class="slide-footer"><span>Confidential</span><span>3</span></div>
  </div>

  <!-- Slide 4: Data Quality -->
  <div class="slide">
    <h2>Data Quality</h2>
    <div style="text-align:center;margin:24px 0">
      <div style="font-size:64px;font-weight:700;color:${gapData.overallCompleteness >= 70 ? '#ADC837' : gapData.overallCompleteness >= 40 ? '#f59e0b' : '#ef4444'}">${gapData.overallCompleteness}%</div>
      <div style="font-size:14px;color:#666">Overall Data Completeness</div>
    </div>
    ${gapData.fields.slice(0, 6).map(f => `
    <div class="bar-row">
      <div class="bar-label">${f.field}</div>
      <div class="bar-bg">
        <div class="bar-fill ${f.completeness >= 70 ? 'bar-fill-green' : f.completeness >= 40 ? 'bar-fill-amber' : 'bar-fill-red'}" style="width:${Math.max(f.completeness, 8)}%">${f.completeness}%</div>
      </div>
    </div>`).join('')}
    <div class="slide-footer"><span>Confidential</span><span>4</span></div>
  </div>

</body>
</html>`);
  printWindow.document.close();
};