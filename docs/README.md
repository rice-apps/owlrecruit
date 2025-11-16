# CSV Upload System

## Overview

Bulk import applications and interviews via CSV. Flexible schema stores dynamic columns as JSON. Data scoped to specific openings.

## Architecture

**Configuration:** `lib/csv-upload-config.ts` - All settings
**Utilities:** `lib/csv-upload-utils.ts` - Shared processing logic
**API:** `app/api/applications/route.ts`, `app/api/interviews/route.ts`
**UI:** `app/protected/reviewer/[orgId]/opening/[openingId]/`
**Components:** `app/protected/dashboard/clubs/components/KanbanBoard.tsx`

## Data Flow

1. Upload CSV from opening page
2. API receives CSV + opening_id header
3. Validate opening, get org_id
4. Per row: validate netid, lookup user, build record
5. Insert valid records
6. Return results + errors

## CSV Format

**Required:** `netid`
**Optional:** `resume`, any other columns (stored as JSON)

```csv
netid,resume,Why join?,Years experience
abc123,https://example.com/resume.pdf,I love this org,2
```

## Modifications

- Default status: `lib/csv-upload-config.ts` line 55
- Kanban columns: `lib/csv-upload-config.ts` line 136
- Validation: `lib/csv-upload-utils.ts`
- Error messages: `lib/csv-upload-config.ts` line 180

## Error Handling

**Default:** Skip invalid rows, insert valid ones
**Configure:** `VALIDATION_CONFIG.skipInvalidRows` in config

## Database

**applications:** org_id, opening_id, applicant_id, form_responses (JSONB), status
**interviews:** org_id, opening_id, applicant_id, feedback (JSONB)

## Documentation Index

**Configuration:**
- `lib/csv-upload-config.md` - All system settings and constants

**Utilities:**
- `lib/csv-upload-utils.md` - Shared processing functions

**API Endpoints:**
- `app/api/applications/route.md` - Application CSV upload endpoint
- `app/api/interviews/route.md` - Interview CSV upload endpoint

**Pages:**
- `app/protected/reviewer/opening-overview-page.md` - Opening kanban view

**Components:**
- `app/protected/reviewer/upload-modal.md` - CSV upload dialog
- `app/protected/dashboard/clubs/kanban-board.md` - Drag-and-drop board
