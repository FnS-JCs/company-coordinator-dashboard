import axios from 'axios'
import type { WhatsAppMessage } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

interface SendMessagePayload {
  companyId: string
  recipientName: string
  recipientPhone: string
  messageContent: string
  userId: string
}

export const whatsappService = {
  async sendMessage(payload: SendMessagePayload): Promise<WhatsAppMessage> {
    const response = await axios.post(`${API_BASE_URL}/whatsapp/send`, payload)
    return response.data
  },

  async getMessages(userId: string): Promise<WhatsAppMessage[]> {
    const response = await axios.get(`${API_BASE_URL}/whatsapp/messages`, {
      params: { userId },
    })
    return response.data
  },

  async updateAcknowledgement(messageId: string, status: string): Promise<void> {
    await axios.patch(`${API_BASE_URL}/whatsapp/messages/${messageId}/ack`, { status })
  },

  async syncWithSheets(): Promise<void> {
    await axios.post(`${API_BASE_URL}/whatsapp/sync-sheets`)
  },
}
