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
      id: doc.id,
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
    const { name, email, phone, role, uid } = req.body;
    
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
      uid: uid || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await usersRef.add(userData);
    res.status(201).json({ id: docRef.id, ...userData });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, uid } = req.body;
    
    const db = getDb();
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(role && { role }),
      ...(uid && { uid }),
      updatedAt: new Date(),
    };
    
    await userRef.update(updates);
    const updatedDoc = await userRef.get();
    
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const userRef = db.collection('users').doc(id);
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
