/**
 * Converge — Seed Data Script
 * 
 * PURPOSE: Populates Firestore with realistic EMR/healthcare partner data
 * so you can see the Radar module in action.
 * 
 * HOW TO USE:
 * 1. Copy this file to C:\Projects\Converge\src\utils\seedData.js
 * 2. Import and call from a temporary button in your app (instructions below)
 * 3. Click the button once to populate data
 * 4. Remove the button after seeding
 * 
 * IMPORTANT: Run this ONCE. Running it multiple times will create duplicates.
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================================
// HELPER: Convert date string to Firestore Timestamp
// ============================================================
const toTimestamp = (dateStr) => Timestamp.fromDate(new Date(dateStr));

// ============================================================
// PARTNER RECORDS (10 realistic EMR/healthcare partners)
// ============================================================
const partners = [
  {
    company_name: "TELUS Health",
    website_url: "https://www.telushealth.com",
    status: "Active",
    tier: "Gold",
    health_score: 87,
    data_completeness: 95,
    tags: ["EMR Vendor", "Enterprise", "Senior Care Focus", "Top Revenue"],
    primary_contact: {
      name: "Sarah Chen",
      email: "sarah.chen@telushealth.com",
      phone: "+1-604-555-0142",
      role: "VP Partnerships"
    },
    tech_stack: ["Java", "AWS", "PostgreSQL", "REST API", "HL7 FHIR"],
    contract_start: toTimestamp("2024-03-15"),
    contract_end: toTimestamp("2026-03-14"),
    source: "Conference",
    strategic_fit_scores: { revenue: 5, technical: 4, cultural: 5 },
    news_tracking_enabled: true,
    headquarters: "Vancouver, BC, Canada",
    employee_count: "10,000+",
    industry: "Healthcare IT / EMR",
    description: "Canada's largest EMR provider serving primary care, long-term care, and home health. Deep integration with provincial health systems.",
    created_at: toTimestamp("2024-03-15"),
    updated_at: toTimestamp("2026-02-18")
  },
  {
    company_name: "PointClickCare",
    website_url: "https://www.pointclickcare.com",
    status: "Active",
    tier: "Gold",
    health_score: 82,
    data_completeness: 90,
    tags: ["EMR Vendor", "Senior Care Focus", "Top Revenue", "High Growth"],
    primary_contact: {
      name: "Michael Torres",
      email: "m.torres@pointclickcare.com",
      phone: "+1-905-555-0198",
      role: "Director Business Development"
    },
    tech_stack: ["C#", ".NET", "Azure", "SQL Server", "REST API", "HL7"],
    contract_start: toTimestamp("2024-06-01"),
    contract_end: toTimestamp("2026-05-31"),
    source: "Referral",
    strategic_fit_scores: { revenue: 5, technical: 5, cultural: 4 },
    news_tracking_enabled: true,
    headquarters: "Mississauga, ON, Canada",
    employee_count: "2,000+",
    industry: "Senior Care / Long-Term Care EMR",
    description: "Leading cloud-based senior care platform serving skilled nursing, senior living, and home health across North America.",
    created_at: toTimestamp("2024-06-01"),
    updated_at: toTimestamp("2026-02-15")
  },
  {
    company_name: "AlayaCare",
    website_url: "https://www.alayacare.com",
    status: "Active",
    tier: "Silver",
    health_score: 74,
    data_completeness: 85,
    tags: ["Healthcare IT", "Home Care", "High Growth"],
    primary_contact: {
      name: "Isabelle Dubois",
      email: "i.dubois@alayacare.com",
      phone: "+1-514-555-0167",
      role: "Alliance Manager"
    },
    tech_stack: ["Ruby on Rails", "AWS", "PostgreSQL", "GraphQL", "REST API"],
    contract_start: toTimestamp("2024-09-01"),
    contract_end: toTimestamp("2025-08-31"),
    source: "Scout Research",
    strategic_fit_scores: { revenue: 4, technical: 4, cultural: 4 },
    news_tracking_enabled: true,
    headquarters: "Montreal, QC, Canada",
    employee_count: "500+",
    industry: "Home Health / Community Care Software",
    description: "End-to-end home health care platform with clinical documentation, scheduling, billing, and remote patient monitoring.",
    created_at: toTimestamp("2024-09-01"),
    updated_at: toTimestamp("2026-02-10")
  },
  {
    company_name: "QHR Technologies (Medeo)",
    website_url: "https://www.qhrtech.com",
    status: "Active",
    tier: "Silver",
    health_score: 68,
    data_completeness: 78,
    tags: ["EMR Vendor", "Primary Care"],
    primary_contact: {
      name: "David Park",
      email: "d.park@qhrtech.com",
      phone: "+1-250-555-0134",
      role: "Product Manager"
    },
    tech_stack: ["Python", "Django", "GCP", "PostgreSQL", "HL7 FHIR"],
    contract_start: toTimestamp("2025-01-15"),
    contract_end: toTimestamp("2026-01-14"),
    source: "Inbound",
    strategic_fit_scores: { revenue: 3, technical: 4, cultural: 3 },
    news_tracking_enabled: false,
    headquarters: "Kelowna, BC, Canada",
    employee_count: "200+",
    industry: "Primary Care EMR",
    description: "Cloud-based EMR and virtual care platform for primary care clinics across Western Canada. Subsidiary of Loblaw Companies.",
    created_at: toTimestamp("2025-01-15"),
    updated_at: toTimestamp("2026-02-05")
  },
  {
    company_name: "Nuvola Health",
    website_url: "https://www.nuvolahealth.com",
    status: "Onboarding",
    tier: "Bronze",
    health_score: 55,
    data_completeness: 60,
    tags: ["Patient Engagement", "Conference 2026 Lead"],
    primary_contact: {
      name: "Priya Sharma",
      email: "priya@nuvolahealth.com",
      phone: "+1-416-555-0211",
      role: "CEO"
    },
    tech_stack: ["React", "Node.js", "AWS", "MongoDB", "REST API"],
    contract_start: toTimestamp("2026-01-20"),
    contract_end: toTimestamp("2027-01-19"),
    source: "Conference",
    strategic_fit_scores: { revenue: 3, technical: 3, cultural: 4 },
    news_tracking_enabled: false,
    headquarters: "Toronto, ON, Canada",
    employee_count: "50+",
    industry: "Patient Engagement / Digital Health",
    description: "Patient engagement platform with automated appointment reminders, virtual triage, and satisfaction surveys for mid-size clinics.",
    created_at: toTimestamp("2026-01-20"),
    updated_at: toTimestamp("2026-02-18")
  },
  {
    company_name: "CareVoice Systems",
    website_url: "https://www.carevoicesystems.com",
    status: "Active",
    tier: "Bronze",
    health_score: 42,
    data_completeness: 55,
    tags: ["Healthcare IT", "At Risk"],
    primary_contact: {
      name: "Tom Greenberg",
      email: "tom.g@carevoicesystems.com",
      phone: "+1-613-555-0189",
      role: "Director Partnerships"
    },
    tech_stack: ["PHP", "Laravel", "AWS", "MySQL"],
    contract_start: toTimestamp("2024-11-01"),
    contract_end: toTimestamp("2025-10-31"),
    source: "Partner Recommendation",
    strategic_fit_scores: { revenue: 2, technical: 2, cultural: 3 },
    news_tracking_enabled: false,
    headquarters: "Ottawa, ON, Canada",
    employee_count: "80+",
    industry: "Healthcare Communication Systems",
    description: "Automated voice and messaging platform for healthcare facilities. Focus on long-term care communication workflows.",
    created_at: toTimestamp("2024-11-01"),
    updated_at: toTimestamp("2025-12-20")
  },
  {
    company_name: "MatrixCare (ResMed)",
    website_url: "https://www.matrixcare.com",
    status: "Active",
    tier: "Gold",
    health_score: 79,
    data_completeness: 88,
    tags: ["EMR Vendor", "Senior Care Focus", "Enterprise", "USA Partner"],
    primary_contact: {
      name: "Jennifer Walsh",
      email: "j.walsh@matrixcare.com",
      phone: "+1-952-555-0156",
      role: "VP Strategic Partnerships"
    },
    tech_stack: ["Java", "Azure", "SQL Server", "REST API", "HL7 FHIR"],
    contract_start: toTimestamp("2024-07-01"),
    contract_end: toTimestamp("2026-06-30"),
    source: "Conference",
    strategic_fit_scores: { revenue: 5, technical: 4, cultural: 4 },
    news_tracking_enabled: true,
    headquarters: "Bloomington, MN, USA",
    employee_count: "1,500+",
    industry: "Senior Care / Post-Acute Care EMR",
    description: "Leading post-acute care EHR serving skilled nursing, life plan communities, and home health. Owned by ResMed.",
    created_at: toTimestamp("2024-07-01"),
    updated_at: toTimestamp("2026-02-12")
  },
  {
    company_name: "Cerner (Oracle Health)",
    website_url: "https://www.oracle.com/health",
    status: "Active",
    tier: "Silver",
    health_score: 63,
    data_completeness: 72,
    tags: ["EMR Vendor", "Enterprise", "USA Partner"],
    primary_contact: {
      name: "Robert Kim",
      email: "robert.kim@oracle.com",
      phone: "+1-816-555-0177",
      role: "Alliance Manager - Canada"
    },
    tech_stack: ["Java", "Oracle Cloud", "Oracle DB", "REST API", "HL7 FHIR", "SMART on FHIR"],
    contract_start: toTimestamp("2025-04-01"),
    contract_end: toTimestamp("2026-03-31"),
    source: "Inbound",
    strategic_fit_scores: { revenue: 4, technical: 3, cultural: 2 },
    news_tracking_enabled: true,
    headquarters: "Kansas City, MO, USA",
    employee_count: "25,000+",
    industry: "Enterprise Healthcare IT / EMR",
    description: "One of the world's largest health IT companies. Full suite of clinical, financial, and operational solutions for hospitals and health systems.",
    created_at: toTimestamp("2025-04-01"),
    updated_at: toTimestamp("2026-01-28")
  },
  {
    company_name: "Greenway Health",
    website_url: "https://www.greenwayhealth.com",
    status: "Onboarding",
    tier: "Bronze",
    health_score: 50,
    data_completeness: 48,
    tags: ["EMR Vendor", "USA Partner", "Conference 2026 Lead"],
    primary_contact: {
      name: "Amanda Liu",
      email: "a.liu@greenwayhealth.com",
      phone: "+1-813-555-0203",
      role: "Business Development Manager"
    },
    tech_stack: ["C#", ".NET", "AWS", "SQL Server", "REST API"],
    contract_start: toTimestamp("2026-02-01"),
    contract_end: toTimestamp("2027-01-31"),
    source: "Conference",
    strategic_fit_scores: { revenue: 3, technical: 3, cultural: 3 },
    news_tracking_enabled: false,
    headquarters: "Tampa, FL, USA",
    employee_count: "800+",
    industry: "Ambulatory Care EMR",
    description: "Cloud-based EHR, practice management, and revenue cycle solutions for ambulatory care practices.",
    created_at: toTimestamp("2026-02-01"),
    updated_at: toTimestamp("2026-02-19")
  },
  {
    company_name: "Think Research",
    website_url: "https://www.thinkresearch.com",
    status: "Active",
    tier: "Silver",
    health_score: 71,
    data_completeness: 82,
    tags: ["Healthcare IT", "Clinical Decision Support"],
    primary_contact: {
      name: "Catherine Wells",
      email: "c.wells@thinkresearch.com",
      phone: "+1-416-555-0145",
      role: "Director Strategic Partnerships"
    },
    tech_stack: ["React", "Python", "GCP", "PostgreSQL", "REST API", "HL7 FHIR"],
    contract_start: toTimestamp("2024-12-01"),
    contract_end: toTimestamp("2025-11-30"),
    source: "Referral",
    strategic_fit_scores: { revenue: 3, technical: 5, cultural: 4 },
    news_tracking_enabled: true,
    headquarters: "Toronto, ON, Canada",
    employee_count: "400+",
    industry: "Clinical Decision Support / Healthcare IT",
    description: "Clinical decision support and digital health solutions. Provides order sets, clinical documentation, and virtual care platforms.",
    created_at: toTimestamp("2024-12-01"),
    updated_at: toTimestamp("2026-02-08")
  }
];

// ============================================================
// INTERACTION RECORDS (Communication Timeline data)
// ============================================================
const interactions = [
  // TELUS Health interactions
  { partner_name: "TELUS Health", type: "Meeting", date: toTimestamp("2026-02-14"), contact: "Sarah Chen", notes: "Quarterly business review. Discussed ACP expansion into 3 new LTC facilities. Sarah confirmed Q2 go-live target for BC region rollout.", follow_up: true, follow_up_date: toTimestamp("2026-03-01") },
  { partner_name: "TELUS Health", type: "Email", date: toTimestamp("2026-01-28"), contact: "Sarah Chen", notes: "Sent updated co-marketing materials for spring campaign. Sarah requested additional case studies for senior care vertical.", follow_up: false },
  { partner_name: "TELUS Health", type: "Call", date: toTimestamp("2026-01-10"), contact: "Sarah Chen", notes: "Quick check-in on integration timeline. Dev team on track for API v2 release in February. No blockers.", follow_up: false },

  // PointClickCare interactions
  { partner_name: "PointClickCare", type: "Meeting", date: toTimestamp("2026-02-10"), contact: "Michael Torres", notes: "Demo of new ACP features for PCC platform. Michael impressed with automated family communication workflows. Requested pricing for 50-facility pilot.", follow_up: true, follow_up_date: toTimestamp("2026-02-24") },
  { partner_name: "PointClickCare", type: "Email", date: toTimestamp("2026-01-22"), contact: "Michael Torres", notes: "Follow-up on conference conversation. Shared integration documentation and technical specs.", follow_up: false },

  // AlayaCare interactions
  { partner_name: "AlayaCare", type: "Call", date: toTimestamp("2026-02-06"), contact: "Isabelle Dubois", notes: "Discussed renewal terms. Isabelle concerned about ROI metrics — need to prepare data showing client outcomes from ACP. Contract renewal approaching August.", follow_up: true, follow_up_date: toTimestamp("2026-02-20") },
  { partner_name: "AlayaCare", type: "Email", date: toTimestamp("2026-01-15"), contact: "Isabelle Dubois", notes: "Sent Q4 performance report and usage analytics. 23% increase in family engagement across their client base.", follow_up: false },

  // CareVoice Systems interactions (stale — triggers red flag)
  { partner_name: "CareVoice Systems", type: "Email", date: toTimestamp("2025-12-18"), contact: "Tom Greenberg", notes: "Sent follow-up on training schedule. No response received. Third attempt at contact in December.", follow_up: true, follow_up_date: toTimestamp("2026-01-05") },
  { partner_name: "CareVoice Systems", type: "Call", date: toTimestamp("2025-11-25"), contact: "Tom Greenberg", notes: "Left voicemail. Tom has not responded to last two emails. Possible disengagement risk.", follow_up: true, follow_up_date: toTimestamp("2025-12-10") },

  // MatrixCare interactions
  { partner_name: "MatrixCare (ResMed)", type: "Meeting", date: toTimestamp("2026-02-07"), contact: "Jennifer Walsh", notes: "Joint roadmap planning session. Aligned on H1 2026 integration milestones. MatrixCare wants co-branded webinar in March targeting SNF administrators.", follow_up: true, follow_up_date: toTimestamp("2026-02-21") },
  { partner_name: "MatrixCare (ResMed)", type: "Email", date: toTimestamp("2026-01-30"), contact: "Jennifer Walsh", notes: "Shared draft MDF proposal for Q2 marketing activities. Jennifer to review with her marketing team.", follow_up: false },

  // Nuvola Health interactions (new partner, onboarding)
  { partner_name: "Nuvola Health", type: "Meeting", date: toTimestamp("2026-02-15"), contact: "Priya Sharma", notes: "Onboarding kickoff meeting. Walked through Success Checklist and integration timeline. Priya very engaged — asked detailed technical questions.", follow_up: true, follow_up_date: toTimestamp("2026-02-25") },
  { partner_name: "Nuvola Health", type: "Email", date: toTimestamp("2026-02-02"), contact: "Priya Sharma", notes: "Sent welcome package with NDA, contract docs, and onboarding guide.", follow_up: false },

  // Cerner (Oracle Health) interactions
  { partner_name: "Cerner (Oracle Health)", type: "Call", date: toTimestamp("2026-01-20"), contact: "Robert Kim", notes: "Robert flagged internal restructuring affecting partnership priorities. Oracle consolidating partner programs. May need to re-engage at VP level.", follow_up: true, follow_up_date: toTimestamp("2026-02-15") },

  // Think Research interactions
  { partner_name: "Think Research", type: "Meeting", date: toTimestamp("2026-02-03"), contact: "Catherine Wells", notes: "Explored co-development opportunity for clinical decision alerts within ACP. Catherine sees strong product synergy. Need technical feasibility assessment.", follow_up: true, follow_up_date: toTimestamp("2026-02-17") },
  { partner_name: "Think Research", type: "Email", date: toTimestamp("2026-01-18"), contact: "Catherine Wells", notes: "Shared case study draft featuring Think Research + ACP integration at Sunnybrook network.", follow_up: false },
];

// ============================================================
// DEAL RECORDS (Deal Registration Tracker data)
// ============================================================
const deals = [
  { partner_name: "TELUS Health", lead_company: "Sunrise Senior Living BC", submission_date: toTimestamp("2026-01-08"), deal_value: 48000, currency: "CAD", stage: "Negotiation", conflict_status: "Clear" },
  { partner_name: "TELUS Health", lead_company: "Bayshore HealthCare", submission_date: toTimestamp("2025-11-15"), deal_value: 72000, currency: "CAD", stage: "Closed Won", conflict_status: "Clear" },
  { partner_name: "PointClickCare", lead_company: "Chartwell Retirement", submission_date: toTimestamp("2026-02-05"), deal_value: 120000, currency: "CAD", stage: "Qualification", conflict_status: "Clear" },
  { partner_name: "PointClickCare", lead_company: "Revera Living", submission_date: toTimestamp("2025-10-20"), deal_value: 85000, currency: "CAD", stage: "Closed Won", conflict_status: "Clear" },
  { partner_name: "AlayaCare", lead_company: "SE Health", submission_date: toTimestamp("2026-01-22"), deal_value: 35000, currency: "CAD", stage: "Demo Scheduled", conflict_status: "Clear" },
  { partner_name: "MatrixCare (ResMed)", lead_company: "Brookdale Senior Living", submission_date: toTimestamp("2026-01-30"), deal_value: 95000, currency: "USD", stage: "Proposal Sent", conflict_status: "Clear" },
  { partner_name: "MatrixCare (ResMed)", lead_company: "Kindred Healthcare", submission_date: toTimestamp("2025-12-10"), deal_value: 65000, currency: "USD", stage: "Closed Won", conflict_status: "Clear" },
  { partner_name: "Cerner (Oracle Health)", lead_company: "Trillium Health Partners", submission_date: toTimestamp("2025-09-15"), deal_value: 55000, currency: "CAD", stage: "Stalled", conflict_status: "Conflict" },
  { partner_name: "Think Research", lead_company: "Sunnybrook Health Sciences", submission_date: toTimestamp("2026-02-01"), deal_value: 42000, currency: "CAD", stage: "Qualification", conflict_status: "Clear" },
  { partner_name: "QHR Technologies (Medeo)", lead_company: "Pacific Medical Clinic Group", submission_date: toTimestamp("2025-12-01"), deal_value: 28000, currency: "CAD", stage: "Demo Scheduled", conflict_status: "Clear" },
];

// ============================================================
// COMMISSION RECORDS (Economics data)
// ============================================================
const commissions = [
  { partner_name: "TELUS Health", deal_name: "Bayshore HealthCare", deal_value: 72000, commission_pct: 15, commission_amount: 10800, currency: "CAD", date_closed: toTimestamp("2025-12-15"), payment_status: "Paid" },
  { partner_name: "PointClickCare", deal_name: "Revera Living", deal_value: 85000, commission_pct: 15, commission_amount: 12750, currency: "CAD", date_closed: toTimestamp("2025-11-28"), payment_status: "Paid" },
  { partner_name: "MatrixCare (ResMed)", deal_name: "Kindred Healthcare", deal_value: 65000, commission_pct: 12, commission_amount: 7800, currency: "USD", date_closed: toTimestamp("2026-01-20"), payment_status: "Scheduled" },
];

// ============================================================
// SEED FUNCTION — Call this once to populate Firestore
// ============================================================
export async function seedDatabase() {
  const results = { partners: 0, interactions: 0, deals: 0, commissions: 0, errors: [] };

  try {
    // 1. Seed Partners
    console.log("🔄 Seeding partners...");
    for (const partner of partners) {
      try {
        await addDoc(collection(db, 'partners'), partner);
        results.partners++;
        console.log(`  ✅ ${partner.company_name}`);
      } catch (err) {
        results.errors.push(`Partner ${partner.company_name}: ${err.message}`);
        console.error(`  ❌ ${partner.company_name}: ${err.message}`);
      }
    }

    // 2. Seed Interactions
    console.log("🔄 Seeding interactions...");
    for (const interaction of interactions) {
      try {
        await addDoc(collection(db, 'interactions'), interaction);
        results.interactions++;
      } catch (err) {
        results.errors.push(`Interaction: ${err.message}`);
      }
    }
    console.log(`  ✅ ${results.interactions} interactions added`);

    // 3. Seed Deals
    console.log("🔄 Seeding deals...");
    for (const deal of deals) {
      try {
        await addDoc(collection(db, 'deals'), deal);
        results.deals++;
      } catch (err) {
        results.errors.push(`Deal: ${err.message}`);
      }
    }
    console.log(`  ✅ ${results.deals} deals added`);

    // 4. Seed Commissions
    console.log("🔄 Seeding commissions...");
    for (const commission of commissions) {
      try {
        await addDoc(collection(db, 'commissions'), commission);
        results.commissions++;
      } catch (err) {
        results.errors.push(`Commission: ${err.message}`);
      }
    }
    console.log(`  ✅ ${results.commissions} commissions added`);

    // Summary
    console.log("\n🎉 SEED COMPLETE:");
    console.log(`   Partners: ${results.partners}/10`);
    console.log(`   Interactions: ${results.interactions}/17`);
    console.log(`   Deals: ${results.deals}/10`);
    console.log(`   Commissions: ${results.commissions}/3`);
    if (results.errors.length > 0) {
      console.log(`   ⚠️ Errors: ${results.errors.length}`);
      results.errors.forEach(e => console.log(`     - ${e}`));
    }

    return results;
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    throw err;
  }
}