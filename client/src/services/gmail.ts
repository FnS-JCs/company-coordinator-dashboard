import axios from 'axios'
import type { GmailWithdrawal } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const gmailService = {
  async getWithdrawals(userId: string): Promise<GmailWithdrawal[]> {
    const response = await axios.get(`${API_BASE_URL}/gmail/withdrawals`, {
      params: { userId },
    })
    return response.data
  },

  async markAsRead(messageId: string): Promise<void> {
    await axios.patch(`${API_BASE_URL}/gmail/withdrawals/${messageId}/read`)
  },

  async getNewMessages(): Promise<GmailWithdrawal[]> {
    const response = await axios.get(`${API_BASE_URL}/gmail/new`)
    return response.data
  },
}
