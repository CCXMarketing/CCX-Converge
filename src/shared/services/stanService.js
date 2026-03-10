// Stan AI Assistant - Service Layer
// Handles all Stan interactions with Gemini API and local data

import {
  CHAT_PROMPT,
  EMAIL_DRAFT_PROMPT,
  MEETING_PREP_PROMPT,
  SUGGESTION_PROMPT,
  BULK_ACTIONS_PROMPT,
  KNOWLEDGE_BASE_PROMPT,
  DATA_ENTRY_PROMPT
} from '../../config/stanPrompts';

// ============================================
// GEMINI API INTEGRATION
// ============================================

const getGeminiApiKey = () => {
  // Check localStorage settings first, then env
  try {
    const settings = JSON.parse(localStorage.getItem('converge_settings') || '{}');
    if (settings.geminiApiKey) return settings.geminiApiKey;
  } catch (e) {
    // fall through
  }
  return import.meta.env.VITE_GEMINI_API_KEY || null;
};

const callGemini = async (prompt) => {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Go to Integrations → API Key Vault to add your key.');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response generated. The AI model returned an empty result.');
    }
    
    return text;
  } catch (error) {
    if (error.message.includes('API key')) throw error;
    if (error.message.includes('Gemini API error')) throw error;
    throw new Error(`Failed to connect to AI service: ${error.message}`);
  }
};

// ============================================
// LOCAL DATA HELPERS
// ============================================

const getPartnersData = () => {
  try {
    const data = JSON.parse(localStorage.getItem('converge_partners') || '[]');
    return data.map(p => ({
      id: p.id,
      company_name: p.company_name,
      status: p.status,
      tier: p.tier,
      health_score: p.health_score,
      primary_contact: p.primary_contact,
      last_contact: p.last_contact,
      contract_start: p.contract_start,
      contract_end: p.contract_end,
      tags: p.tags,
      tech_stack: p.tech_stack,
      data_completeness: p.data_completeness,
      strategic_fit_scores: p.strategic_fit_scores,
      source: p.source
    }));
  } catch {
    return [];
  }
};

const getProspectsData = () => {
  try {
    return JSON.parse(localStorage.getItem('converge_prospects') || '[]');
  } catch {
    return [];
  }
};

const getEconomicsData = () => {
  try {
    const commissions = JSON.parse(localStorage.getItem('converge_commissions') || '[]');
    const mdf = JSON.parse(localStorage.getItem('converge_mdf') || '[]');
    const payouts = JSON.parse(localStorage.getItem('converge_payouts') || '[]');
    
    const totalCommOwed = commissions.reduce((sum, c) => sum + (parseFloat(c.commission_amount) || 0), 0);
    const totalMdfAllocated = mdf.reduce((sum, m) => sum + (parseFloat(m.mdf_allocated) || 0), 0);
    const totalMdfSpent = mdf.reduce((sum, m) => sum + (parseFloat(m.mdf_spent) || 0), 0);
    const overduePayouts = payouts.filter(p => p.status === 'Overdue').length;
    
    return {
      commissions_summary: {
        total_entries: commissions.length,
        total_owed: totalCommOwed,
        recent: commissions.slice(0, 5)
      },
      mdf_summary: {
        total_allocated: totalMdfAllocated,
        total_spent: totalMdfSpent,
        remaining: totalMdfAllocated - totalMdfSpent
      },
      payouts_summary: {
        total: payouts.length,
        overdue: overduePayouts,
        recent: payouts.slice(0, 5)
      }
    };
  } catch {
    return { commissions_summary: {}, mdf_summary: {}, payouts_summary: {} };
  }
};

const getInteractionsForPartner = (partnerId) => {
  try {
    const all = JSON.parse(localStorage.getItem('converge_interactions') || '[]');
    return all.filter(i => i.partner_id === partnerId).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  } catch {
    return [];
  }
};

const getDealsForPartner = (partnerId) => {
  try {
    const all = JSON.parse(localStorage.getItem('converge_deals') || '[]');
    return all.filter(d => d.partner_id === partnerId);
  } catch {
    return [];
  }
};

const getChecklistsForPartner = (partnerId) => {
  try {
    const all = JSON.parse(localStorage.getItem('converge_checklists') || '[]');
    return all.filter(c => c.partner_id === partnerId);
  } catch {
    return [];
  }
};

const getKnowledgeBase = () => {
  try {
    return JSON.parse(localStorage.getItem('converge_knowledge_base') || '[]');
  } catch {
    return [];
  }
};

const saveKnowledgeBase = (entries) => {
  localStorage.setItem('converge_knowledge_base', JSON.stringify(entries));
};

// ============================================
// CONVERSATION MEMORY
// ============================================

let conversationHistory = [];
const MAX_MEMORY = 20; // Keep last 20 exchanges

