# Database Migration - CCCD Unique Constraint

## Changes Made

### Backend Schema (`person.schema.ts`)

- Changed `cccd` from optional (`default: null`) to **required** and **unique**
- Type changed from `string | null` to `string`

### DTO Validation (`create-person.dto.ts`)

- Changed `cccd` from `@IsOptional()` to `@IsNotEmpty()`
- Now required in API requests

### Service Layer (`person.service.ts`)

- Added duplicate CCCD check before create
- Added duplicate CCCD check before update
- Proper error handling with `ConflictException`

### Frontend (`AddPersonModal.tsx`)

- Added required attribute to CCCD input
- Added red asterisk (\*) to indicate required field
- Added placeholder text

## Migration Steps

### 1. Check Existing Data

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/family-tree

# Check for null CCCD
db.people.countDocuments({ cccd: null })

# Check for duplicate CCCD
db.people.aggregate([
  { $match: { cccd: { $ne: null } } },
  { $group: { _id: "$cccd", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

### 2. Clean Data (if needed)

```bash
# Option 1: Generate unique CCCD for null values
db.people.find({ cccd: null }).forEach(doc => {
  db.people.updateOne(
    { _id: doc._id },
    { $set: { cccd: `TEMP_${doc._id}` } }
  );
});

# Option 2: Delete records with null CCCD (BE CAREFUL!)
# db.people.deleteMany({ cccd: null });
```

### 3. Run Migration Script

```bash
cd backend/scripts
mongosh mongodb://localhost:27017/family-tree ensure-cccd-unique.js
```

### 4. Restart Backend

```bash
cd backend
npm run start:dev
```

## Verification

After migration, test:

1. **Create with duplicate CCCD should fail:**

    ```bash
    curl -X POST http://localhost:3000/api/person \
      -H "Content-Type: application/json" \
      -d '{"cccd":"123456789","name":"Test","gender":"MALE"}'
    ```

    Second call with same CCCD should return 409 Conflict

2. **Create without CCCD should fail:**

    ```bash
    curl -X POST http://localhost:3000/api/person \
      -H "Content-Type: application/json" \
      -d '{"name":"Test","gender":"MALE"}'
    ```

    Should return 400 Bad Request

3. **Frontend validation:**
    - Open Add Person modal
    - Try to submit without CCCD → Form validation should block
    - Enter duplicate CCCD → API should return error message

## Rollback (if needed)

```typescript
// In person.schema.ts
@Prop({ unique: true, default: null })
cccd: string | null;

// In create-person.dto.ts
@IsOptional()
cccd?: string;
```

Then drop the unique index:

```bash
db.people.dropIndex("cccd_1")
```
