import { Router } from 'express';
import admin from 'firebase-admin';
import { getDb } from '../middleware/auth.js';

const router = Router();

router.post('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({ error: 'Token does not contain an email address' });
    }

    const db = getDb();
    const userSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.log(`Access denied for email: ${email}`);
      return res.status(403).json({ error: 'Access denied. Contact the administrator.' });
    }

    const userData = userSnapshot.docs[0].data();
    res.json({
      role: userData.role,
      name: userData.name || decodedToken.name,
      email: email,
      uid: decodedToken.uid
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
