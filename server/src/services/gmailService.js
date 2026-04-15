import { getFirestore } from '../config/firebase.js'
import { getGmailClient } from '../config/gmail.js'

const WITHDRAWAL_LABELS = ['CATEGORY_PERSONAL', 'IMPORTANT']

export async function fetchWithdrawalEmails(userId) {
  const db = getFirestore()
  const gmail = getGmailClient()
  
  const userDoc = await db.collection('users').where('uid', '==', userId).limit(1).get()
  if (userDoc.empty) {
    throw new Error('User not found')
  }
  
  const userData = userDoc.docs[0].data()
  const assignedCompanies = userData.assignedCompanies || []

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      labelIds: ['INBOX'],
    })

    const messages = response.data.messages || []
    const withdrawalEmails = []

    for (const msg of messages) {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })

      const headers = message.data.payload.headers
      const from = headers.find(h => h.name === 'From')?.value || ''
      const subject = headers.find(h => h.name === 'Subject')?.value || ''
      
      if (isWithdrawalEmail(subject, from, assignedCompanies)) {
        withdrawalEmails.push({
          id: message.data.id,
          threadId: message.data.threadId,
          from,
          subject,
          snippet: message.data.snippet,
          date: new Date(parseInt(message.data.internalDate)),
          companyId: extractCompanyId(subject, assignedCompanies),
          isRead: !message.data.labelIds.includes('UNREAD'),
          labelIds: message.data.labelIds,
        })
      }
    }

    return withdrawalEmails
  } catch (error) {
    console.error('Gmail API error:', error)
    throw error
  }
}

function isWithdrawalEmail(subject, from, companies) {
  const withdrawalKeywords = ['withdraw', 'withdrawal', 'cancelled', 'cancel', 'not proceeding']
  const subjectLower = subject.toLowerCase()
  const fromLower = from.toLowerCase()
  
  const hasKeyword = withdrawalKeywords.some(kw => subjectLower.includes(kw))
  const hasCompanyRef = companies.some(c => fromLower.includes(c.toLowerCase()))
  
  return hasKeyword && hasCompanyRef
}

function extractCompanyId(subject, companies) {
  for (const company of companies) {
    if (subject.toLowerCase().includes(company.toLowerCase())) {
      return company
    }
  }
  return null
}

export async function markEmailAsRead(messageId) {
  const gmail = getGmailClient()
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  })
}

export async function storeWithdrawalNotification(userId, emailData) {
  const db = getFirestore()
  await db.collection('withdrawals').add({
    userId,
    ...emailData,
    storedAt: new Date(),
  })
}