const addToMemory = (role, content) => {
  conversationHistory.push({ role, content, timestamp: new Date().toISOString() });
  if (conversationHistory.length > MAX_MEMORY) {
    conversationHistory = conversationHistory.slice(-MAX_MEMORY);
  }
};

const getMemoryContext = () => {
  if (conversationHistory.length === 0) return '';
  const recent = conversationHistory.slice(-6); // Last 3 exchanges
  return '\n\nRECENT CONVERSATION CONTEXT:\n' + 
    recent.map(m => `${m.role}: ${m.content}`).join('\n');
};

export const clearConversationMemory = () => {
  conversationHistory = [];
};

// ============================================
// CORE STAN FUNCTIONS
// ============================================

/**
 * Context Chat - Natural language queries about partner data
 */
export const askStan = async (question) => {
  const partners = getPartnersData();
  const prospects = getProspectsData();
  const economics = getEconomicsData();
  
  let prompt = CHAT_PROMPT(question, partners, prospects, economics);
  prompt += getMemoryContext();
  
  addToMemory('User', question);
  const response = await callGemini(prompt);
  addToMemory('Stan', response);
  
  return response;
};

/**
 * Email Draft Generator - Creates contextual partner emails
 */
export const generateEmailDraft = async (scenario, partnerId) => {
  const partners = getPartnersData();
  const partner = partners.find(p => p.id === partnerId);
  
  if (!partner) {
    throw new Error('Partner not found. Please select a valid partner.');
  }
  
  const interactions = getInteractionsForPartner(partnerId);
  const deals = getDealsForPartner(partnerId);
  const checklists = getChecklistsForPartner(partnerId);
  
  const context = {
    ...partner,
    recent_interactions: interactions.slice(0, 5),
    active_deals: deals,
    checklists: checklists
  };
  
  const response = await callGemini(EMAIL_DRAFT_PROMPT(scenario, context));
  return response;
};

/**
 * Meeting Prep Brief - Auto-generated meeting preparation
 */
export const generateMeetingPrep = async (partnerId) => {
  const partners = getPartnersData();
  const partner = partners.find(p => p.id === partnerId);
  
  if (!partner) {
    throw new Error('Partner not found. Please select a valid partner.');
  }
  
  const interactions = getInteractionsForPartner(partnerId);
  const deals = getDealsForPartner(partnerId);
  const checklists = getChecklistsForPartner(partnerId);
  const commissions = JSON.parse(localStorage.getItem('converge_commissions') || '[]')
    .filter(c => c.partner_name === partner.company_name);
  
  const context = {
    ...partner,
    interactions: interactions.slice(0, 10),
    deals: deals,
    checklists: checklists,
    commissions: commissions.slice(0, 5)
  };
  
  const response = await callGemini(MEETING_PREP_PROMPT(context));
  return response;
};

/**
 * Suggestion Engine - Next Best Action recommendations
 */
export const generateSuggestions = async () => {
  const partners = getPartnersData();
  const economics = getEconomicsData();
  
  if (partners.length === 0) {
    return [{ 
      priority: 'Medium', 
      category: 'Data Completion', 
      partner: 'N/A', 
      action: 'Add your first partner in Radar to start receiving suggestions.', 
      reason: 'No partner data available yet.' 
    }];
  }
  
  const response = await callGemini(SUGGESTION_PROMPT(partners, economics));
  
  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [{ priority: 'Medium', category: 'Info', partner: 'N/A', action: response, reason: 'Could not parse structured suggestions.' }];
  } catch {
    return [{ priority: 'Medium', category: 'Info', partner: 'N/A', action: response, reason: 'Raw AI response — see action text.' }];
  }
};

/**
 * Bulk Action Recommendations - Grouped portfolio actions
 */
export const generateBulkActions = async () => {
  const partners = getPartnersData();
  
  if (partners.length === 0) {
    return [{ theme: 'Getting Started', count: 0, partners: [], approach: 'Add partners in Radar to enable bulk analysis.', estimatedTime: 'N/A' }];
  }
  
  const response = await callGemini(BULK_ACTIONS_PROMPT(partners));
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [{ theme: 'Analysis', count: 0, partners: [], approach: response, estimatedTime: 'N/A' }];
  } catch {
    return [{ theme: 'Analysis', count: 0, partners: [], approach: response, estimatedTime: 'N/A' }];
  }
};

/**
 * Knowledge Base Query - Check KB then AI
 */
export const queryKnowledgeBase = async (question) => {
  const entries = getKnowledgeBase();
  const response = await callGemini(KNOWLEDGE_BASE_PROMPT(question, entries));
  return response;
};

/**
 * Data Entry Assistant - Suggest field completions
 */
export const suggestFieldCompletions = async (currentFields) => {
  const partners = getPartnersData();
  const response = await callGemini(DATA_ENTRY_PROMPT(currentFields, partners.slice(0, 10)));
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch {
    return {};
  }
};

