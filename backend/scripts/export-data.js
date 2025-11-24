const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://root:123456@127.0.0.1:27017/familytree?authSource=admin';

async function exportData() {
    try {
        await mongoose.connect(MONGODB_URI, { family: 4 });
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map((c) => c.name);
        console.log('Collections:', collectionNames);

        const personCol = collectionNames.includes('people') ? 'people' : 'persons';
        const spouseCol = 'spouses';
        const pcCol = collectionNames.find((n) => n.includes('parent') && n.includes('child')) || 'parentchildren';

        // Export Persons
        if (collectionNames.includes(personCol)) {
            const persons = await db.collection(personCol).find().toArray();
            fs.writeFileSync(path.join(__dirname, '../../frontend/src/data/persons.json'), JSON.stringify(persons, null, 2));
            console.log(`Exported ${persons.length} persons from ${personCol}`);
        } else {
            console.log(`Collection ${personCol} not found`);
            fs.writeFileSync(path.join(__dirname, '../../frontend/src/data/persons.json'), JSON.stringify([], null, 2));
        }

        // Export Spouses
        if (collectionNames.includes(spouseCol)) {
            const spouses = await db.collection(spouseCol).find().toArray();
            fs.writeFileSync(path.join(__dirname, '../../frontend/src/data/spouses.json'), JSON.stringify(spouses, null, 2));
            console.log(`Exported ${spouses.length} spouses from ${spouseCol}`);
        } else {
            console.log(`Collection ${spouseCol} not found`);
            fs.writeFileSync(path.join(__dirname, '../../frontend/src/data/spouses.json'), JSON.stringify([], null, 2));
        }

        // Export ParentChildren
        if (collectionNames.includes(pcCol)) {
            const parentChildren = await db.collection(pcCol).find().toArray();
            fs.writeFileSync(path.join(__dirname, '../../frontend/src/data/parent_children.json'), JSON.stringify(parentChildren, null, 2));
            console.log(`Exported ${parentChildren.length} parent_children from ${pcCol}`);
        } else {
            console.log(`Collection ${pcCol} not found`);
            fs.writeFileSync(path.join(__dirname, '../../frontend/src/data/parent_children.json'), JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error('Export failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

exportData();
