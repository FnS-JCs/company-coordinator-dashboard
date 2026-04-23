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

export async function fetchCompanyEmails(company) {
  const gmail = getGmailClient();

  const labelsRes = await gmail.users.labels.list({ userId: 'me' });
  const allLabels = labelsRes.data.labels || [];

  const scLabel = allLabels.find((l) => l.name === company.labelSc);
  const companyLabel = allLabels.find((l) => l.name === company.labelCompany);

  if (!scLabel || !companyLabel) {
    return [];
  }

  const messagesRes = await gmail.users.messages.list({
    userId: 'me',
    labelIds: [scLabel.id, companyLabel.id],
    maxResults: 50,
  });

  const messages = messagesRes.data.messages || [];
  const emails = [];

  for (const msg of messages) {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });

    const headers = message.data.payload.headers;
    emails.push({
      id: message.data.id,
      from: headers.find((h) => h.name === 'From')?.value || '',
      subject: headers.find((h) => h.name === 'Subject')?.value || '',
      date: headers.find((h) => h.name === 'Date')?.value || '',
      snippet: message.data.snippet,
    });
  }

  return emails;
}

export async function getEmailDetail(messageId) {
  const gmail = getGmailClient();
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });

  const payload = message.data.payload;
  let body = '';

  const findPart = (parts, mimeType) => {
    if (!parts) return null;
    for (const part of parts) {
      if (part.mimeType === mimeType) return part;
      if (part.parts) {
        const found = findPart(part.parts, mimeType);
        if (found) return found;
      }
    }
    return null;
  };

  const htmlPart = findPart([payload], 'text/html');
  const textPart = findPart([payload], 'text/plain');

  if (htmlPart && htmlPart.body && htmlPart.body.data) {
    body = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
  } else if (textPart && textPart.body && textPart.body.data) {
    body = Buffer.from(textPart.body.data, 'base64').toString('utf8');
  } else {
    body = message.data.snippet;
  }

  // Handle inline images
  const inlineImages = [];
  const findInlineImages = (parts) => {
    if (!parts) return;
    for (const part of parts) {
      const contentIdHeader = part.headers?.find(h => h.name.toLowerCase() === 'content-id');
      if (contentIdHeader && part.body?.attachmentId) {
        const cid = contentIdHeader.value.replace(/[<>]/g, '');
        inlineImages.push({
          cid,
          attachmentId: part.body.attachmentId,
          mimeType: part.mimeType
        });
      }
      if (part.parts) {
        findInlineImages(part.parts);
      }
    }
  };
  findInlineImages([payload]);

  // Replace cid references with base64 data URLs
  for (const img of inlineImages) {
    try {
      const attachment = await getAttachment(messageId, img.attachmentId);
      const base64Data = attachment.data.toString('base64');
      const dataUrl = `data:${img.mimeType};base64,${base64Data}`;
      const cidRegex = new RegExp(`cid:${img.cid}`, 'g');
      body = body.replace(cidRegex, dataUrl);
    } catch (error) {
      console.error(`Failed to resolve inline image ${img.cid}:`, error);
    }
  }

  const headers = payload.headers;
  
  // Extract attachments
  const attachments = [];
  const findAttachments = (parts) => {
    if (!parts) return;
    for (const part of parts) {
      if (part.filename && part.body && part.body.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId,
          size: part.body.size,
        });
      }
      if (part.parts) {
        findAttachments(part.parts);
      }
    }
  };
  findAttachments(payload.parts);

  return {
    id: message.data.id,
    from: headers.find((h) => h.name === 'From')?.value || '',
    subject: headers.find((h) => h.name === 'Subject')?.value || '',
    date: headers.find((h) => h.name === 'Date')?.value || '',
    body,
    snippet: message.data.snippet,
    attachments,
  };
}

export async function getAttachment(messageId, attachmentId) {
  const gmail = getGmailClient();
  const res = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId: messageId,
    id: attachmentId,
  });

  return {
    data: Buffer.from(res.data.data, 'base64'),
    size: res.data.size,
  };
}

export { getOAuth2Client };
