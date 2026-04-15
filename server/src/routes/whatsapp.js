import { Router } from 'express'
import { sendWhatsAppMessage, getMessagesByUser, updateAcknowledgementStatus, syncAllMessagesWithSheets } from '../services/whatsappService.js'
import { verifyFirebaseToken } from '../middleware/auth.js'

const router = Router()

router.post('/send', verifyFirebaseToken, async (req, res) => {
  try {
    const message = await sendWhatsAppMessage(req.body)
    res.json(message)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

router.get('/messages', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.query.userId
    const messages = await getMessagesByUser(userId)
    res.json(messages)
  } catch (error) {
    console.error('Fetch messages error:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

router.patch('/messages/:messageId/ack', verifyFirebaseToken, async (req, res) => {
  try {
    const { status } = req.body
    await updateAcknowledgementStatus(req.params.messageId, status)
    res.json({ success: true })
  } catch (error) {
    console.error('Update acknowledgement error:', error)
    res.status(500).json({ error: 'Failed to update acknowledgement' })
  }
})

router.post('/sync-sheets', async (req, res) => {
  try {
    const result = await syncAllMessagesWithSheets()
    res.json(result)
  } catch (error) {
    console.error('Sync sheets error:', error)
    res.status(500).json({ error: 'Failed to sync with sheets' })
  }
})

export default router
