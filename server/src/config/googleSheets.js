import { google } from 'googleapis'

const sheets = google.sheets('v4')

const spreadsheetId = process.env.GOOGLE_SHEETS_ID

async function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )
  
  return oauth2Client
}

export async function appendMessageRow(messageData) {
  const auth = await getAuthClient()
  
  const values = [[
    messageData.recipientName,
    messageData.recipientPhone,
    messageData.companyId,
    messageData.messageContent,
    new Date(messageData.sentAt).toISOString(),
    messageData.acknowledgementStatus,
  ]]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A1:F1',
    valueInputOption: 'USER_ENTERED',
    resource: { values },
    auth,
  })
}

export async function bulkAppendMessages(messages) {
  const auth = await getAuthClient()
  
  const values = messages.map(msg => [
    msg.recipientName,
    msg.recipientPhone,
    msg.companyId,
    msg.messageContent,
    new Date(msg.sentAt).toISOString(),
    msg.acknowledgementStatus,
  ])

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A1:F1',
    valueInputOption: 'USER_ENTERED',
    resource: { values },
    auth,
  })
}

export async function updateMessageRow(rowIndex, status) {
  const auth = await getAuthClient()
  
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `F${rowIndex}:F${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[status]] },
    auth,
  })
}
