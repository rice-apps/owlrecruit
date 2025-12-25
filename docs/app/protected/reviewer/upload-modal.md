# CSV Upload Modal

Client component for CSV file upload.

## Props

```typescript
{ openingId: string }
```

## State

```typescript
isUploaded, fileName, error, isUploading
```

## Flow

1. Click "Upload Applications" or "Upload Interview Feedback"
2. Send file:
```typescript
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'text/csv', 'X-Opening-Id': openingId },
  body: file
})
```
3. Handle response, update state
4. Refresh page on successful close

## Error Display

Shows first 10 errors with row numbers. Adds "... and X more" if exceeded.

## UI States

**Initial:** Two upload buttons
**Uploading:** Disabled buttons, "Uploading..." text
**Success:** Checkmark, filename, auto-refresh on close
**Error:** Alert icon, error details, "Try Again" button

## Customization

**File validation:**
```typescript
if (file.size > 5 * 1024 * 1024) {
  setError('File too large');
  return;
}
```

**No auto-refresh:**
```typescript
// Remove: window.location.reload();
// Add: onUploadSuccess?.();
```

**Progress tracking:**
```typescript
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  setProgress((e.loaded / e.total) * 100);
});
```

**Error limit:**
```typescript
.slice(0, 20)  // Show 20 instead of 10
```

## Accessibility

Add ARIA labels:
```tsx
<input aria-label="Upload applications CSV file" />
<div role="status" aria-live="polite">{isUploading && "Uploading..."}</div>
```

## Testing

1. Valid CSV - succeeds
2. Invalid netid - shows error
3. Empty CSV - shows error
4. Non-CSV - fails in API
5. Upload then close - refreshes page
