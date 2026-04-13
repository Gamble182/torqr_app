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
        backgroundColor: '#f9fafb',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {state === 'done' ? (
          <>
            <p style={{ fontSize: '24px', margin: '0 0 12px' }}>✅</p>
            <h1
              style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}
            >
              Abgemeldet
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>{message}</p>
          </>
        ) : state === 'error' ? (
          <>
            <p style={{ fontSize: '24px', margin: '0 0 12px' }}>⚠️</p>
            <h1
              style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}
            >
              Fehler
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0' }}>{message}</p>
          </>
        ) : (
          <>
            <h1
              style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', color: '#111827' }}
            >
              E-Mail-Erinnerungen abbestellen
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
              Möchten Sie keine Wartungserinnerungen mehr erhalten? Klicken Sie auf Abmelden.
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={state === 'loading'}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
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
