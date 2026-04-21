import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';

export interface ReminderEmailProps {
  customerName: string;
  maintenanceDate: string;
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  weeksUntil: 4 | 1;
  calComUrl: string;
  maxPhone: string;
  maxEmail: string;
  maxName: string;
  maxCompanyName: string | null;
  unsubscribeUrl: string;
}

export function ReminderEmail({
  customerName,
  maintenanceDate,
  heaterManufacturer,
  heaterModel,
  heaterSerialNumber,
  weeksUntil,
  calComUrl,
  maxPhone,
  maxEmail,
  maxName,
  maxCompanyName,
  unsubscribeUrl,
}: ReminderEmailProps) {
  const heaterInfo = [heaterManufacturer, heaterModel].filter(Boolean).join(' ');
  const weekWord = weeksUntil === 1 ? 'Woche' : 'Wochen';

  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", backgroundColor: '#F7F7F7', padding: '20px' }}>
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E0E0E0',
          }}
        >
          {/* Brand Header */}
          <Section style={{ backgroundColor: '#008000', padding: '20px 28px' }}>
            <Text style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: '0', letterSpacing: '-0.5px' }}>
              torqr
            </Text>
            <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
              Wartungsmanagement
            </Text>
          </Section>

          <Section style={{ padding: '28px' }}>
            <Heading style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
              Wartungserinnerung
            </Heading>

            <Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>
              Guten Tag {customerName},
            </Text>
            <Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>
              die letzte Wartung Ihrer Heizungsanlage liegt in{' '}
              <strong style={{ color: '#1A1A1A' }}>{weeksUntil} {weekWord}</strong> genau ein Jahr zurück.
            </Text>
            <Text style={{ color: '#5C5C5C', margin: '0 0 24px', lineHeight: '1.7' }}>
              Wir empfehlen, jetzt rechtzeitig einen neuen Wartungstermin zu buchen — regelmäßige
              Wartungen sichern den effizienten Betrieb Ihrer Anlage und beugen teuren Reparaturen vor.
            </Text>

            {/* Heater card */}
            <Section
              style={{
                backgroundColor: '#E6F2E6',
                borderLeft: '3px solid #008000',
                borderRadius: '6px',
                padding: '12px 16px',
                margin: '0 0 24px',
              }}
            >
              <Text
                style={{
                  margin: '0 0 4px',
                  color: '#5C5C5C',
                  fontSize: '12px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                }}
              >
                Ihre Anlage
              </Text>
              <Text style={{ margin: '0 0 4px', fontWeight: 600, color: '#1A1A1A' }}>
                {heaterInfo}
              </Text>
              {heaterSerialNumber && (
                <Text style={{ margin: '0 0 8px', color: '#9A9A9A', fontSize: '12px' }}>
                  Serien-Nr.: {heaterSerialNumber}
                </Text>
              )}
              <Text style={{ margin: '0', color: '#006600' }}>
                Wartung fällig ab: <strong>{maintenanceDate}</strong>
              </Text>
            </Section>

            {calComUrl && (
              <Button
                href={calComUrl}
                style={{
                  backgroundColor: '#008000',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Termin jetzt buchen
              </Button>
            )}

            <Hr style={{ margin: '32px 0 16px', borderColor: '#E0E0E0' }} />

            {/* Contact section */}
            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 8px' }}>
              Bei Fragen erreichen Sie mich direkt:
            </Text>
            {maxPhone && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 4px' }}>
                Tel.{' '}
                <Link href={`tel:${maxPhone}`} style={{ color: '#008000' }}>
                  {maxPhone}
                </Link>
              </Text>
            )}
            {maxEmail && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 16px' }}>
                E-Mail{' '}
                <Link href={`mailto:${maxEmail}`} style={{ color: '#008000' }}>
                  {maxEmail}
                </Link>
              </Text>
            )}

            {/* Sign-off */}
            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0' }}>
              Mit freundlichen Grüßen,
            </Text>
            <Text style={{ color: '#1A1A1A', fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>
              {maxName}
            </Text>
            {maxCompanyName && (
              <Text style={{ color: '#9A9A9A', fontSize: '13px', margin: '2px 0 0' }}>
                {maxCompanyName}
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: '#F7F7F7', borderTop: '1px solid #E0E0E0', padding: '14px 28px' }}>
            <Text style={{ color: '#9A9A9A', fontSize: '11px', margin: '0' }}>
              Sie erhalten diese E-Mail, weil Ihre Kontaktdaten bei uns für Wartungserinnerungen
              hinterlegt sind. Wenn Sie keine weiteren Erinnerungen erhalten möchten, können Sie
              sich{' '}
              <Link href={unsubscribeUrl} style={{ color: '#9A9A9A' }}>
                hier abmelden
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
