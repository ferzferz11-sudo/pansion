import React, { useState, useCallback } from 'react';
import { useLang } from '../../LangContext';
import api from '../../api';

export default function SosPage() {
  const { RL } = useLang();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSos = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      await api.post('/sos', { message: 'Emergency SOS triggered by user' });
      setSent(true);
    } catch (err) {
      setError(RL('error'));
      console.error('Failed to send SOS:', err);
    } finally {
      setSending(false);
    }
  }, [RL]);

  if (sent) {
    return (
      <div className="page sos-page flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-3">
            {RL('success')}
          </h1>
          <p className="text-lg text-gray-600">
            SOS signal sent. Help is on the way.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page sos-page flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold text-red-600 mb-2">{RL('urgent')}</h1>
      <p className="text-gray-500 mb-10 text-center max-w-sm">
        Press the button below to send an emergency SOS signal to all staff members.
      </p>

      <div className="relative flex items-center justify-center mb-10">
        {/* Pulse rings */}
        <span className="absolute w-48 h-48 rounded-full bg-red-400 opacity-20 animate-ping" />
        <span className="absolute w-40 h-40 rounded-full bg-red-400 opacity-30 animate-pulse" />

        {/* SOS Button */}
        <button
          onClick={handleSos}
          disabled={sending}
          className="relative z-10 w-36 h-36 rounded-full bg-red-600 hover:bg-red-700
                     active:bg-red-800 text-white text-2xl font-extrabold shadow-2xl
                     transition-colors duration-150 focus:outline-none focus:ring-4
                     focus:ring-red-300 disabled:opacity-70 animate-pulse"
        >
          {sending ? RL('loading') : 'SOS'}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-4">{error}</p>
      )}
    </div>
  );
}
