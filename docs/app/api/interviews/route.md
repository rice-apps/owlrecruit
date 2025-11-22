# /api/interviews

Uploads interview feedback CSV data.

## Request

Same as `/api/applications`.

## Response

Same format as applications endpoint.

## Differences from Applications

- Uses `feedback` field instead of `form_responses`
- No default status
- Calls `buildInterviewRecord`

## Steps

1-6: Identical to applications endpoint

## Customization

**Add field:**
```typescript
// In buildInterviewRecord
return {
  org_id: orgId,
  opening_id: openingId,
  applicant_id: userId,
  feedback: feedback,
  interviewer_id: getCurrentUserId(),  // Add this
};
```

**Add status:**
```typescript
// Uncomment in buildInterviewRecord
status: status || 'Completed',
// Pass from API route
processCSVRows(..., buildInterviewRecord, 'Completed')
```

## Example

**CSV:**
```csv
netid,Technical,Communication,Notes
abc123,9,8,Strong candidate
```

**Stored:**
```json
{
  "feedback": {
    "Technical": "9",
    "Communication": "8",
    "Notes": "Strong candidate"
  }
}
```

## Testing

```bash
curl -X POST http://localhost:3000/api/interviews \
  -H "Content-Type: text/csv" \
  -H "X-Opening-Id: <uuid>" \
  --data-binary @feedback.csv
```
