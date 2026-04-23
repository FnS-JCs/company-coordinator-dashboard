import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let db;

// In-memory store for dev mode
const mockStore = {
  companies: [],
  users: [],
  settings: {
    academicYear: { year: '2025-26' }
  }
};

function initializeFirebase() {
  if (admin.apps.length > 0) return;
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    db = admin.firestore();
  } catch (error) {
    if (isDevMode()) {
      console.warn('Firebase initialization failed, but continuing in DEV_AUTH_BYPASS mode');
      // Mock db that persists in mockStore
      db = {
        collection: (colName) => ({
          where: (field, op, value) => ({
            limit: () => ({
              get: async () => {
                const docs = (mockStore[colName] || [])
                  .filter(item => item[field] === value)
                  .map(item => ({ id: item.id || 'mock-id', data: () => item }));
                return { empty: docs.length === 0, docs };
              }
            }),
            get: async () => {
              const docs = (mockStore[colName] || [])
                .filter(item => item[field] === value)
                .map(item => ({ id: item.id || 'mock-id', data: () => item }));
              return { empty: docs.length === 0, docs };
            }
          }),
          doc: (docId) => ({
            get: async () => {
              let data;
              if (Array.isArray(mockStore[colName])) {
                data = mockStore[colName].find(item => item.id === docId);
              } else {
                data = mockStore[colName]?.[docId];
              }
              return { exists: !!data, data: () => data };
            },
            set: async (data) => {
              if (Array.isArray(mockStore[colName])) {
                const idx = mockStore[colName].findIndex(item => item.id === docId);
                if (idx !== -1) mockStore[colName][idx] = { ...data, id: docId };
                else mockStore[colName].push({ ...data, id: docId });
              } else {
                if (!mockStore[colName]) mockStore[colName] = {};
                mockStore[colName][docId] = data;
              }
            },
            update: async (data) => {
              let item;
              if (Array.isArray(mockStore[colName])) {
                item = mockStore[colName].find(i => i.id === docId);
              } else {
                item = mockStore[colName]?.[docId];
              }
              if (item) Object.assign(item, data);
            },
            delete: async () => {
              if (Array.isArray(mockStore[colName])) {
                mockStore[colName] = mockStore[colName].filter(i => i.id !== docId);
              } else if (mockStore[colName]) {
                delete mockStore[colName][docId];
              }
            }
          }),
          add: async (data) => {
            if (!mockStore[colName]) mockStore[colName] = [];
            const newItem = { id: 'mock-' + Math.random().toString(36).substr(2, 9), ...data };
            mockStore[colName].push(newItem);
            return { id: newItem.id };
          },
          get: async () => {
            const items = mockStore[colName] || [];
            const docs = Array.isArray(items) 
              ? items.map(item => ({ id: item.id, data: () => item }))
              : Object.entries(items).map(([id, data]) => ({ id, data: () => data }));
            return { docs };
          }
        })
      };
    } else {
      throw error;
    }
  }
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
    // Check if it's an OAuth callback - allow it without headers
    // Using originalUrl to handle cases where middleware is inside a router
    const fullPath = req.originalUrl.split('?')[0];
    if (fullPath === '/api/gmail/oauth/callback') {
      return next();
    }

    // Exception for attachment downloads in dev mode (since they are direct browser requests)
    if (req.path.includes('/attachments/') && req.method === 'GET') {
      req.user = {
        uid: 'dev-user',
        email: 'dev@srcc.du.ac.in',
        role: 'admin',
      };
      return next();
    }

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

export async function getCurrentUserData(req, email) {
  if (isDevMode()) {
    const devRole = req.headers['x-dev-role'] || 'senior_coordinator';
    return {
      uid: 'dev-user',
      email: email,
      role: devRole,
      name: email.split('@')[0],
    };
  }

  const db = getDb();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { uid: doc.id, ...doc.data() };
}
