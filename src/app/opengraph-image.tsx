import { ImageResponse } from 'next/og';

export const alt = 'Torqr · Die Wartungsakte für Heizungsbauer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BRAND = {
  green: '#008000',
  greenDark: '#004D00',
  green50: '#E6F2E6',
  amber: '#EF9F27',
  text: '#1A1A1A',
  muted: '#5C5C5C',
  border: '#E0E0E0',
};

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#FFFFFF',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Left column — typography */}
        <div
          style={{
            width: 720,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 0 64px 80px',
          }}
        >
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width="56" height="56" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
              <rect width="96" height="96" rx="22" fill={BRAND.green} />
              <polyline
                points="12,48 26,48 32,22 40,74 48,36 54,58 60,48 84,48"
                stroke="white"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="54" cy="58" r="6" fill={BRAND.amber} />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 600,
                  color: BRAND.text,
                  letterSpacing: -1.5,
                  lineHeight: 1,
                }}
              >
                torqr
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: BRAND.green,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                Wartungsmanagement
              </span>
            </div>
          </div>

          {/* Headline + Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 68,
                fontWeight: 700,
                color: BRAND.text,
                lineHeight: 1.05,
                letterSpacing: -2,
              }}
            >
              <span>Aus Excel raus.</span>
              <span>In die Hosentasche rein.</span>
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 500,
                color: BRAND.green,
                lineHeight: 1.2,
              }}
            >
              Die Wartungsakte für Heizungsbauer.
            </div>
          </div>

          {/* URL footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 22,
              fontWeight: 500,
              color: BRAND.muted,
            }}
          >
            <span style={{ display: 'flex', width: 8, height: 8, borderRadius: 9999, background: BRAND.green }} />
            torqr.de
          </div>
        </div>

        {/* Right column — brand surface with large icon */}
        <div
          style={{
            width: 480,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: BRAND.green50,
            borderLeft: `1px solid ${BRAND.border}`,
          }}
        >
          <svg width="320" height="320" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
            <rect width="96" height="96" rx="22" fill={BRAND.green} />
            <polyline
              points="12,48 26,48 32,22 40,74 48,36 54,58 60,48 84,48"
              stroke="white"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="54" cy="58" r="6" fill={BRAND.amber} />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
