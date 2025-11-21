# Cascade Delete and Edit Person Functionality

## Changes Overview

This document describes the implementation of cascade delete functionality and edit/delete person features.

## Backend Changes

### 1. SpouseService (`backend/src/modules/spouse/spouse.service.ts`)

-   **Added method**: `deleteSpousesByPersonId(personId: string)`
    -   Deletes all spouse relationships where the person is husband or wife
    -   Cascade deletes all children of those spouse relationships via ParentChildService
    -   Returns count of deleted spouse relationships

### 2. ParentChildService (`backend/src/modules/parent-child/parent-child.service.ts`)

-   **Added method**: `deleteChildRelationships(childId: string)`

    -   Deletes all parent-child relationships where the person is the child
    -   Returns count of deleted relationships

-   **Added method**: `deleteByParentId(parentId: string)`
    -   Deletes all parent-child relationships for a spouse relationship
    -   Used by SpouseService during cascade delete
    -   Returns count of deleted relationships

### 3. PersonService (`backend/src/modules/person/person.service.ts`)

-   **Modified method**: `remove(id: string)`
    -   Now performs cascade delete:
        1. Deletes all spouse relationships (via `spouseService.deleteSpousesByPersonId()`)
        2. Deletes all child relationships (via `parentChildService.deleteChildRelationships()`)
        3. Finally deletes the person record
    -   All related data is automatically cleaned up

### 4. Module Dependencies (`backend/src/modules/spouse/spouse.module.ts`)

-   Added `forwardRef` import for circular dependency handling
-   Imported `ParentChildModule` to access `ParentChildService`
-   Updated SpouseService constructor with `@Inject(forwardRef(...))` for ParentChildService

## Frontend Changes

### 1. PersonDetailModal (`frontend/src/components/PersonDetailModal/PersonDetailModal.tsx`)

-   **Added Props**:

    -   `onUpdate?: () => void` - Callback to reload data after edit/delete

-   **Added State**:

    -   `isEditing: boolean` - Toggle between view and edit mode
    -   `editForm: Partial<Person>` - Form data for editing

-   **Added Functions**:

    -   `handleEdit()` - Switches to edit mode
    -   `handleCancelEdit()` - Cancels edit and resets form
    -   `handleSaveEdit()` - Saves edited person data, calls API
    -   `handleDelete()` - Deletes person with confirmation, shows cascade warning

-   **UI Changes**:
    -   Added "Sửa" (Edit) and "Xóa" (Delete) buttons in header
    -   Edit mode shows editable form fields for all person properties
    -   Edit mode shows "Hủy" (Cancel) and "Lưu" (Save) buttons
    -   View mode shows read-only person information
    -   Delete confirmation warns about cascade deletion of relationships

### 2. Root View (`frontend/src/views/Root.tsx`)

-   Added `onUpdate={loadData}` prop to PersonDetailModal
-   Ensures tree reloads after edit/delete operations

## Cascade Delete Flow

When a person is deleted:

1. **PersonService.remove()** is called
2. Calls **SpouseService.deleteSpousesByPersonId()**
    - Finds all spouse relationships for the person
    - For each spouse relationship:
        - Calls **ParentChildService.deleteByParentId()** to delete children
    - Deletes the spouse relationships
3. Calls **ParentChildService.deleteChildRelationships()**
    - Deletes all parent-child relationships where person is child
4. Finally deletes the person record

This ensures no orphaned data remains in the database.

## User Experience

### Edit Person

1. User clicks person node to open PersonDetailModal
2. Clicks "Sửa" button
3. Edits fields in form (name, gender, CCCD, birth, death, address, description)
4. Clicks "Lưu" to save or "Hủy" to cancel
5. On success, modal closes and tree reloads with updated data

### Delete Person

1. User clicks person node to open PersonDetailModal
2. Clicks "Xóa" button
3. Confirmation dialog appears warning about cascade deletion
4. If confirmed, person and all relationships are deleted
5. On success, modal closes and tree reloads without the person

## Testing Recommendations

1. **Create Test Data**:

    - Create person A with spouse B
    - Add children C, D to spouse relationship A-B
    - Create person E as child of A (from another relationship)

2. **Test Cascade Delete**:

    - Delete person A
    - Verify:
        - Spouse relationship A-B is deleted
        - Children C, D are orphaned (their parent-child records deleted)
        - Person E's parent-child relationship is deleted
        - Persons B, C, D, E still exist (only relationships deleted)

3. **Test Edit**:
    - Edit person details
    - Verify CCCD uniqueness validation still works
    - Verify changes are reflected in the tree

## Notes

-   CCCD must remain unique when editing (validation enforced at backend)
-   Cascade delete only removes relationships, not related persons
-   If you want to also delete related persons (e.g., orphaned children), additional logic needed
-   All operations use transactions implicitly via Mongoose operations
