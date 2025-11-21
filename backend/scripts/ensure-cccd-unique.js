// Migration script to ensure CCCD unique index
// Run this if you have existing data with duplicate or null CCCD

db.people.aggregate([{ $match: { cccd: null } }, { $count: 'nullCccdCount' }]).forEach((result) => {
    print(`Found ${result.nullCccdCount} persons with null CCCD`);
});

// Find duplicates
db.people.aggregate([{ $match: { cccd: { $ne: null } } }, { $group: { _id: '$cccd', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]).forEach((result) => {
    print(`Duplicate CCCD found: ${result._id} (${result.count} times)`);
});

// Create unique index on cccd
db.people.createIndex({ cccd: 1 }, { unique: true });

print('Migration completed: CCCD unique index created');
