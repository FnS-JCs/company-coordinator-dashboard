import { Router } from 'express';
import { getAuthUrl, saveTokens, fetchCCWithdrawalEmails, isConnected } from '../services/gmailService.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

// GET /api/gmail/auth-url
router.get('/auth-url', (req, res) => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// GET /api/gmail/oauth/callback
router.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    if (!code) throw new Error('No code provided');
    await saveTokens(code);
    
    // Redirect back to the frontend
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/gmail-feed?connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// GET /api/gmail/withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const emails = await fetchCCWithdrawalEmails();
    res.json(emails);
  } catch (error) {
    console.error('Fetch withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal emails' });
  }
});

// GET /api/gmail/status
router.get('/status', (req, res) => {
  try {
    const connected = isConnected();
    res.json({ connected });
  } catch (error) {
    console.error('Gmail status error:', error);
    res.status(500).json({ error: 'Failed to get Gmail status' });
  }
});

export default router;
