# KanbanBoard Component

Client component with drag-and-drop functionality for application management.

## Props

```typescript
{ applications: Application[] }
```

## State

```typescript
localApplications, isEditMode, isSaving, activeApplication,
hasUnsavedChanges, isClient
```

## Configuration

**Columns:** Imported from `KANBAN_COLUMNS` in `lib/csv-upload-config.ts`
**Grid layout:** Uses `KANBAN_GRID_COLS` from config

## Features

**Drag-and-drop:** Move applications between columns
**Edit mode:** Auto-enabled on drag, manual save required
**Optimistic updates:** Local state updated immediately
**Batch save:** All changes saved to database on "Save Changes"

## How It Works

1. User drags application card
2. Component enters edit mode automatically
3. Local state updates with new status
4. User clicks "Save Changes"
5. All changed applications updated in database
6. Page refreshes to show updated data

## Customization

**Change columns:**
```typescript
// Edit KANBAN_COLUMNS in lib/csv-upload-config.ts
export const KANBAN_COLUMNS = [
  { id: 'new_column', title: 'New Status', status: 'NewStatus' },
  // ...
];
```

**Change grid:**
```typescript
// KANBAN_GRID_COLS auto-matches KANBAN_COLUMNS.length
// Or manually set in lib/csv-upload-config.ts
export const KANBAN_GRID_COLS = 6;
```

**Disable auto-edit mode:**
```typescript
// Line 84-86: Remove auto-enter logic
if (!isEditMode) {
  setIsEditMode(true);  // Delete this
}
```

**Change activation distance:**
```typescript
// Line 54: Mouse activation distance
activationConstraint: {
  distance: 10,  // Increase for less sensitive drag
}
```

## Database Updates

Updates `applications` table:
```typescript
.update({
  status: app.status,
  updated_at: new Date().toISOString()
})
.eq('id', app.id)
```

## Hydration

Uses `isClient` state to prevent SSR/hydration mismatches. DnD only enabled after client mount.
