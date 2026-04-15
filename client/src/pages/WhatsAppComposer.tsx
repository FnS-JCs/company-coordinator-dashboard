import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { whatsappService } from '../services/whatsapp'
import type { WhatsAppMessage } from '../types'

export default function WhatsAppComposer() {
  const { user } = useAuth()
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [message, setMessage] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [messageHistory, setMessageHistory] = useState<WhatsAppMessage[]>([])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSending(true)
      setError('')
      setSuccess('')
      await whatsappService.sendMessage({
        companyId,
        recipientName,
        recipientPhone,
        messageContent: message,
        userId: user.uid
      })
      setSuccess('Message sent successfully!')
      setRecipientName('')
      setRecipientPhone('')
      setMessage('')
      setCompanyId('')
      loadMessages()
    } catch (err) {
      setError('Failed to send message')
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const loadMessages = async () => {
    if (!user) return
    try {
      const messages = await whatsappService.getMessages(user.uid)
      setMessageHistory(messages)
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">WhatsApp Message Composer</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Compose Message</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company ID</label>
                  <input
                    type="text"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
                    placeholder="+91..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border px-3 py-2"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Message History</h2>
              <div className="space-y-4">
                {messageHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages sent yet</p>
                ) : (
                  messageHistory.map((msg) => (
                    <div key={msg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{msg.recipientName}</p>
                          <p className="text-sm text-gray-500">{msg.recipientPhone}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          msg.acknowledgementStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          msg.acknowledgementStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {msg.acknowledgementStatus}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{msg.messageContent}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(msg.sentAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
