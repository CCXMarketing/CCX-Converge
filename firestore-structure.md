# Converge — Firestore Database Structure

## Module 6: Integrations Backend

### Overview

This document defines the Firestore collection schema for the Converge Integrations module.
All integration settings, API keys, field mappings, and activity logs are stored under
the `settings` collection to maintain a clean, centralized configuration structure.

---

## Collection: `settings`

### Document: `settings/apiKeys`

Stores encrypted API keys for all external integrations.

```
settings/apiKeys
├── keys: {
│     pointClickCare: {
│         value: "<encrypted_string>",        // AES-GCM encrypted API key
│         label: "PointClickCare API Key",     // Human-readable label
│         createdAt: Timestamp,                // When the key was first saved
│         updatedAt: Timestamp,                // Last modification time
│         createdBy: "<user_uid>"              // UID of user who created/updated
│     },
│     gemini: {
│         value: "<encrypted_string>",
│         label: "Google Gemini API Key",
│         createdAt: Timestamp,
│         updatedAt: Timestamp,
│         createdBy: "<user_uid>"
│     },
│     // Additional integrations follow the same structure
│   }
├── updatedAt: Timestamp                       // Last global update
└── updatedBy: "<user_uid>"                    // Last user to modify any key
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `keys` | Map | Yes | Map of integration name → encrypted key object |
| `keys.[name].value` | String | Yes | AES-GCM encrypted API key value |
| `keys.[name].label` | String | Yes | Human-readable display name |
| `keys.[name].createdAt` | Timestamp | Yes | Creation timestamp |
| `keys.[name].updatedAt` | Timestamp | Yes | Last update timestamp |
| `keys.[name].createdBy` | String | Yes | Firebase Auth UID of creator |
| `updatedAt` | Timestamp | Yes | Document-level last update |
| `updatedBy` | String | Yes | UID of last modifier |

---

### Document: `settings/fieldMappings`

Stores field mapping configurations for each integration (source field → target field).

```
settings/fieldMappings
├── integrations: {
│     pointClickCare: {
│         mappings: [
│             {
│                 sourceField: "resident_id",       // Field name in source system
│                 targetField: "residentId",         // Field name in Converge
│                 dataType: "string",                // Expected data type
│                 required: true,                    // Whether mapping is required
│                 transform: null                    // Optional transformation rule
│             },
│             {
│                 sourceField: "first_name",
│                 targetField: "firstName",
│                 dataType: "string",
│                 required: true,
│                 transform: "capitalize"
│             }
│         ],
│         active: true,                              // Whether this mapping set is active
│         updatedAt: Timestamp,
│         updatedBy: "<user_uid>"
│     },
│     // Additional integrations follow the same structure
│   }
├── updatedAt: Timestamp
└── updatedBy: "<user_uid>"
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `integrations` | Map | Yes | Map of integration name → mapping config |
| `integrations.[name].mappings` | Array | Yes | Array of field mapping objects |
| `integrations.[name].mappings[].sourceField` | String | Yes | Source system field name |
| `integrations.[name].mappings[].targetField` | String | Yes | Converge target field name |
| `integrations.[name].mappings[].dataType` | String | Yes | Data type (string, number, date, boolean) |
| `integrations.[name].mappings[].required` | Boolean | Yes | Whether the mapping is required |
| `integrations.[name].mappings[].transform` | String | No | Optional transformation rule |
| `integrations.[name].active` | Boolean | Yes | Whether mapping set is active |
| `integrations.[name].updatedAt` | Timestamp | Yes | Last update timestamp |
| `integrations.[name].updatedBy` | String | Yes | UID of last modifier |

---

### Document: `settings/integrationStatus`

Tracks the connection status and health of each integration.

