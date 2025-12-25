# csv-upload-utils.ts

Shared CSV processing utilities.

## validateRequiredFields(row)

Checks row has all required columns from config.

**Add custom validation:**
```typescript
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## extractFormResponses(row)

Extracts non-reserved columns as key-value object.

```typescript
Input:  { netid: 'abc', resume: 'url', Q1: 'ans', Q2: 'ans' }
Output: { Q1: 'ans', Q2: 'ans' }
```

**Preprocess:** Add transformations in loop (e.g., `.trim()`)

## buildApplicationRecord(...)

Creates database insert object.

**Params:** orgId, openingId, userId, formResponses, status (optional)

**Add field:**
```typescript
return {
  org_id: orgId,
  opening_id: openingId,
  applicant_id: userId,
  form_responses: formResponses,
  status: status || 'Applied',
  position: formResponses['Position'] || '',  // Add this
};
```

## buildInterviewRecord(...)

Same as buildApplicationRecord, uses `feedback` field.

## lookupUserByNetId(supabase, netid)

Queries users table by net_id.

**Returns:** `{ id, net_id }` or `null`

**Customize lookup:**
```typescript
.select('id, net_id, email')  // Add fields
.eq('net_id', netid)          // Or change field
```

## lookupOpening(supabase, openingId)

Gets opening, returns org_id.

**Add validation:**
```typescript
.select('org_id, is_active')
// Then check: if (!opening.is_active) return null;
```

## processCSVRows(...)

Main batch processor. Validates rows, looks up users, builds records, collects errors.

**Returns:** `{ records: [...], errors: [...] }`

**Add step:** Insert between validation and record building.

## Response Formatters

**formatSuccessResponse:** Returns `{ data, inserted_count, skipped_count, errors }`
**formatErrorResponse:** Returns `{ error, details }`

## Extension Pattern

**New record type:**
1. Create `buildXRecord` function (copy signature)
2. Use with `processCSVRows` in new API route

**Preprocessing:**
```typescript
export function preprocessCSVRow(row: CSVRow): CSVRow {
  return { ...row, netid: row.netid?.toLowerCase() };
}
// Use in processCSVRows loop
```
