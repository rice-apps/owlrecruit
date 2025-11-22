# csv-upload-config.ts

Centralized configuration for CSV upload system.

## APPLICATION_STATUSES (line 20)

Define status values and display names.

```typescript
APPLIED: {
  value: 'Applied',      // Must match database enum
  display: 'Applied',    // UI text
  description: '...'     // Documentation
}
```

**Modify:** Add/remove statuses, ensure `value` matches database exactly.

## DEFAULT_UPLOAD_STATUS (line 55)

Status for new uploads. Currently: `'Applied'`

**Change:**
```typescript
export const DEFAULT_UPLOAD_STATUS = APPLICATION_STATUSES.UPLOADED.value;
```

## CSV_RESERVED_COLUMNS (line 69)

Columns with special handling.

**Current:** `netid` (required), `resume` (optional)

**Add reserved column:**
1. Add to object
2. Update `buildApplicationRecord` in utils
3. Add to `REQUIRED_CSV_COLUMNS` if mandatory

## REQUIRED_CSV_COLUMNS (line 82)

Mandatory CSV columns. Currently: `['netid']`

**Add requirement:**
```typescript
export const REQUIRED_CSV_COLUMNS = [
  CSV_RESERVED_COLUMNS.NETID,
  CSV_RESERVED_COLUMNS.EMAIL,
];
```

## KANBAN_COLUMNS (line 136)

Board columns in display order.

```typescript
{
  id: 'unique_id',
  title: 'Display Name',
  status: 'database_value'  // Must match database enum
}
```

**Modify:** Add/remove/reorder, update `KANBAN_GRID_COLS` to match length.

## ERROR_MESSAGES (line 180)

User-facing error text. Customize strings, keep keys.

## VALIDATION_CONFIG (line 201)

**skipInvalidRows:** `true` = continue on errors, `false` = fail all
**validateEmail:** Enable email validation (implement in utils)
