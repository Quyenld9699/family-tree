import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

const MONGODB_URI = 'mongodb://root:123456@localhost:27017/familytree?authSource=admin';

async function exportData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection failed');
        }

        // List collections to verify names
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map((c) => c.name);
        console.log('Collections:', collectionNames);

        // Determine collection names
        const personCol = collectionNames.includes('people') ? 'people' : 'persons';
        const spouseCol = 'spouses';
        const pcCol = collectionNames.includes('parentchildren') ? 'parentchildren' : 'parent_children';

        // Export Persons
        if (collectionNames.includes(personCol)) {
            const persons = await db.collection(personCol).find().toArray();
            fs.writeFileSync(path.join(__dirname, '../../../frontend/src/data/persons.json'), JSON.stringify(persons, null, 2));
            console.log(`Exported ${persons.length} persons from ${personCol}`);
        } else {
            console.log(`Collection ${personCol} not found`);
            fs.writeFileSync(path.join(__dirname, '../../../frontend/src/data/persons.json'), JSON.stringify([], null, 2));
        }

        // Export Spouses
        if (collectionNames.includes(spouseCol)) {
            const spouses = await db.collection(spouseCol).find().toArray();
            fs.writeFileSync(path.join(__dirname, '../../../frontend/src/data/spouses.json'), JSON.stringify(spouses, null, 2));
            console.log(`Exported ${spouses.length} spouses from ${spouseCol}`);
        } else {
            console.log(`Collection ${spouseCol} not found`);
            fs.writeFileSync(path.join(__dirname, '../../../frontend/src/data/spouses.json'), JSON.stringify([], null, 2));
        }

        // Export ParentChildren
        // Try to find the correct name for parent-child collection
        const possiblePcNames = ['parentchildren', 'parent_children', 'parentchilds'];
        const foundPcName = possiblePcNames.find((name) => collectionNames.includes(name));

        if (foundPcName) {
            const parentChildren = await db.collection(foundPcName).find().toArray();
            fs.writeFileSync(path.join(__dirname, '../../../frontend/src/data/parent_children.json'), JSON.stringify(parentChildren, null, 2));
            console.log(`Exported ${parentChildren.length} parent_children from ${foundPcName}`);
        } else {
            console.log('ParentChild collection not found');
            fs.writeFileSync(path.join(__dirname, '../../../frontend/src/data/parent_children.json'), JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

exportData();
