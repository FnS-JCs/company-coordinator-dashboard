import { Router } from 'express';
import { getDb, verifyRequest, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(verifyRequest);

router.get('/admin-email', async (req, res) => {
  try {
    const db = getDb();
    const settingsRef = db.collection('settings').doc('admin');
    const doc = await settingsRef.get();

    if (!doc.exists) {
      return res.json({ email: null });
    }

    res.json({ email: doc.data().email });
  } catch (error) {
    console.error('Error fetching admin email:', error);
    res.status(500).json({ error: 'Failed to fetch admin email' });
  }
});

router.post('/admin-email', requireAdmin, async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ error: 'New email is required' });
    }

    const db = getDb();
    const settingsRef = db.collection('settings').doc('admin');

    await settingsRef.set({
      email: newEmail,
      updatedAt: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating admin email:', error);
    res.status(500).json({ error: 'Failed to update admin email' });
  }
});

router.get('/academic-year', (req, res) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let academicYear;
  if (month >= 6) {
    academicYear = `${year}-${year + 1}`;
  } else {
    academicYear = `${year - 1}-${year}`;
  }

  res.json({ year: academicYear });
});

export default router;
