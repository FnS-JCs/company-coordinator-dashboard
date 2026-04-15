import React, { useState, useEffect } from 'react';
import GmailConnect from '../components/GmailConnect';
import { gmailService, GmailEmail } from '../services/gmail';
import { useAuth } from '../context/AuthContext';

const GmailFeed: React.FC = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatusAndFetch();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkStatusAndFetch, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkStatusAndFetch = async () => {
    try {
      const { connected } = await gmailService.getStatus();
      setIsConnected(connected);
      
      if (connected) {
        const data = await gmailService.getWithdrawals();
        setEmails(data);
      }
    } catch (err) {
      console.error('Failed to fetch Gmail data:', err);
      setError('Could not fetch withdrawal emails.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkProcessed = (id: string) => {
    // In a real app, this would call an API to update status in DB or Gmail
    setEmails(prev => prev.filter(email => email.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-srcc-navy mb-2 tracking-tight">
            Withdrawal Mail Feed
          </h1>
          <p className="text-gray-500 font-medium">
            Monitor real-time withdrawal notifications from companies.
          </p>
        </header>

        <GmailConnect />

        {!isConnected ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gmail Not Connected</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Connect your Gmail account above to see withdrawal emails from companies labeled with <span className="font-bold text-srcc-navy">"CC-Withdrawal"</span>.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-srcc-navy border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-gray-500 font-medium animate-pulse">Syncing with Gmail...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No New Withdrawals</h3>
            <p className="text-gray-500">Everything looks clear! We'll update this feed as soon as new emails arrive.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {emails.map((email) => (
              <div key={email.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-srcc-gold transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-srcc-navy" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-srcc-navy transition-colors">
                      {email.sender}
                    </h4>
                    <p className="text-srcc-gold text-sm font-bold uppercase tracking-wider">
                      {email.subject}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                    {new Date(email.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {email.snippet}
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleMarkProcessed(email.id)}
                    className="flex items-center gap-2 text-srcc-navy hover:text-srcc-gold font-bold text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mark as Processed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailFeed;
