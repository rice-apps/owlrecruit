# /api/applications

Uploads application CSV data.

## Request

**POST** with headers:
- `Content-Type: text/csv` or `text/plain`
- `X-Opening-Id: <uuid>`

**Body:** Raw CSV

## Response

**Success (200):**
```json
{
  "data": [...],
  "inserted_count": 10,
  "skipped_count": 2,
  "errors": [{ "row": 3, "netid": "bad", "error": "User not found" }]
}
```

**Error (400/404/500):**
```json
{
  "error": "message",
  "details": [...]
}
```

## Steps

1. Validate Content-Type and X-Opening-Id
2. Parse CSV with PapaParse
3. Lookup opening, get org_id
4. Process rows (via `processCSVRows`)
5. Batch insert valid records
6. Return results

## Customization

**Default status:** Edit `DEFAULT_UPLOAD_STATUS` in config
**Required fields:** Edit `REQUIRED_CSV_COLUMNS` in config
**Add field:** Modify `buildApplicationRecord` in utils
**Validation:** Add function in utils, call in `processCSVRows`

## Errors

**Missing netid:** Row skipped
**User not found:** Row skipped
**Invalid opening:** Upload fails
**Database error:** Upload fails

## Testing

```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: text/csv" \
  -H "X-Opening-Id: <uuid>" \
  --data-binary @test.csv
```

Verify:
```sql
SELECT * FROM applications WHERE opening_id = '<uuid>';
```
