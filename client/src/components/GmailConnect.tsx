import React, { useState, useEffect } from 'react';
import { gmailService } from '../services/gmail';

const GmailConnect: React.FC = () => {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { connected } = await gmailService.getStatus();
      setConnected(connected);
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { url } = await gmailService.getAuthUrl();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      alert('Failed to start Gmail authentication. Please try again.');
    }
  };

  if (loading) return null;

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="font-medium text-gray-700">
          Gmail Integration: {connected ? 'Active' : 'Not Connected'}
        </span>
      </div>

      {connected ? (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Gmail Connected
        </div>
      ) : (
        <button
          onClick={handleConnect}
          className="bg-srcc-navy text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-srcc-navy/90 transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Connect Gmail Account
        </button>
      )}
    </div>
  );
};

export default GmailConnect;
