import { PubSub } from '@google-cloud/pubsub'

const pubsubClient = new PubSub({
  projectId: process.env.PUBSUB_PROJECT_ID,
})

export const TOPICS = {
  GMAIL_WITHDRAWAL: 'gmail-withdrawal-notifications',
  WHATSAPP_ACK: 'whatsapp-acknowledgement-updates',
}

export async function setupGmailWebhook(subscriptionName, callback) {
  const subscription = pubsubClient.subscription(subscriptionName)
  
  subscription.on('message', async (message) => {
    try {
      const data = JSON.parse(Buffer.from(message.data, 'base64').toString())
      await callback(data)
      message.ack()
    } catch (error) {
      console.error('Webhook processing error:', error)
      message.nack()
    }
  })

  return subscription
}

export { pubsubClient }
