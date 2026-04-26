import { Router } from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyRequest, getDb } from '../middleware/auth.js';
import { fetchCompanyEmails, getEmailDetail, getAttachment } from '../services/gmailService.js';

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
      if (process.env.DEV_AUTH_BYPASS === 'true') {
        return res.json([]);
      }
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

router.get('/emails/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!fs.existsSync(TOKEN_PATH)) {
      if (process.env.DEV_AUTH_BYPASS === 'true') {
        return res.json({ id: messageId, subject: 'Mock Email', from: 'dev@example.com', body: 'This is a mock email body for development.' });
      }
      return res.status(400).json({ error: 'Gmail not connected' });
    }

    const email = await getEmailDetail(messageId);
    res.json(email);
  } catch (error) {
    console.error('Error fetching email detail:', error);
    res.status(500).json({ error: 'Failed to fetch email detail' });
  }
});

router.get('/emails/:messageId/attachments/:attachmentId', async (req, res) => {
  try {
    const { messageId, attachmentId } = req.params;
    const { filename, mimeType } = req.query;

    if (!fs.existsSync(TOKEN_PATH)) {
      return res.status(400).json({ error: 'Gmail not connected' });
    }

    const attachment = await getAttachment(messageId, attachmentId);
    
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'attachment'}"`);
    res.send(attachment.data);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

router.post('/mark-read', async (req, res) => {
  try {
    const { messageId, companyId } = req.body;
    const userUid = req.user?.uid || 'dev-user';

    if (!messageId) {
      return res.status(400).json({ error: 'messageId is required' });
    }

    if (fs.existsSync(TOKEN_PATH)) {
      const gmail = getGmailClient();
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { removeLabelIds: ['UNREAD'] },
      });
    } else if (process.env.DEV_AUTH_BYPASS !== 'true') {
      return res.status(400).json({ error: 'Gmail not connected' });
    }

    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const safeMessageId = messageId.replace(/[^a-zA-Z0-9]/g, '_');
    const docId = `${userUid}_${safeMessageId}`;
    await db.collection('emailReadStatus').doc(docId).set({
      userUid,
      messageId,
      companyId: companyId || null,
      readAt: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error details:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.get('/read-status', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const db = (await import('../middleware/auth.js')).getDb();
    const userUid = req.user.uid || 'dev-user';

    const snapshot = await db.collection('emailReadStatus')
      .where('userUid', '==', userUid)
      .get();

    const readMessageIds = snapshot.docs
      .map(doc => doc.data())
      .filter(data => data.companyId === companyId)
      .map(data => data.gmailMessageId);

    res.json({ readMessageIds });
  } catch (error) {
    console.error('Error fetching read status:', error);
    res.status(500).json({ error: 'Failed to fetch read status' });
  }
});

router.get('/unread-counts', async (req, res) => {
  try {
    const { companyIds } = req.query;
    if (!companyIds) return res.json({ counts: {} });

    const ids = companyIds.split(',').filter(Boolean);
    if (ids.length === 0) return res.json({ counts: {} });

    if (!fs.existsSync(TOKEN_PATH)) {
      return res.json({ counts: Object.fromEntries(ids.map(id => [id, 0])) });
    }

    const db = (await import('../middleware/auth.js')).getDb();
    const userUid = req.user.uid || 'dev-user';

    const readSnapshot = await db.collection('emailReadStatus')
      .where('userUid', '==', userUid)
      .get();

    const readIds = new Set(readSnapshot.docs.map(doc => doc.data().gmailMessageId));

    const gmail = getGmailClient();
    const labelsRes = await gmail.users.labels.list({ userId: 'me' });
    const allLabels = labelsRes.data.labels || [];

    const companyDocs = await Promise.all(
      ids.map(id => db.collection('companies').doc(id).get())
    );

    const counts = {};
    await Promise.all(
      companyDocs.map(async (doc, i) => {
        const companyId = ids[i];
        if (!doc.exists) { counts[companyId] = 0; return; }

        const data = doc.data();
        const scLabel = allLabels.find(l => l.name === data.labelSc);
        const companyLabel = allLabels.find(l => l.name === data.labelCompany);

        if (!scLabel || !companyLabel) { counts[companyId] = 0; return; }

        try {
          const messagesRes = await gmail.users.messages.list({
            userId: 'me',
            labelIds: [scLabel.id, companyLabel.id],
            maxResults: 50,
          });
          const messages = messagesRes.data.messages || [];
          counts[companyId] = messages.filter(m => !readIds.has(m.id)).length;
        } catch {
          counts[companyId] = 0;
        }
      })
    );

    res.json({ counts });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
});

export default router;
