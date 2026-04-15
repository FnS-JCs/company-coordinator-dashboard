import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.join(__dirname, '../../data/gmail-tokens.json');

let oauth2Client;

const getOAuth2Client = () => {
  if (oauth2Client) return oauth2Client;

  const clientId = process.env.GMAIL_CLIENT_ID?.replace(/[\[\]]/g, '');
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.replace(/[\[\]]/g, '');
  const redirectUri = process.env.GMAIL_REDIRECT_URI?.replace(/[\[\]]/g, '');

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('CRITICAL: GMAIL environment variables are missing in .env');
    console.log('Current keys:', {
      GMAIL_CLIENT_ID: !!clientId,
      GMAIL_CLIENT_SECRET: !!clientSecret,
      GMAIL_REDIRECT_URI: !!redirectUri
    });
  }

  oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return oauth2Client;
};

export const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
];

export function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: gmailScopes,
    prompt: 'consent',
  });
}

export async function saveTokens(code) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  
  // Ensure data directory exists
  const dataDir = path.dirname(TOKEN_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

export function getGmailClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Gmail not connected. Please connect your account first.');
  }
  
  const client = getOAuth2Client();
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  client.setCredentials(tokens);
  
  return google.gmail({ version: 'v1', auth: client });
}

export function isConnected() {
  return fs.existsSync(TOKEN_PATH);
}

export async function fetchCCWithdrawalEmails() {
  const gmail = getGmailClient();
  
  // 1. Find the label ID for "CC-Withdrawal"
  const labelsRes = await gmail.users.labels.list({ userId: 'me' });
  const withdrawalLabel = labelsRes.data.labels.find(l => l.name === 'CC-Withdrawal');
  
  if (!withdrawalLabel) {
    return [];
  }

  // 2. List messages with this label
  const messagesRes = await gmail.users.messages.list({
    userId: 'me',
    labelIds: [withdrawalLabel.id],
    maxResults: 50,
  });

  const messages = messagesRes.data.messages || [];
  const withdrawalEmails = [];

  for (const msg of messages) {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });

    const headers = message.data.payload.headers;
    const from = headers.find(h => h.name === 'From')?.value || '';
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    withdrawalEmails.push({
      id: message.data.id,
      sender: from,
      subject,
      date: new Date(date).toISOString(),
      snippet: message.data.snippet,
    });
  }

  return withdrawalEmails;
}

export { getOAuth2Client };