```
settings/integrationStatus
├── integrations: {
│     pointClickCare: {
│         connected: true,                    // Current connection state
│         lastSyncAt: Timestamp,              // Last successful sync time
│         lastSyncStatus: "success",          // "success" | "error" | "partial"
│         lastError: null,                    // Last error message (null if none)
│         lastErrorAt: null,                  // Timestamp of last error
│         endpoint: "https://api.pcc.com/v1", // API endpoint URL
│         version: "v1",                      // API version in use
│         healthCheckAt: Timestamp            // Last health check timestamp
│     },
│     gemini: {
│         connected: true,
│         lastSyncAt: Timestamp,
│         lastSyncStatus: "success",
│         lastError: null,
│         lastErrorAt: null,
│         endpoint: "https://generativelanguage.googleapis.com/v1",
│         version: "v1",
│         healthCheckAt: Timestamp
│     }
│   }
├── updatedAt: Timestamp
└── globalHealth: "healthy"                   // "healthy" | "degraded" | "down"
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `integrations` | Map | Yes | Map of integration name → status object |
| `integrations.[name].connected` | Boolean | Yes | Current connection state |
| `integrations.[name].lastSyncAt` | Timestamp | No | Last successful sync time |
| `integrations.[name].lastSyncStatus` | String | No | Status of last sync operation |
| `integrations.[name].lastError` | String | No | Last error message |
| `integrations.[name].lastErrorAt` | Timestamp | No | When last error occurred |
| `integrations.[name].endpoint` | String | No | API endpoint URL |
| `integrations.[name].version` | String | No | API version string |
| `integrations.[name].healthCheckAt` | Timestamp | No | Last health check time |
| `globalHealth` | String | Yes | Overall system health status |

---

### Subcollection: `settings/activityLog/entries`

Stores timestamped activity log entries for all integration events.

```
settings/activityLog/entries/{autoId}
├── integration: "pointClickCare"        // Integration name
├── eventType: "api_key_updated"         // Event type identifier
├── details: "API key updated by admin"  // Human-readable description
├── metadata: {                          // Optional additional context
│     previousStatus: "connected",
│     newStatus: "connected",
│     affectedRecords: 0
│   }
├── userId: "<user_uid>"                 // User who triggered the event
├── userEmail: "admin@cliniconex.com"    // User email for display
├── status: "success"                    // "success" | "error" | "warning"
├── timestamp: Timestamp                 // When the event occurred
└── createdAt: Timestamp                 // Server timestamp for ordering
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `integration` | String | Yes | Name of the integration |
| `eventType` | String | Yes | Event type identifier |
| `details` | String | Yes | Human-readable event description |
| `metadata` | Map | No | Additional context about the event |
| `userId` | String | Yes | Firebase Auth UID of the user |
| `userEmail` | String | No | User email for display purposes |
| `status` | String | Yes | Event outcome status |
| `timestamp` | Timestamp | Yes | When the event occurred |
| `createdAt` | Timestamp | Yes | Server-generated creation time |

**Common Event Types:**

| Event Type | Description |
|------------|-------------|
| `api_key_saved` | New API key was saved |
| `api_key_updated` | Existing API key was updated |
| `api_key_retrieved` | API key was accessed/retrieved |
| `field_mapping_saved` | Field mappings were created or updated |
| `field_mapping_retrieved` | Field mappings were accessed |
| `sync_started` | Data sync operation began |
| `sync_completed` | Data sync operation finished |
| `sync_failed` | Data sync operation failed |
| `health_check` | System health check was performed |
| `connection_established` | Integration connection was established |
| `connection_lost` | Integration connection was lost |
| `error_occurred` | An error occurred during operation |

---

## Security Model

- All documents in the `settings` collection require Firebase Authentication
- Only authenticated users can read or write any settings document
- Activity log writes must include required fields: `integration`, `eventType`, `timestamp`
- API keys are encrypted at the application layer before storage
- No anonymous access is permitted

---

## Indexes

The following composite indexes should be created for optimal query performance:

| Collection | Fields | Order |
|------------|--------|-------|
| `settings/activityLog/entries` | `integration`, `timestamp` | ASC, DESC |
| `settings/activityLog/entries` | `eventType`, `timestamp` | ASC, DESC |
| `settings/activityLog/entries` | `integration`, `eventType`, `timestamp` | ASC, ASC, DESC |
| `settings/activityLog/entries` | `status`, `timestamp` | ASC, DESC |

---
---

# Module 2: Radar — Partner Management

