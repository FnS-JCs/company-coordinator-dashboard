import { Router } from 'express'
import { PubSub } from '@google-cloud/pubsub'
import { storeWithdrawalNotification } from '../services/gmailService.js'
import { syncAcknowledgementFromWhatsApp } from '../services/whatsappService.js'

const router = Router()
const pubsub = new PubSub()

router.post('/gmail', express.json(), async (req, res) => {
  try {
    const { message, subscription } = req.body
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString())
    
    console.log('Received Gmail webhook:', data)
    
    if (data.withdrawal) {
      await storeWithdrawalNotification(data.userId, data.emailData)
    }
    
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Gmail webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

router.post('/whatsapp', express.json(), async (req, res) => {
  try {
    const { entry } = req.body
    
    for (const changes of entry) {
      for (const change of changes.changes) {
        if (change.value?.messages) {
          for (const msg of change.value.messages) {
            await syncAcknowledgementFromWhatsApp(msg.id, 'delivered')
          }
        }
        if (change.value?.statuses) {
          for (const status of change.value.statuses) {
            await syncAcknowledgementFromWhatsApp(status.id, status.status)
          }
        }
      }
    }
    
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

router.get('/pubsub/push', (req, res) => {
  res.status(200).send()
})

function express.json() {
  return (req, res, next) => {
    express.raw({ type: 'application/json' })(req, res, (err) => {
      if (err) return next(err)
      try {
        req.body = JSON.parse(req.body)
      } catch (e) {
        return next(e)
      }
      next()
    })
  }
}

export default router
