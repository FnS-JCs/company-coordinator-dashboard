import { Router } from 'express';
import { getDb, verifyRequest, getCurrentUserData, isDevMode } from '../middleware/auth.js';

const router = Router();
router.use(verifyRequest);

async function getAcademicYear(db) {
  const doc = await db.collection('settings').doc('academicYear').get();
  return doc.exists ? doc.data().year : '2025-26';
}

router.get('/', async (req, res) => {
  try {
    const { email, role } = req.user
    console.log('GET /api/companies called by:', email, 'role:', role)

    const db = getDb()
    let snapshot

    if (role === 'senior_coordinator') {
      snapshot = await db.collection('companies')
        .where('seniorCoordinatorEmail', '==', email)
        .get()
    } else if (role === 'junior_coordinator') {
      snapshot = await db.collection('companies')
        .where('delegatedToJcEmail', '==', email)
        .get()
    } else if (role === 'admin') {
      snapshot = await db.collection('companies').get()
    } else {
      return res.json([])
    }

    const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log('Companies found:', companies.length)
    res.json(companies)
  } catch (error) {
    console.error('Get companies error:', error)
    res.status(500).json({ error: error.message })
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const companyRef = db.collection('companies').doc(id);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = { id: companyDoc.id, ...companyDoc.data() };
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, rounds } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const db = getDb();
    const userData = await getCurrentUserData(req, req.user.email);

    if (!userData || userData.role !== 'senior_coordinator') {
      return res.status(403).json({ error: 'Only senior coordinators can create companies' });
    }

    const year = await getAcademicYear(db);
    const labelSc = `GRC ${year}/SCs/${userData.name}`;
    const companyCategory = type === 'internship' ? 'Internship Companies' : 'Placement Companies';
    const labelCompany = `GRC ${year}/${companyCategory}/${name}`;

    const companyData = {
      name,
      type: type || 'placement',
      rounds: rounds || [],
      seniorCoordinatorEmail: req.user.email,
      delegatedToJcEmail: null,
      labelSc,
      labelCompany,
      createdBy: userData.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection('companies').add(companyData);
    res.status(201).json({ id: docRef.id, ...companyData });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, rounds } = req.body;

    const db = getDb();
    const companyRef = db.collection('companies').doc(id);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companyDoc.data();
    if (company.seniorCoordinatorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Only the assigned SC can update this company' });
    }

    const updates = {
      ...(name && { name }),
      ...(type && { type }),
      ...(rounds && { rounds }),
      updatedAt: new Date(),
    };

    await companyRef.update(updates);
    const updatedDoc = await companyRef.get();

    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

router.post('/:id/delegate', async (req, res) => {
  try {
    const { id } = req.params;
    const { jcEmail } = req.body;

    if (!jcEmail) {
      return res.status(400).json({ error: 'JC email is required' });
    }

    const db = getDb();
    const companyRef = db.collection('companies').doc(id);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companyDoc.data();
    if (company.seniorCoordinatorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Only the assigned SC can delegate this company' });
    }

    await companyRef.update({
      delegatedToJcEmail: jcEmail,
      updatedAt: new Date(),
    });

    const updatedDoc = await companyRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error delegating company:', error);
    res.status(500).json({ error: 'Failed to delegate company' });
  }
});

router.post('/:id/revert-delegation', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDb();
    const companyRef = db.collection('companies').doc(id);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = companyDoc.data();
    if (company.seniorCoordinatorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Only the assigned SC can revert delegation' });
    }

    await companyRef.update({
      delegatedToJcEmail: null,
      updatedAt: new Date(),
    });

    const updatedDoc = await companyRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Error reverting delegation:', error);
    res.status(500).json({ error: 'Failed to revert delegation' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDb();
    const companyRef = db.collection('companies').doc(id);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const userData = isDevMode() ? { role: req.user.role } : await getCurrentUserData(req.user.email);
    
    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }

    const company = companyDoc.data();

    if (userData.role !== 'admin' && company.seniorCoordinatorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Only the assigned SC or an admin can delete this company' });
    }

    await companyRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

export default router;