## Overview

This section defines the Firestore collection schemas for the Converge Radar module.
The Radar module manages partner records, interactions, deals, tags, and segmentation
views to provide a comprehensive partner relationship management system.

---

## Collection: `partners`

Stores all active partner records with contact information, health scoring, and metadata.

```
partners/{autoId}
├── company_name: "Sunrise Senior Living"       // Partner organization name
├── contact_name: "Jane Smith"                   // Primary contact full name
├── contact_email: "jane@sunrise.com"            // Primary contact email
├── contact_phone: "+1-555-0123"                 // Primary contact phone
├── type: "referral_source"                      // Partner type classification
├── status: "active"                             // "active" | "inactive" | "prospect"
├── territory: "Northeast"                       // Geographic territory
├── region: "New England"                        // Region within territory
├── source: "conference"                         // How partner was acquired
├── notes: "Met at AHCA 2024 conference"         // Free-text notes
├── tags: ["skilled-nursing", "enterprise"]      // Array of tag IDs or labels
├── health_score: 82                             // Calculated health score (0-100)
├── health_score_weights: {                      // Weights used in health calculation
│     interaction_recency: 0.3,
│     interaction_frequency: 0.25,
│     deal_activity: 0.25,
│     data_completeness: 0.2
│   }
├── data_completeness: 85                        // Data completeness percentage (0-100)
├── last_interaction_at: Timestamp               // Timestamp of most recent interaction
├── deal_count: 3                                // Number of associated deals
├── created_at: Timestamp                        // When partner was created
├── updated_at: Timestamp                        // Last modification time
├── created_by: "<user_uid>"                     // UID of user who created
└── updated_by: "<user_uid>"                     // UID of user who last modified
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `company_name` | String | Yes | Partner organization name |
| `contact_name` | String | No | Primary contact full name |
| `contact_email` | String | No | Primary contact email address |
| `contact_phone` | String | No | Primary contact phone number |
| `type` | String | Yes | Partner type (referral_source, vendor, reseller, strategic, other) |
| `status` | String | Yes | Current status (active, inactive, prospect) |
| `territory` | String | No | Geographic territory assignment |
| `region` | String | No | Region within territory |
| `source` | String | No | Acquisition source (conference, referral, inbound, outbound, other) |
| `notes` | String | No | Free-text notes about the partner |
| `tags` | Array | No | Array of tag identifiers applied to this partner |
| `health_score` | Number | No | Calculated health score 0-100 |
| `health_score_weights` | Map | No | Weight configuration for health score calculation |
| `data_completeness` | Number | No | Data completeness percentage 0-100 |
| `last_interaction_at` | Timestamp | No | Most recent interaction timestamp |
| `deal_count` | Number | No | Count of associated deals |
| `created_at` | Timestamp | Yes | Server-generated creation timestamp |
| `updated_at` | Timestamp | Yes | Server-generated last update timestamp |
| `created_by` | String | Yes | Firebase Auth UID of creator |
| `updated_by` | String | Yes | Firebase Auth UID of last modifier |

---

## Collection: `partners_archived`

Stores archived partner records. Schema is identical to `partners` with additional archive metadata.

```
partners_archived/{autoId}
├── (all fields from partners collection)
├── archived_at: Timestamp                       // When the partner was archived
├── archived_by: "<user_uid>"                    // UID of user who archived
└── original_id: "partners/{originalDocId}"      // Reference to original partner doc ID
```

**Additional Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `archived_at` | Timestamp | Yes | When the partner was archived |
| `archived_by` | String | Yes | Firebase Auth UID of archiving user |
| `original_id` | String | Yes | Original document ID from `partners` collection |

---

## Collection: `interactions`

Stores all interaction events (calls, emails, meetings, notes) linked to partners.

```
interactions/{autoId}
├── partner_id: "<partner_doc_id>"               // Reference to partner document
├── type: "call"                                 // "call" | "email" | "meeting" | "note" | "other"
├── subject: "Quarterly review call"             // Interaction subject/title
├── description: "Discussed renewal terms..."    // Detailed description
├── direction: "outbound"                        // "inbound" | "outbound" (for calls/emails)
├── outcome: "positive"                          // "positive" | "neutral" | "negative" | null
├── duration_minutes: 30                         // Duration in minutes (for calls/meetings)
├── occurred_at: Timestamp                       // When the interaction occurred
├── metadata: {                                  // Optional additional context
│     attendees: ["Jane Smith", "John Doe"],
│     location: "Zoom",
│     follow_up_date: "2025-03-15"
│   }
├── created_at: Timestamp                        // Server-generated creation timestamp
├── created_by: "<user_uid>"                     // UID of user who logged interaction
├── updated_at: Timestamp                        // Last modification timestamp
└── updated_by: "<user_uid>"                     // UID of user who last modified
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partner_id` | String | Yes | Reference to the partner document ID |
| `type` | String | Yes | Interaction type (call, email, meeting, note, other) |
| `subject` | String | Yes | Interaction subject or title |
| `description` | String | No | Detailed description of the interaction |
| `direction` | String | No | Direction of communication (inbound, outbound) |
| `outcome` | String | No | Outcome assessment (positive, neutral, negative) |
| `duration_minutes` | Number | No | Duration in minutes |
| `occurred_at` | Timestamp | Yes | When the interaction occurred |
| `metadata` | Map | No | Additional context (attendees, location, etc.) |
| `created_at` | Timestamp | Yes | Server-generated creation timestamp |
| `created_by` | String | Yes | Firebase Auth UID of creator |
| `updated_at` | Timestamp | Yes | Server-generated last update timestamp |
| `updated_by` | String | Yes | Firebase Auth UID of last modifier |

---

## Collection: `deals`

Stores deal/opportunity records linked to partners with pipeline stage tracking.

```
deals/{autoId}
├── partner_id: "<partner_doc_id>"               // Reference to partner document
├── title: "Sunrise EHR Integration"             // Deal title
├── value: 50000                                 // Deal value in dollars
├── currency: "USD"                              // Currency code
├── stage: "proposal"                            // Pipeline stage
├── probability: 60                              // Win probability percentage (0-100)
├── expected_close_date: Timestamp               // Expected close date
├── actual_close_date: Timestamp                 // Actual close date (when won/lost)
├── description: "Full EHR integration..."       // Deal description
├── contact_name: "Jane Smith"                   // Deal-specific contact
├── contact_email: "jane@sunrise.com"            // Deal-specific contact email
├── stage_history: [                             // History of stage changes
│     {
│       stage: "lead",
│       changed_at: Timestamp,
│       changed_by: "<user_uid>"
│     },
│     {
│       stage: "proposal",
│       changed_at: Timestamp,
│       changed_by: "<user_uid>"
│     }
│   ]
├── metadata: {                                  // Optional additional context
│     source: "inbound",
│     competitor: "CompetitorX"
│   }
├── created_at: Timestamp                        // Server-generated creation timestamp
├── created_by: "<user_uid>"                     // UID of user who created the deal
├── updated_at: Timestamp                        // Last modification timestamp
└── updated_by: "<user_uid>"                     // UID of user who last modified
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partner_id` | String | Yes | Reference to the partner document ID |
| `title` | String | Yes | Deal title or name |
| `value` | Number | No | Deal monetary value |
| `currency` | String | No | Currency code (default: USD) |
| `stage` | String | Yes | Pipeline stage (lead, qualified, proposal, negotiation, won, lost) |
| `probability` | Number | No | Win probability percentage 0-100 |
| `expected_close_date` | Timestamp | No | Expected close date |
| `actual_close_date` | Timestamp | No | Actual close date |
| `description` | String | No | Deal description |
| `contact_name` | String | No | Deal-specific contact name |
| `contact_email` | String | No | Deal-specific contact email |
| `stage_history` | Array | No | Array of stage change records |
| `metadata` | Map | No | Additional deal context |
| `created_at` | Timestamp | Yes | Server-generated creation timestamp |
| `created_by` | String | Yes | Firebase Auth UID of creator |
| `updated_at` | Timestamp | Yes | Server-generated last update timestamp |
| `updated_by` | String | Yes | Firebase Auth UID of last modifier |

---

## Collection: `tags`

Stores tag definitions used for categorizing and filtering partners.

```
tags/{autoId}
├── name: "skilled-nursing"                      // Tag display name (unique)
├── color: "#4A90D9"                             // Tag color for UI display
├── description: "Skilled nursing facilities"    // Optional tag description
├── usage_count: 12                              // Number of partners using this tag
├── created_at: Timestamp                        // Server-generated creation timestamp
├── created_by: "<user_uid>"                     // UID of user who created the tag
├── updated_at: Timestamp                        // Last modification timestamp
└── updated_by: "<user_uid>"                     // UID of user who last modified
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Unique tag name for display |
| `color` | String | No | Hex color code for UI display |
| `description` | String | No | Tag description |
| `usage_count` | Number | No | Count of partners with this tag |
| `created_at` | Timestamp | Yes | Server-generated creation timestamp |
| `created_by` | String | Yes | Firebase Auth UID of creator |
| `updated_at` | Timestamp | Yes | Server-generated last update timestamp |
| `updated_by` | String | Yes | Firebase Auth UID of last modifier |

