import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function seed() {
  console.log('Seeding Firestore...');

  const adminEmail = 'srcc.pc.jc.fns2526@gmail.com';

  const usersRef = db.collection('users');
  const existingAdmin = await usersRef.where('email', '==', adminEmail).limit(1).get();

  if (existingAdmin.empty) {
    await usersRef.add({
      name: 'Admin User',
      email: adminEmail,
      phone: null,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Admin user created:', adminEmail);
  } else {
    console.log('Admin user already exists');
  }

  const settingsRef = db.collection('settings').doc('admin');
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    await settingsRef.set({
      email: adminEmail,
      updatedAt: new Date(),
    });
    console.log('Admin settings created');
  } else {
    console.log('Admin settings already exist');
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
