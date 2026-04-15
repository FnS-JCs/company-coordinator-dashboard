import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { gmailService } from '../services/gmail'
import type { GmailWithdrawal } from '../types'

export default function GmailFeed() {
  const { user } = useAuth()
  const [withdrawals, setWithdrawals] = useState<GmailWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWithdrawals()
  }, [user])

  const loadWithdrawals = async () => {
    if (!user) return
    try {
      setLoading(true)
      const data = await gmailService.getWithdrawals(user.uid)
      setWithdrawals(data)
    } catch (err) {
      setError('Failed to load withdrawal emails')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await gmailService.markAsRead(id)
      setWithdrawals(prev =>
        prev.map(w => w.id === id ? { ...w, isRead: true } : w)
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Gmail Withdrawal Feed</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No withdrawal notifications</div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {withdrawals.map((email) => (
                  <li key={email.id} className={email.isRead ? 'bg-white' : 'bg-blue-50'}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">{email.from}</p>
                        <p className="ml-2 text-sm text-gray-500">
                          {new Date(email.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{email.subject}</p>
                      <p className="mt-1 text-sm text-gray-500 truncate">{email.snippet}</p>
                      {!email.isRead && (
                        <button
                          onClick={() => markAsRead(email.id)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
