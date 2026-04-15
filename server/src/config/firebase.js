import admin from 'firebase-admin'

let db
let firestore

export function initializeFirebase() {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  db = admin.firestore()
  firestore = db
}

export function getDb() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.')
  }
  return db
}

export function getFirestore() {
  return firestore
}
