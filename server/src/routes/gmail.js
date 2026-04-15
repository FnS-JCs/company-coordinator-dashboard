import { Router } from 'express'
import { fetchWithdrawalEmails, markEmailAsRead, storeWithdrawalNotification } from '../services/gmailService.js'
import { verifyFirebaseToken } from '../middleware/auth.js'

const router = Router()

router.get('/withdrawals', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.query.userId
    const emails = await fetchWithdrawalEmails(userId)
    res.json(emails)
  } catch (error) {
    console.error('Fetch withdrawals error:', error)
    res.status(500).json({ error: 'Failed to fetch withdrawal emails' })
  }
})

router.patch('/withdrawals/:messageId/read', verifyFirebaseToken, async (req, res) => {
  try {
    await markEmailAsRead(req.params.messageId)
    res.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Failed to mark email as read' })
  }
})

router.get('/new', async (req, res) => {
  try {
    const { userId } = req.query
    const emails = await fetchWithdrawalEmails(userId)
    const unreadEmails = emails.filter(e => !e.isRead)
    res.json(unreadEmails)
  } catch (error) {
    console.error('Fetch new emails error:', error)
    res.status(500).json({ error: 'Failed to fetch new emails' })
  }
})

export default router
