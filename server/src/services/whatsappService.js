import { getFirestore } from '../config/firebase.js'
import axios from 'axios'

const WHATSAPP_API_URL = process.env.WHATSAPP_BUSINESS_API
const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

export async function sendWhatsAppMessage(payload) {
  const db = getFirestore()
  const { companyId, recipientName, recipientPhone, messageContent, userId } = payload

  try {
    const response = await axios.post(`${WHATSAPP_API_URL}/messages`, {
      messaging_product: 'whatsapp',
      to: recipientPhone,
      type: 'text',
      text: { body: messageContent },
    })

    const messageData = {
      companyId,
      recipientName,
      recipientPhone,
      messageContent,
      sentAt: new Date(),
      acknowledgementStatus: 'sent',
      whatsappMessageId: response.data.messages?.[0]?.id || null,
      userId,
    }

    const docRef = await db.collection('whatsapp_messages').add(messageData)
    
    await appendToGoogleSheet(messageData)
    
    return { id: docRef.id, ...messageData }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    throw new Error('Failed to send WhatsApp message')
  }
}

export async function getMessagesByUser(userId) {
  const db = getFirestore()
  const snapshot = await db.collection('whatsapp_messages')
    .where('userId', '==', userId)
    .orderBy('sentAt', 'desc')
    .limit(100)
    .get()

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function updateAcknowledgementStatus(messageId, status) {
  const db = getFirestore()
  await db.collection('whatsapp_messages').doc(messageId).update({
    acknowledgementStatus: status,
    updatedAt: new Date(),
  })
}

export async function syncAcknowledgementFromWhatsApp(whatsappMessageId, status) {
  const db = getFirestore()
  const snapshot = await db.collection('whatsapp_messages')
    .where('whatsappMessageId', '==', whatsappMessageId)
    .limit(1)
    .get()

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      acknowledgementStatus: status,
      updatedAt: new Date(),
    })
  }
}

async function appendToGoogleSheet(messageData) {
  try {
    const sheets = await import('../config/googleSheets.js')
    await sheets.appendMessageRow(messageData)
  } catch (error) {
    console.error('Google Sheets sync error:', error)
  }
}

export async function syncAllMessagesWithSheets() {
  const db = getFirestore()
  const snapshot = await db.collection('whatsapp_messages')
    .orderBy('sentAt', 'desc')
    .limit(500)
    .get()

  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  
  try {
    const sheets = await import('../config/googleSheets.js')
    await sheets.bulkAppendMessages(messages)
    return { synced: messages.length }
  } catch (error) {
    console.error('Sheets bulk sync error:', error)
    throw error
  }
}
