import { Router } from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyRequest } from '../middleware/auth.js';
import { fetchCompanyEmails } from '../services/gmailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.join(__dirname, '../../data/gmail-tokens.json');

const router = Router();
router.use(verifyRequest);

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID?.replace(/[\[\]]/g, '');
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.replace(/[\[\]]/g, '');
  const redirectUri = process.env.GMAIL_REDIRECT_URI?.replace(/[\[\]]/g, '');

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getGmailClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Gmail not connected');
  }

  const oauth2Client = getOAuth2Client();
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oauth2Client.setCredentials(tokens);

  return google.gmail({ version: 'v1', auth: oauth2Client });
}


router.get('/connect-url', async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      prompt: 'consent',
    });
    res.json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

router.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    if (!code) {
      return res.status(400).send('No code provided');
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    const dataDir = path.dirname(TOKEN_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/admin?gmail=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

router.get('/status', (req, res) => {
  try {
    const connected = fs.existsSync(TOKEN_PATH);
    let email = null;

    if (connected) {
      try {
        const oauth2Client = getOAuth2Client();
        const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oauth2Client.setCredentials(tokens);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const profile = gmail.users.getProfile({ userId: 'me' });
        email = profile.data.emailAddress;
      } catch (e) {
        email = 'Connected (could not fetch email)';
      }
    }

    res.json({ connected, email });
  } catch (error) {
    console.error('Gmail status error:', error);
    res.status(500).json({ error: 'Failed to get Gmail status' });
  }
});

router.post('/disconnect', (req, res) => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
});

router.get('/emails', async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    if (!fs.existsSync(TOKEN_PATH)) {
      return res.status(400).json({ error: 'Gmail not connected' });
    }

    const db = (await import('../middleware/auth.js')).getDb();
    const companyDoc = await db.collection('companies').doc(companyId).get();

    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const emails = await fetchCompanyEmails(companyDoc.data());
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

router.post('/mark-read', async (req, res) => {
  try {
    const { messageId, companyId } = req.body;

    if (!fs.existsSync(TOKEN_PATH)) {
      return res.status(400).json({ error: 'Gmail not connected' });
    }

    const gmail = getGmailClient();

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    const db = (await import('../middleware/auth.js')).getDb();
    await db.collection('emailReadStatus').add({
      gmailMessageId: messageId,
      companyId: companyId || null,
      userUid: req.user.uid || 'dev-user',
      readAt: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

export default router;