---

## Collection: `segmentation_views`

Stores saved filter/segmentation view configurations for the Radar module.

```
segmentation_views/{autoId}
├── name: "High-Value Northeast"                 // View display name
├── description: "Northeast partners > $50k"     // Optional description
├── filters: {                                   // Filter criteria
│     status: ["active"],
│     territory: ["Northeast"],
│     type: ["strategic", "reseller"],
│     tags: ["enterprise"],
│     health_score_min: 70,
│     health_score_max: 100,
│     deal_value_min: 50000
│   }
├── sort_by: "health_score"                      // Sort field
├── sort_direction: "desc"                       // "asc" | "desc"
├── is_default: false                            // Whether this is the default view
├── is_shared: true                              // Whether view is shared with team
├── created_at: Timestamp                        // Server-generated creation timestamp
├── created_by: "<user_uid>"                     // UID of user who created the view
├── updated_at: Timestamp                        // Last modification timestamp
└── updated_by: "<user_uid>"                     // UID of user who last modified
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | View display name |
| `description` | String | No | Optional view description |
| `filters` | Map | Yes | Filter criteria map |
| `sort_by` | String | No | Field to sort results by |
| `sort_direction` | String | No | Sort direction (asc, desc) |
| `is_default` | Boolean | No | Whether this is the default view |
| `is_shared` | Boolean | No | Whether view is shared with the team |
| `created_at` | Timestamp | Yes | Server-generated creation timestamp |
| `created_by` | String | Yes | Firebase Auth UID of creator |
| `updated_at` | Timestamp | Yes | Server-generated last update timestamp |
| `updated_by` | String | Yes | Firebase Auth UID of last modifier |

---

## Security Model (Module 2)

- All collections require Firebase Authentication
- Only authenticated users can read or write partner, interaction, deal, tag, and view records
- Partner archive/restore operations preserve full audit trail
- Health scores are recalculated on partner updates and interaction logging
- Tag usage counts are maintained on tag add/remove operations
- No anonymous access is permitted

---

## Indexes (Module 2)

The following composite indexes should be created for optimal query performance:

| Collection | Fields | Order |
|------------|--------|-------|
| `partners` | `status`, `created_at` | ASC, DESC |
| `partners` | `type`, `status`, `created_at` | ASC, ASC, DESC |
| `partners` | `territory`, `status` | ASC, ASC |
| `partners` | `health_score`, `status` | DESC, ASC |
| `partners_archived` | `archived_at` | DESC |
| `interactions` | `partner_id`, `occurred_at` | ASC, DESC |
| `interactions` | `partner_id`, `type`, `occurred_at` | ASC, ASC, DESC |
| `deals` | `partner_id`, `created_at` | ASC, DESC |
| `deals` | `partner_id`, `stage` | ASC, ASC |
| `deals` | `stage`, `expected_close_date` | ASC, ASC |
| `tags` | `name` | ASC |
| `segmentation_views` | `created_by`, `created_at` | ASC, DESC |
