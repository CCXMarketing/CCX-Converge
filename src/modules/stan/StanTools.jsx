import { useState, useEffect } from 'react';
import {
  generateEmailDraft,
  generateMeetingPrep,
  generateSuggestions,
  generateBulkActions,
  queryKnowledgeBase,
  addKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  getAllKnowledgeEntries,
  isAIConfigured,
  getMockResponse
} from '../../shared/services/stanService';

// ============================================
// EMAIL DRAFT GENERATOR
// ============================================
const EmailDraftTool = () => {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [scenario, setScenario] = useState('');
  const [customScenario, setCustomScenario] = useState('');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const aiConfigured = isAIConfigured();

  const scenarios = [
    { value: 'check_in', label: 'General Check-in' },
    { value: 'follow_up', label: 'Follow-up After Meeting' },
    { value: 'onboarding_nudge', label: 'Onboarding Nudge' },
    { value: 'renewal_conversation', label: 'Renewal Conversation' },
    { value: 'congratulations', label: 'Congratulations / Milestone' },
    { value: 're_engagement', label: 'Re-engagement' },
    { value: 'deal_update', label: 'Deal Status Update' },
    { value: 'introduction', label: 'New Partner Introduction' },
    { value: 'custom', label: 'Custom Scenario...' }
  ];

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('converge_partners') || '[]');
      setPartners(data);
    } catch { setPartners([]); }
  }, []);

  const handleGenerate = async () => {
    if (!selectedPartner) { setError('Please select a partner'); return; }
    const scenarioText = scenario === 'custom' ? customScenario : scenarios.find(s => s.value === scenario)?.label || scenario;
    if (!scenarioText) { setError('Please select an email scenario'); return; }

    setIsLoading(true);
    setError(null);
    setDraft('');

    try {
      let result;
      if (aiConfigured) {
        result = await generateEmailDraft(scenarioText, selectedPartner);
      } else {
        await new Promise(r => setTimeout(r, 1000));
        result = getMockResponse('email');
      }
      setDraft(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-[#02475A] font-semibold text-sm mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email Draft Generator
        </h3>
        <p className="text-xs text-gray-500 mb-4">Generate contextual partner emails using your Converge data.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Partner</label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837]"
            >
              <option value="">Select a partner...</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Scenario</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837]"
            >
              <option value="">Select scenario...</option>
              {scenarios.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {scenario === 'custom' && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Describe the email scenario</label>
              <textarea
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="e.g., Follow up on the training session we discussed last week..."
                rows={2}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837] resize-none placeholder-gray-400"
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-[#02475A] hover:bg-[#035d77] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Generating Draft...
              </>
            ) : (
              <>Generate Email Draft</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {draft && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500 font-medium">Generated Draft</span>
            <button
              onClick={handleCopy}
              className="text-xs text-[#02475A] hover:text-[#ADC837] flex items-center gap-1 transition-colors font-medium"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg> Copy</>
              )}
            </button>
          </div>
          <div className="p-4">
            <pre className="text-sm text-[#404041] whitespace-pre-wrap font-sans leading-relaxed">{draft}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MEETING PREP BRIEF
// ============================================
const MeetingPrepTool = () => {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [brief, setBrief] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const aiConfigured = isAIConfigured();

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('converge_partners') || '[]');
      setPartners(data);
    } catch { setPartners([]); }
  }, []);

  const handleGenerate = async () => {
    if (!selectedPartner) { setError('Please select a partner'); return; }
    setIsLoading(true);
    setError(null);
    setBrief('');

    try {
      let result;
      if (aiConfigured) {
        result = await generateMeetingPrep(selectedPartner);
      } else {
        await new Promise(r => setTimeout(r, 1200));
        result = getMockResponse('meetingPrep');
      }
      setBrief(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(brief);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Meeting Prep Brief</title>
      <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}
      h1,h2,h3{color:#02475A}pre{white-space:pre-wrap;font-family:inherit}</style></head>
      <body><h1>Meeting Preparation Brief</h1><pre>${brief}</pre>
      <p style="color:#999;font-size:12px;margin-top:40px">Generated by Stan AI — Converge PRM — ${new Date().toLocaleDateString()}</p></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-[#02475A] font-semibold text-sm mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Meeting Prep Brief
        </h3>
        <p className="text-xs text-gray-500 mb-4">Auto-generate a one-page summary for your next partner meeting.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Partner</label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837]"
            >
              <option value="">Select a partner...</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.company_name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-[#02475A] hover:bg-[#035d77] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Generating Brief...
              </>
            ) : (
              <>Generate Meeting Brief</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {brief && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500 font-medium">Meeting Brief</span>
            <div className="flex items-center gap-3">
              <button onClick={handleCopy} className="text-xs text-[#02475A] hover:text-[#ADC837] transition-colors font-medium">Copy</button>
              <span className="text-gray-300">|</span>
              <button onClick={handlePrint} className="text-xs text-[#02475A] hover:text-[#ADC837] transition-colors font-medium">Print</button>
            </div>
          </div>
          <div className="p-4">
            <pre className="text-sm text-[#404041] whitespace-pre-wrap font-sans leading-relaxed">{brief}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SUGGESTION ENGINE
// ============================================
const SuggestionsTool = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());
  const aiConfigured = isAIConfigured();

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setDismissed(new Set());

    try {
      let result;
      if (aiConfigured) {
        result = await generateSuggestions();
      } else {
        await new Promise(r => setTimeout(r, 1000));
        result = getMockResponse('suggestions');
      }
      setSuggestions(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (idx) => {
    setDismissed(prev => new Set([...prev, idx]));
  };

  const priorityColors = {
    High: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
    Medium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    Low: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' }
  };

  const categoryIcons = {
    'Follow-up': '📞',
    'Renewal': '🔄',
    'Re-engagement': '🔔',
    'Tier Upgrade': '⬆️',
    'Data Completion': '📋',
    'Financial': '💰',
    'Info': 'ℹ️'
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-[#02475A] font-semibold text-sm mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Next Best Actions
        </h3>
        <p className="text-xs text-gray-500 mb-3">AI-powered recommendations based on your partner portfolio.</p>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-[#02475A] hover:bg-[#035d77] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Analyzing Portfolio...
            </>
          ) : suggestions.length > 0 ? 'Refresh Suggestions' : 'Generate Suggestions'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, idx) => {
            if (dismissed.has(idx)) return null;
            const colors = priorityColors[s.priority] || priorityColors.Medium;
            const icon = categoryIcons[s.category] || '📌';
            return (
              <div key={idx} className={`${colors.bg} border ${colors.border} rounded-xl p-3 transition-all`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">{icon}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{s.priority}</span>
                      <span className="text-xs text-gray-500">{s.category}</span>
                    </div>
                    <p className="text-sm text-[#02475A] font-medium mb-1">{s.partner}</p>
                    <p className="text-xs text-[#404041]">{s.action}</p>
                    <p className="text-xs text-gray-400 mt-1 italic">{s.reason}</p>
                  </div>
                  <button
                    onClick={() => handleDismiss(idx)}
                    className="text-gray-300 hover:text-gray-500 shrink-0 mt-1"
                    title="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// BULK ACTION RECOMMENDATIONS
// ============================================
const BulkActionsTool = () => {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const aiConfigured = isAIConfigured();

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (aiConfigured) {
        result = await generateBulkActions();
      } else {
        await new Promise(r => setTimeout(r, 1000));
        result = getMockResponse('bulkActions');
      }
      setBatches(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-[#02475A] font-semibold text-sm mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Bulk Action Batches
        </h3>
        <p className="text-xs text-gray-500 mb-3">Group similar tasks across partners for focused work blocks.</p>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-[#02475A] hover:bg-[#035d77] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Analyzing...
            </>
          ) : batches.length > 0 ? 'Refresh Batches' : 'Generate Batches'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      {batches.length > 0 && (
        <div className="space-y-2">
          {batches.map((batch, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setExpandedBatch(expandedBatch === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#02475A] flex items-center justify-center text-white text-sm font-bold">
                    {batch.count}
                  </div>
                  <div>
                    <p className="text-sm text-[#404041] font-medium">{batch.theme}</p>
                    <p className="text-xs text-gray-400">{batch.estimatedTime}</p>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedBatch === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedBatch === idx && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Partners</p>
                      <div className="flex flex-wrap gap-1">
                        {batch.partners.map((p, pi) => (
                          <span key={pi} className="text-xs bg-gray-100 text-[#404041] px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Approach</p>
                      <p className="text-xs text-[#404041]">{batch.approach}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// KNOWLEDGE BASE
// ============================================
const KnowledgeBaseTool = () => {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const aiConfigured = isAIConfigured();

  const categories = ['General', 'Commissions', 'Onboarding', 'MDF', 'Contracts', 'Tiers', 'Policies', 'Technical'];

  useEffect(() => {
    setEntries(getAllKnowledgeEntries());
  }, []);

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) return;
    if (editingId) {
      updateKnowledgeEntry(editingId, { question: question.trim(), answer: answer.trim(), category });
    } else {
      addKnowledgeEntry({ question: question.trim(), answer: answer.trim(), category });
    }
    setEntries(getAllKnowledgeEntries());
    resetForm();
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setQuestion(entry.question);
    setAnswer(entry.answer);
    setCategory(entry.category || 'General');
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this knowledge base entry?')) {
      deleteKnowledgeEntry(id);
      setEntries(getAllKnowledgeEntries());
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategory('General');
  };

  const handleAsk = async () => {
    if (!searchQuery.trim()) return;
    setIsAsking(true);
    setAiAnswer('');

    try {
      if (aiConfigured) {
        const result = await queryKnowledgeBase(searchQuery);
        setAiAnswer(result);
      } else {
        await new Promise(r => setTimeout(r, 800));
        setAiAnswer('Configure your Gemini API key to get AI-powered answers from the knowledge base. In the meantime, browse the entries below or add new ones.');
      }
    } catch (err) {
      setAiAnswer(`Error: ${err.message}`);
    } finally {
      setIsAsking(false);
    }
  };

  const filteredEntries = entries.filter(e =>
    !searchQuery ||
    e.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search / Ask */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <h3 className="text-[#02475A] font-semibold text-sm mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ADC837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Partner FAQ Knowledge Base
        </h3>

        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Search or ask a question..."
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837] placeholder-gray-400"
          />
          <button
            onClick={handleAsk}
            disabled={isAsking || !searchQuery.trim()}
            className="px-3 py-2 bg-[#02475A] hover:bg-[#035d77] text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isAsking ? '...' : 'Ask'}
          </button>
        </div>

        {aiAnswer && (
          <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-[#ADC837] font-bold mb-1">Stan&apos;s Answer</p>
            <p className="text-sm text-[#404041] whitespace-pre-wrap">{aiAnswer}</p>
          </div>
        )}
      </div>

      {/* Add / Edit */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{entries.length} entries</span>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="text-xs text-[#02475A] hover:text-[#ADC837] flex items-center gap-1 transition-colors font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 border-2 border-[#ADC837]/40 shadow-sm">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Question / Topic</label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the commission structure for Gold partners?"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837] placeholder-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="The detailed answer..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837] resize-none placeholder-gray-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-[#404041] text-sm focus:outline-none focus:border-[#ADC837]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={!question.trim() || !answer.trim()}
              className="w-full bg-[#ADC837] hover:bg-[#9ab82f] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {editingId ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      {/* Entries */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-2">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{entry.category}</span>
                  </div>
                  <p className="text-sm text-[#02475A] font-medium mb-1">{entry.question}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{entry.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleEdit(entry)} className="p-1 text-gray-300 hover:text-[#02475A] transition-colors" title="Edit">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No knowledge base entries yet.</p>
          <p className="text-gray-400 text-xs mt-1">Add FAQs about commissions, onboarding, tiers, and policies.</p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">No entries match your search.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN EXPORT
// ============================================
const StanTools = () => {
  const [activeTab, setActiveTab] = useState('suggestions');

  const tabs = [
    { id: 'suggestions', label: 'Suggestions', icon: '💡' },
    { id: 'email', label: 'Email Draft', icon: '✉️' },
    { id: 'meeting', label: 'Meeting Prep', icon: '📋' },
    { id: 'bulk', label: 'Bulk Actions', icon: '📦' },
    { id: 'kb', label: 'Knowledge Base', icon: '📚' }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#02475A] text-white shadow-sm'
                : 'text-gray-500 hover:text-[#02475A] hover:bg-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {activeTab === 'suggestions' && <SuggestionsTool />}
        {activeTab === 'email' && <EmailDraftTool />}
        {activeTab === 'meeting' && <MeetingPrepTool />}
        {activeTab === 'bulk' && <BulkActionsTool />}
        {activeTab === 'kb' && <KnowledgeBaseTool />}
      </div>
    </div>
  );
};

export default StanTools;