// ============================================
// KNOWLEDGE BASE CRUD
// ============================================

export const addKnowledgeEntry = (entry) => {
  const entries = getKnowledgeBase();
  const newEntry = {
    id: `kb_${Date.now()}`,
    question: entry.question,
    answer: entry.answer,
    category: entry.category || 'General',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  entries.push(newEntry);
  saveKnowledgeBase(entries);
  return newEntry;
};

export const updateKnowledgeEntry = (id, updates) => {
  const entries = getKnowledgeBase();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) throw new Error('Knowledge base entry not found');
  entries[idx] = { ...entries[idx], ...updates, updated_at: new Date().toISOString() };
  saveKnowledgeBase(entries);
  return entries[idx];
};

export const deleteKnowledgeEntry = (id) => {
  const entries = getKnowledgeBase();
  const filtered = entries.filter(e => e.id !== id);
  saveKnowledgeBase(filtered);
};

export const getAllKnowledgeEntries = () => {
  return getKnowledgeBase();
};

// ============================================
// MOCK / DEMO MODE
// ============================================

export const isAIConfigured = () => {
  return !!getGeminiApiKey();
};

export const getMockResponse = (type) => {
  const mocks = {
    chat: "I'm Stan, your AI partner management assistant. To enable live AI responses, configure your Gemini API key in the Integrations module. In the meantime, I can show you how the interface works!\n\nWith a configured API key, I can:\n• Answer questions about your partner portfolio\n• Analyze trends and patterns\n• Reference specific partner data\n• Suggest next best actions",
    
    email: "SUBJECT: Partnership Check-in — CliniCONEX ACP Update\n\nHi [Contact Name],\n\nI hope this message finds you well. I wanted to reach out for a quick check-in on our partnership progress.\n\nSince our last conversation, we've been making great strides with the ACP platform, and I'd love to discuss how we can continue to grow our collaboration.\n\nWould you have 30 minutes this week or next for a brief call? I have some updates I think you'll find valuable.\n\nLooking forward to connecting.\n\nBest regards,\n[Your Name]\nPartnership Manager, CliniCONEX",
    
    meetingPrep: "# Meeting Preparation Brief\n\n## Partner Snapshot\n- **Company:** [Partner Name]\n- **Tier:** Silver\n- **Health Score:** 72/100\n- **Status:** Active\n\n## Key Talking Points\n1. Review Q1 deal pipeline — 3 active opportunities worth $45K\n2. Discuss upcoming contract renewal (April 2026)\n3. Address training completion gap — 2 modules outstanding\n4. Explore Gold tier pathway — currently meeting 3 of 5 criteria\n\n## Recommended Actions\n- Schedule follow-up training session\n- Share updated co-marketing materials\n- Set Q2 revenue targets together\n\n*Configure Gemini API key for personalized briefs using real partner data.*",
    
    suggestions: [
      { priority: 'High', category: 'Follow-up', partner: 'Demo Partner A', action: 'Schedule check-in call — no contact in 35 days', reason: 'Exceeds 30-day contact threshold. Health score declining.' },
      { priority: 'High', category: 'Renewal', partner: 'Demo Partner B', action: 'Initiate renewal conversation — contract expires in 75 days', reason: 'Within 90-day renewal window. Current terms need review.' },
      { priority: 'Medium', category: 'Tier Upgrade', partner: 'Demo Partner C', action: 'Review for Gold tier promotion — meets 4 of 5 criteria', reason: 'Strong MRR growth and deal volume. Only missing training completion.' },
      { priority: 'Medium', category: 'Data Completion', partner: 'Demo Partner A', action: 'Complete tech stack and billing contact fields', reason: 'Data completeness at 65%. Missing critical integration info.' },
      { priority: 'Low', category: 'Re-engagement', partner: 'Demo Partner D', action: 'Send re-engagement email with new ACP features', reason: 'No deals submitted in 60+ days despite active contract.' }
    ],

    bulkActions: [
      { theme: 'Overdue Contact Follow-ups', count: 3, partners: ['Partner A', 'Partner B', 'Partner C'], approach: 'Draft and send personalized check-in emails to all three. Use the Email Draft tool for each.', estimatedTime: '30 minutes' },
      { theme: 'Q2 Renewal Preparation', count: 2, partners: ['Partner B', 'Partner E'], approach: 'Review current terms, prepare renewal proposals, and schedule meetings.', estimatedTime: '1 hour' },
      { theme: 'Data Cleanup Sprint', count: 4, partners: ['Partner A', 'Partner C', 'Partner D', 'Partner F'], approach: 'Update missing tech stack, contact, and contract fields for these partners.', estimatedTime: '45 minutes' }
    ]
  };
  
  return mocks[type] || 'Configure your Gemini API key to enable Stan AI features.';
};