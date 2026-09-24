/**
 * Script to migrate all backed up Firestore data to a new Firebase project.
 * Usage: node restore-new-project.js
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';

async function restore() {
  if (!fs.existsSync('./firebase-applet-config.json')) {
    console.error('Error: firebase-applet-config.json not found');
    process.exit(1);
  }
  if (!fs.existsSync('./firestore-data-backup.json')) {
    console.error('Error: firestore-data-backup.json not found');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const dump = JSON.parse(fs.readFileSync('./firestore-data-backup.json', 'utf8'));

  console.log('Restoring data to target project:', config.projectId);
  const app = initializeApp(config);
  const db = getFirestore(app);

  for (const [colName, records] of Object.entries(dump)) {
    if (!Array.isArray(records) || records.length === 0) continue;
    console.log(`Writing ${records.length} records to collection: ${colName}...`);
    
    let batch = writeBatch(db);
    let count = 0;
    for (const record of records) {
      const { _id, ...data } = record;
      if (!_id) continue;
      batch.set(doc(db, colName, _id), data, { merge: true });
      count++;
      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 400 !== 0) {
      await batch.commit();
    }
    console.log(`Successfully restored ${records.length} records to ${colName}`);
  }

  console.log('--- ALL DATA RESTORED TO NEW PROJECT SUCCESSFULLY ---');
  process.exit(0);
}

restore().catch(err => {
  console.error('Restore failed:', err);
  process.exit(1);
});

