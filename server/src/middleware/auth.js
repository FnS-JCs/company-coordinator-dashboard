import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let db;

function initializeFirebase() {
  if (admin.apps.length > 0) return;
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  db = admin.firestore();
}

initializeFirebase();

export function getDb() {
  if (!db) throw new Error('Firebase not initialized');
  return db;
}

export function getFirestore() {
  return db;
}

export function isDevMode() {
  return process.env.DEV_AUTH_BYPASS === 'true';
}

export async function verifyRequest(req, res, next) {
  if (isDevMode()) {
    const devRole = req.headers['x-dev-role'];
    const devEmail = req.headers['x-dev-email'];

    if (devRole && devEmail) {
      req.user = {
        uid: 'dev-user',
        email: devEmail,
        role: devRole,
      };
      return next();
    }
    return res.status(401).json({ error: 'Dev mode: missing X-Dev-Role or X-Dev-Email header' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function requireAdmin(req, res, next) {
  if (isDevMode() && req.headers['x-dev-role'] === 'admin') {
    req.user = {
      uid: 'dev-user',
      email: req.headers['x-dev-email'],
      role: 'admin',
    };
    return next();
  }

  if (req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
}

export async function getCurrentUserData(email) {
  const db = getDb();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { uid: doc.id, ...doc.data() };
}
