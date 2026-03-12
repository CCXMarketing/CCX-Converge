import { useState, useEffect } from 'react';
import { clearAllData } from '../../utils/clearDatabase';

// ============================================
// API KEY VAULT
// ============================================
const ApiKeyVault = () => {
  const [keys, setKeys] = useState({});
  const [editing, setEditing] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState({});

  const keyConfig = [
    { id: 'geminiApiKey', label: 'Gemini AI', description: 'Powers Scout analysis and Stan AI assistant', required: true },
    { id: 'activeCampaignApiKey', label: 'ActiveCampaign API Key', description: 'CRM bidirectional sync via MCP', required: true },
    { id: 'activeCampaignUrl', label: 'ActiveCampaign URL', description: 'Your ActiveCampaign account URL (e.g., https://account.api-us1.com)', required: true },
    { id: 'newsApiKey', label: 'News API', description: 'Industry News Monitor in Scout', required: false },
    { id: 'googlePlacesApiKey', label: 'Google Places API', description: 'Company discovery and location data', required: false },
    { id: 'builtWithApiKey', label: 'BuiltWith API', description: 'Technology stack detection ($295/mo)', required: false },
    { id: 'crunchbaseApiKey', label: 'Crunchbase API', description: 'Funding & company intelligence (25 free/mo)', required: false }
  ];

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    try {
      const settings = JSON.parse(localStorage.getItem('converge_settings') || '{}');
      setKeys(settings);
    } catch { setKeys({}); }
  };

  const handleSave = (keyId) => {
    if (!inputValue.trim()) return;
    try {
      const settings = JSON.parse(localStorage.getItem('converge_settings') || '{}');
      settings[keyId] = inputValue.trim();
      settings[`${keyId}_updated`] = new Date().toISOString();
      localStorage.setItem('converge_settings', JSON.stringify(settings));
      setKeys(settings);
      setEditing(null);
      setInputValue('');
    } catch { /* fail silently */ }
  };

  const handleDelete = (keyId) => {
    if (!window.confirm('Remove this API key?')) return;
    try {
      const settings = JSON.parse(localStorage.getItem('converge_settings') || '{}');
      delete settings[keyId];
      delete settings[`${keyId}_updated`];
      localStorage.setItem('converge_settings', JSON.stringify(settings));
      setKeys(settings);
    } catch { /* fail silently */ }
  };

  const maskKey = (key) => {
    if (!key || key.length < 8) return '••••••••';
    return '••••••••••••' + key.slice(-4);
  };

  const formatDate = (iso) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-[#02475A] font-semibold text-sm mb-1 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          API Key Vault
        </h3>
        <p className="text-xs text-gray-500">Securely store API credentials. Keys are masked after entry.</p>
      </div>

      {keyConfig.map(config => {
        const hasKey = !!keys[config.id];
        const isEditing = editing === config.id;
        const updatedAt = keys[`${config.id}_updated`];

        return (
          <div key={config.id} className={`bg-white rounded-xl border ${hasKey ? 'border-green-200' : 'border-gray-200'} shadow-sm overflow-hidden`}>
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <h4 className="text-sm font-medium text-[#404041]">{config.label}</h4>
                    {config.required && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Required</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 ml-4">{config.description}</p>
                  {hasKey && (
                    <div className="flex items-center gap-3 mt-1.5 ml-4">
                      <code className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded font-mono">
                        {showKey[config.id] ? keys[config.id] : maskKey(keys[config.id])}
                      </code>
                      <button
                        onClick={() => setShowKey(prev => ({ ...prev, [config.id]: !prev[config.id] }))}
                        className="text-[10px] text-gray-400 hover:text-[#02475A] transition-colors"
                      >
                        {showKey[config.id] ? 'Hide' : 'Show'}
                      </button>
                      {updatedAt && <span className="text-[10px] text-gray-400">Updated: {formatDate(updatedAt)}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {hasKey ? (
                    <>
                      <button
                        onClick={() => { setEditing(config.id); setInputValue(keys[config.id] || ''); }}
                        className="text-xs text-gray-400 hover:text-[#02475A] px-2 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setEditing(config.id); setInputValue(''); }}
                      className="text-xs bg-[#02475A] text-white px-3 py-1 rounded-lg hover:bg-[#035d77] transition-colors"
                    >
                      Add Key
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 ml-4 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave(config.id)}
                    placeholder={`Enter ${config.label}...`}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] font-mono focus:outline-none focus:border-[#ADC837]"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(config.id)}
                    className="text-xs bg-[#ADC837] text-white px-3 py-2 rounded-lg hover:bg-[#9ab82f] transition-colors font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditing(null); setInputValue(''); }}
                    className="text-xs text-gray-400 hover:text-[#404041] px-2 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// SYSTEM HEALTH
// ============================================
const SystemHealth = () => {
  const [health, setHealth] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const keys = JSON.parse(localStorage.getItem('converge_settings') || '{}');
      const integrations = [
        { name: 'Firebase', description: 'Database & Auth', status: 'connected', lastSync: new Date().toISOString(), errors24h: 0 },
        { name: 'Gemini AI', description: 'Scout & Stan AI', status: keys.geminiApiKey ? 'connected' : 'not_configured', lastSync: keys.geminiApiKey_updated || null, errors24h: 0 },
        { name: 'ActiveCampaign', description: 'CRM / Email (MCP)', status: keys.activeCampaignApiKey ? 'connected' : 'not_configured', lastSync: keys.activeCampaignApiKey_updated || null, errors24h: 0 },
        { name: 'News API', description: 'Industry Monitoring', status: keys.newsApiKey ? 'connected' : 'not_configured', lastSync: keys.newsApiKey_updated || null, errors24h: 0 },
        { name: 'Google Places', description: 'Company Discovery', status: keys.googlePlacesApiKey ? 'connected' : 'not_configured', lastSync: keys.googlePlacesApiKey_updated || null, errors24h: 0 },
        { name: 'BuiltWith', description: 'Tech Stack Detection', status: keys.builtWithApiKey ? 'connected' : 'not_configured', lastSync: keys.builtWithApiKey_updated || null, errors24h: 0 },
        { name: 'Crunchbase', description: 'Funding Intelligence', status: keys.crunchbaseApiKey ? 'connected' : 'not_configured', lastSync: keys.crunchbaseApiKey_updated || null, errors24h: 0 }
      ];

      // Quick Gemini test
      if (keys.geminiApiKey) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply OK' }] }], generationConfig: { maxOutputTokens: 5 } })
            }
          );
          const g = integrations.find(i => i.name === 'Gemini AI');
          g.status = resp.ok ? 'connected' : 'error';
          if (!resp.ok) g.errors24h = 1;
        } catch {
          const g = integrations.find(i => i.name === 'Gemini AI');
          g.status = 'error';
          g.errors24h = 1;
        }
      }

      setHealth(integrations);
    } catch { /* fail */ }
    setIsChecking(false);
  };

  const statusConfig = {
    connected: { color: 'bg-green-500', label: 'Connected', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    not_configured: { color: 'bg-gray-300', label: 'Not Configured', textColor: 'text-gray-500', bgColor: 'bg-gray-50' },
    error: { color: 'bg-red-500', label: 'Error', textColor: 'text-red-700', bgColor: 'bg-red-50' },
    degraded: { color: 'bg-amber-400', label: 'Degraded', textColor: 'text-amber-700', bgColor: 'bg-amber-50' }
  };

  const formatDate = (iso) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const connectedCount = health.filter(h => h.status === 'connected').length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-[#02475A] font-semibold text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            System Health
          </h3>
          <p className="text-xs text-gray-500">{connectedCount} of {health.length} integrations connected</p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={isChecking}
          className="text-xs bg-gray-100 text-[#02475A] px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-1 disabled:opacity-50"
        >
          {isChecking ? (
            <><span className="w-3 h-3 border-2 border-gray-300 border-t-[#02475A] rounded-full animate-spin"></span> Checking...</>
          ) : (
            <>Refresh</>
          )}
        </button>
      </div>

      <div className="space-y-2">
        {health.map(item => {
          const cfg = statusConfig[item.status] || statusConfig.not_configured;
          return (
            <div key={item.name} className={`${cfg.bgColor} rounded-xl border border-gray-200 p-3 shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${cfg.color}`}></span>
                  <div>
                    <p className="text-sm font-medium text-[#404041]">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${cfg.textColor}`}>{cfg.label}</span>
                  <p className="text-[10px] text-gray-400">Last sync: {formatDate(item.lastSync)}</p>
                  {item.errors24h > 0 && (
                    <p className="text-[10px] text-red-500">{item.errors24h} error(s) in 24h</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// ACTIVITY LOG
// ============================================
const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [filterIntegration, setFilterIntegration] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filterIntegration, filterStatus]);

  const loadLogs = () => {
    try {
      let data = JSON.parse(localStorage.getItem('converge_activity_log') || '[]');
      if (filterIntegration) data = data.filter(l => l.integration === filterIntegration);
      if (filterStatus) data = data.filter(l => l.status === filterStatus);
      setLogs(data.slice(0, 50));
    } catch { setLogs([]); }
  };

  const handleClear = () => {
    if (!window.confirm('Clear all activity logs?')) return;
    localStorage.setItem('converge_activity_log', '[]');
    setLogs([]);
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleString('en-CA', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const integrations = [...new Set(logs.map(l => l.integration))];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#02475A] font-semibold text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity Log
          </h3>
          <button onClick={handleClear} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear Log</button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterIntegration}
            onChange={(e) => setFilterIntegration(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-[#404041] focus:outline-none focus:border-[#ADC837]"
          >
            <option value="">All Integrations</option>
            {integrations.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-[#404041] focus:outline-none focus:border-[#ADC837]"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#02475A]">{log.integration}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{log.eventType}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{log.details}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{formatDate(log.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No activity logged yet.</p>
          <p className="text-gray-400 text-xs mt-1">Events will appear here as you use integrations.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// FIELD MAPPER
// ============================================
const FieldMapper = () => {
  const [mappings, setMappings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    convergeField: '', externalSystem: 'ActiveCampaign', externalField: '', direction: 'bidirectional', transformRule: 'none'
  });
  const [editingId, setEditingId] = useState(null);

  const convergeFields = [
    'partner.status', 'partner.tier', 'partner.company_name', 'partner.primary_contact',
    'partner.health_score', 'partner.tags', 'deal.stage', 'deal.value',
    'prospect.pipeline_stage', 'prospect.source'
  ];
  const externalSystems = ['ActiveCampaign', 'Webhook', 'Custom'];
  const directions = [
    { value: 'converge_to_external', label: 'Converge → External' },
    { value: 'external_to_converge', label: 'External → Converge' },
    { value: 'bidirectional', label: 'Bidirectional' }
  ];
  const transforms = [
    { value: 'none', label: 'None (direct copy)' },
    { value: 'uppercase', label: 'Uppercase' },
    { value: 'lowercase', label: 'Lowercase' },
    { value: 'boolean_to_tag', label: 'Boolean → Tag' },
    { value: 'custom', label: 'Custom Rule' }
  ];

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = () => {
    try { setMappings(JSON.parse(localStorage.getItem('converge_field_mappings') || '[]')); }
    catch { setMappings([]); }
  };

  const handleSave = () => {
    if (!formData.convergeField || !formData.externalField) return;
    const entry = {
      ...formData,
      id: editingId || `map_${Date.now()}`,
      enabled: true,
      created_at: editingId ? formData.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const existing = mappings.findIndex(m => m.id === entry.id);
    const updated = [...mappings];
    if (existing >= 0) { updated[existing] = entry; } else { updated.push(entry); }
    localStorage.setItem('converge_field_mappings', JSON.stringify(updated));
    setMappings(updated);
    resetForm();
  };

  const handleEdit = (mapping) => {
    setFormData(mapping);
    setEditingId(mapping.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this field mapping?')) return;
    const updated = mappings.filter(m => m.id !== id);
    localStorage.setItem('converge_field_mappings', JSON.stringify(updated));
    setMappings(updated);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ convergeField: '', externalSystem: 'ActiveCampaign', externalField: '', direction: 'bidirectional', transformRule: 'none' });
  };

  const directionArrows = { converge_to_external: '→', external_to_converge: '←', bidirectional: '↔' };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-[#02475A] font-semibold text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Field Mapper
          </h3>
          <p className="text-xs text-gray-500">{mappings.length} mapping(s) configured</p>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="text-xs bg-[#02475A] text-white px-3 py-1.5 rounded-lg hover:bg-[#035d77] transition-colors font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Mapping'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 border-2 border-[#ADC837]/40 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Converge Field</label>
              <select value={formData.convergeField} onChange={(e) => setFormData({ ...formData, convergeField: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]">
                <option value="">Select field...</option>
                {convergeFields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">External System</label>
              <select value={formData.externalSystem} onChange={(e) => setFormData({ ...formData, externalSystem: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]">
                {externalSystems.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">External Field</label>
              <input value={formData.externalField} onChange={(e) => setFormData({ ...formData, externalField: e.target.value })} placeholder="e.g., contact_tag" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837] placeholder-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Direction</label>
              <select value={formData.direction} onChange={(e) => setFormData({ ...formData, direction: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]">
                {directions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Transform Rule</label>
            <select value={formData.transformRule} onChange={(e) => setFormData({ ...formData, transformRule: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]">
              {transforms.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button onClick={handleSave} disabled={!formData.convergeField || !formData.externalField} className="w-full bg-[#ADC837] hover:bg-[#9ab82f] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {editingId ? 'Update Mapping' : 'Save Mapping'}
          </button>
        </div>
      )}

      {mappings.length > 0 ? (
        <div className="space-y-2">
          {mappings.map(m => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <code className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">{m.convergeField}</code>
                  <span className="text-sm font-bold text-[#ADC837]">{directionArrows[m.direction] || '↔'}</span>
                  <code className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono">{m.externalField}</code>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{m.externalSystem}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleEdit(m)} className="p-1 text-gray-300 hover:text-[#02475A] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No field mappings configured.</p>
          <p className="text-gray-400 text-xs mt-1">Map Converge fields to external systems like ActiveCampaign.</p>
        </div>
      ) : null}
    </div>
  );
};

// ============================================
// WEBHOOK MANAGER
// ============================================
const WebhookManager = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'outgoing', url: '', event: '', authType: 'none', authValue: '' });

  const outgoingEvents = [
    'partner.promoted', 'partner.tier_changed', 'partner.archived',
    'deal.registered', 'deal.closed', 'contract.renewal_triggered', 'milestone.achieved'
  ];
  const incomingEvents = ['crm.deal_closed', 'crm.contact_updated', 'payment.processed'];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = () => {
    try { setWebhooks(JSON.parse(localStorage.getItem('converge_webhooks') || '[]')); }
    catch { setWebhooks([]); }
  };

  const handleSave = () => {
    if (!formData.name || !formData.url || !formData.event) return;
    const entry = {
      ...formData,
      id: editingId || `wh_${Date.now()}`,
      enabled: true,
      created_at: editingId ? formData.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const existing = webhooks.findIndex(w => w.id === entry.id);
    const updated = [...webhooks];
    if (existing >= 0) { updated[existing] = entry; } else { updated.push(entry); }
    localStorage.setItem('converge_webhooks', JSON.stringify(updated));
    setWebhooks(updated);
    resetForm();
  };

  const handleToggle = (id) => {
    const updated = webhooks.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    localStorage.setItem('converge_webhooks', JSON.stringify(updated));
    setWebhooks(updated);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this webhook?')) return;
    const updated = webhooks.filter(w => w.id !== id);
    localStorage.setItem('converge_webhooks', JSON.stringify(updated));
    setWebhooks(updated);
  };

  const handleEdit = (wh) => {
    setFormData(wh);
    setEditingId(wh.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', type: 'outgoing', url: '', event: '', authType: 'none', authValue: '' });
  };

  const events = formData.type === 'outgoing' ? outgoingEvents : incomingEvents;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-[#02475A] font-semibold text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Webhooks
          </h3>
          <p className="text-xs text-gray-500">{webhooks.length} webhook(s) configured</p>
        </div>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)} className="text-xs bg-[#02475A] text-white px-3 py-1.5 rounded-lg hover:bg-[#035d77] transition-colors font-medium">
          {showForm ? 'Cancel' : '+ Add Webhook'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 border-2 border-[#ADC837]/40 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Partner Promoted → AC" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837] placeholder-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value, event: '' })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]">
                <option value="outgoing">Outgoing (Converge → External)</option>
                <option value="incoming">Incoming (External → Converge)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">URL</label>
              <input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] font-mono focus:outline-none focus:border-[#ADC837] placeholder-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Event Trigger</label>
              <select value={formData.event} onChange={(e) => setFormData({ ...formData, event: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]">
                <option value="">Select event...</option>
                {events.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Auth Type</label>
              <select value={formData.authType} onChange={(e) => setFormData({ ...formData, authType: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]">
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="header">Custom Header</option>
              </select>
            </div>
            {formData.authType !== 'none' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Auth Value</label>
                <input type="password" value={formData.authValue} onChange={(e) => setFormData({ ...formData, authValue: e.target.value })} placeholder="Token or credentials" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837] placeholder-gray-400" />
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={!formData.name || !formData.url || !formData.event} className="w-full bg-[#ADC837] hover:bg-[#9ab82f] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {editingId ? 'Update Webhook' : 'Save Webhook'}
          </button>
        </div>
      )}

      {webhooks.length > 0 ? (
        <div className="space-y-2">
          {webhooks.map(wh => (
            <div key={wh.id} className={`bg-white border rounded-xl p-3 shadow-sm ${wh.enabled ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${wh.type === 'outgoing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {wh.type === 'outgoing' ? 'OUT →' : '← IN'}
                    </span>
                    <span className="text-sm font-medium text-[#404041]">{wh.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-mono truncate max-w-[200px]">{wh.url}</code>
                    <span className="text-[10px] text-gray-400">{wh.event}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(wh.id)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${wh.enabled ? 'bg-[#ADC837]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${wh.enabled ? 'left-4' : 'left-0.5'}`}></span>
                  </button>
                  <button onClick={() => handleEdit(wh)} className="p-1 text-gray-300 hover:text-[#02475A] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(wh.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No webhooks configured.</p>
          <p className="text-gray-400 text-xs mt-1">Set up event-driven integrations between Converge and external systems.</p>
        </div>
      ) : null}
    </div>
  );
};

// ============================================
// CURRENCY SETTINGS
// ============================================
const CurrencySettings = () => {
  const [rate, setRate] = useState('1.36');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('converge_settings') || '{}');
      if (settings.exchangeRate) setRate(String(settings.exchangeRate));
      if (settings.exchangeRateDate) setEffectiveDate(settings.exchangeRateDate);
    } catch { /* defaults */ }
  }, []);

  const handleSave = () => {
    try {
      const settings = JSON.parse(localStorage.getItem('converge_settings') || '{}');
      settings.exchangeRate = parseFloat(rate);
      settings.exchangeRateDate = effectiveDate;
      localStorage.setItem('converge_settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* fail */ }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
      <h3 className="text-[#02475A] font-semibold text-sm mb-1 flex items-center gap-2">
        <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Currency Settings
      </h3>
      <p className="text-xs text-gray-500 mb-4">All financials report in CAD. Set the USD → CAD conversion rate below.</p>

      <div className="flex items-end gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">1 USD = ? CAD</label>
          <input
            type="number"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-32 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Effective Date</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-[#ADC837]"
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-[#02475A] hover:bg-[#035d77] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
};

// ============================================
// DANGER ZONE — Database Clear
// ============================================
const DangerZone = () => {
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [results, setResults] = useState(null);

  const handleClear = async () => {
    if (confirmText !== 'DELETE') return;

    setStatus('running');
    try {
      const res = await clearAllData();
      setResults(res);
      setStatus('done');
    } catch (err) {
      setResults({ _error: err.message });
      setStatus('error');
    }
  };

  const totalDeleted = results
    ? Object.values(results).reduce((sum, r) => sum + (r.deleted || 0), 0)
    : 0;

  const errors = results
    ? Object.entries(results).filter(([, r]) => r.error)
    : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
        <h3 className="text-red-700 font-semibold text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Danger Zone
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Irreversible actions. These cannot be undone.
        </p>
      </div>

      <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm overflow-hidden">
        <div className="p-4">
          <h4 className="text-sm font-medium text-[#404041]">Clear All Data</h4>
          <p className="text-xs text-gray-500 mt-1">
            Permanently delete all partner, prospect, interaction, deal, commission, MDF, payout, and checklist records.
            Settings, tags, knowledge base, and webhooks will be preserved.
          </p>

          {status === 'idle' && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-red-600 font-medium">
                This will permanently delete all partner, prospect, and transaction data. This cannot be undone. Type DELETE to confirm.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="flex-1 max-w-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#404041] focus:outline-none focus:border-red-400 placeholder-gray-400"
                />
                <button
                  onClick={handleClear}
                  disabled={confirmText !== 'DELETE'}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Database
                </button>
              </div>
            </div>
          )}

          {status === 'running' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></span>
              Clearing data... This may take a moment.
            </div>
          )}

          {status === 'done' && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-green-700">
                Database cleared successfully. {totalDeleted} document(s) deleted.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                {Object.entries(results).map(([name, r]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="font-mono">{name}</span>
                    <span>{r.error ? <span className="text-red-500">{r.error}</span> : `${r.deleted} deleted`}</span>
                  </div>
                ))}
              </div>
              {errors.length > 0 && (
                <p className="text-xs text-red-500">{errors.length} collection(s) had errors.</p>
              )}
              <button
                onClick={() => { setStatus('idle'); setConfirmText(''); setResults(null); }}
                className="text-xs text-gray-400 hover:text-[#02475A] transition-colors"
              >
                Reset
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-red-600">
                Failed to clear database: {results?._error || 'Unknown error'}
              </p>
              <button
                onClick={() => { setStatus('idle'); setConfirmText(''); setResults(null); }}
                className="text-xs text-gray-400 hover:text-[#02475A] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN EXPORT
// ============================================
const IntegrationsPanel = ({ activeTab }) => {
  return (
    <div>
      {activeTab === 'vault' && <ApiKeyVault />}
      {activeTab === 'health' && <SystemHealth />}
      {activeTab === 'log' && <ActivityLog />}
      {activeTab === 'mapper' && <FieldMapper />}
      {activeTab === 'webhooks' && <WebhookManager />}
      {activeTab === 'currency' && <CurrencySettings />}
      {activeTab === 'danger' && <DangerZone />}
    </div>
  );
};

export default IntegrationsPanel;