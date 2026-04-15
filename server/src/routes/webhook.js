import { Router } from 'express'
import { PubSub } from '@google-cloud/pubsub'

const router = Router()
const pubsub = new PubSub()

router.post('/gmail', async (req, res) => {
  try {
    const { message, subscription } = req.body
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString())
    
    console.log('Received Gmail webhook:', data)
    
    if (data.withdrawal) {
      console.log('Withdrawal received:', data)
    }
    
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Gmail webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

router.post('/whatsapp', async (req, res) => {
  try {
    const { entry } = req.body
    
    for (const changes of entry) {
      for (const change of changes.changes) {
        if (change.value?.messages) {
          for (const msg of change.value.messages) {
            console.log('WhatsApp acknowledgement:', msg.id)
          }
        }
        if (change.value?.statuses) {
          for (const status of change.value.statuses) {
            console.log('WhatsApp acknowledgement:', status.id)
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

export default router
