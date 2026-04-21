'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function UnsubscribePage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleUnsubscribe() {
    setState('loading');
    try {
      const res = await fetch(`/api/email/unsubscribe/${params.token}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        setState('done');
        setMessage(
          data.alreadyUnsubscribed
            ? 'Sie sind bereits abgemeldet.'
            : 'Sie wurden erfolgreich abgemeldet. Sie erhalten keine Wartungserinnerungen mehr.'
        );
      } else {
        setState('error');
        setMessage(data.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch {
      setState('error');
      setMessage('Verbindungsfehler. Bitte versuchen Sie es erneut.');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F7F7',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid #E0E0E0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {state === 'done' ? (
          <>
            <h1
              style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: '#1A1A1A' }}
            >
              Abgemeldet
            </h1>
            <p style={{ color: '#5C5C5C', fontSize: '14px', margin: '0' }}>{message}</p>
          </>
        ) : state === 'error' ? (
          <>
            <h1
              style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: '#1A1A1A' }}
            >
              Fehler
            </h1>
            <p style={{ color: '#5C5C5C', fontSize: '14px', margin: '0' }}>{message}</p>
          </>
        ) : (
          <>
            <h1
              style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: '#1A1A1A' }}
            >
              E-Mail-Erinnerungen abbestellen
            </h1>
            <p style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 24px' }}>
              Möchten Sie keine Wartungserinnerungen mehr erhalten? Klicken Sie auf Abmelden.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={state === 'loading'}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#008000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: state === 'loading' ? 'not-allowed' : 'pointer',
                opacity: state === 'loading' ? 0.7 : 1,
              }}
            >
              {state === 'loading' ? 'Wird verarbeitet...' : 'Abmelden'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
