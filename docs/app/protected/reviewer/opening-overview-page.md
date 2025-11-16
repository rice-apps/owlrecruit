# Opening Overview Page

Route: `/protected/reviewer/[orgId]/opening/[openingId]`

Server component showing kanban board and CSV upload for one opening.

## Data Loading

**Opening:**
```typescript
.from('openings')
.select('id, org_id, title, description')
.eq('id', openingId).eq('org_id', orgId)
```

**Applications:**
```typescript
.from('applications')
.select('id, org_id, opening_id, applicant_id, status, form_responses, created_at, updated_at, users:applicant_id(...), application_reviews(score)')
.eq('opening_id', openingId)
```

## Components

- Header: title, description, upload button
- KanbanBoard: applications by status, drag-drop

## Data Transform

Required before KanbanBoard:
```typescript
applications.map(app => ({
  ...app,
  position: '',
  notes: '',
  users: Array.isArray(app.users) ? app.users[0] : app.users,
  reviewScore: app.application_reviews?.[0]?.score || null
}))
```

## Error States

**Opening not found:** Error message, no board
**DB error:** Console log, empty board

## Customization

**Add fields:**
```typescript
.select('..., deadline, requirements')
// Display: {opening.deadline && <p>Deadline: {opening.deadline}</p>}
```

**Filter/sort:**
```typescript
.eq('opening_id', openingId)
.in('status', ['Applied', 'Interviewing'])
.order('created_at', { ascending: false })
```

**Layout:**
```tsx
<div className="flex gap-6">
  <aside className="w-64">{/* filters */}</aside>
  <main className="flex-1"><KanbanBoard /></main>
</div>
```

## Performance

Current: Fetches all on every load
Optimize: Pagination, virtual scroll, caching (React Query/SWR)
