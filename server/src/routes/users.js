import { Router } from 'express';
import { getDb, verifyRequest, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(verifyRequest);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }
    
    const db = getDb();
    const usersRef = db.collection('users');
    
    const existing = await usersRef.where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const userData = {
      name,
      email,
      phone: phone || null,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await usersRef.add(userData);
    res.status(201).json({ uid: docRef.id, ...userData });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/:uid', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, email, phone, role } = req.body;
    
    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(role && { role }),
      updatedAt: new Date(),
    };
    
    await userRef.update(updates);
    const updatedDoc = await userRef.get();
    
    res.json({ uid: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:uid', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const db = getDb();
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await userRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
