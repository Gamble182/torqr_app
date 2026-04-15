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
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb', padding: '20px' }}>
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
          }}
        >
          <Heading style={{ fontSize: '20px', color: '#111827', margin: '0 0 24px' }}>
            Wartungserinnerung
          </Heading>

          <Text style={{ color: '#374151', margin: '0 0 8px' }}>
            Guten Tag {customerName},
          </Text>
          <Text style={{ color: '#374151', margin: '0 0 8px' }}>
            Ihr nächster Wartungstermin für Ihre Heizungsanlage rückt näher — in{' '}
            <strong>{weeksUntil} {weekWord}</strong> ist es soweit.
          </Text>
          <Text style={{ color: '#374151', margin: '0 0 24px' }}>
            Regelmäßige Wartungen sorgen für einen sicheren und effizienten Betrieb Ihrer
            Anlage — und können teure Reparaturen im Winter verhindern.
          </Text>

          {/* Heater card */}
          <Section
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              padding: '16px',
              margin: '0 0 24px',
            }}
          >
            <Text
              style={{
                margin: '0 0 4px',
                color: '#6b7280',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Ihre Anlage
            </Text>
            <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#111827' }}>
              {heaterInfo}
            </Text>
            {heaterSerialNumber && (
              <Text style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '12px' }}>
                Serien-Nr.: {heaterSerialNumber}
              </Text>
            )}
            <Text style={{ margin: '0', color: '#374151' }}>
              Wartungstermin: <strong>{maintenanceDate}</strong>
            </Text>
          </Section>

          {calComUrl && (
            <Button
              href={calComUrl}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Termin jetzt buchen
            </Button>
          )}

          <Hr style={{ margin: '32px 0 16px', borderColor: '#e5e7eb' }} />

          {/* Contact section */}
          <Text style={{ color: '#374151', fontSize: '14px', margin: '0 0 8px' }}>
            Bei Fragen erreichen Sie mich direkt:
          </Text>
          {maxPhone && (
            <Text style={{ color: '#374151', fontSize: '14px', margin: '0 0 4px' }}>
              📞{' '}
              <Link href={`tel:${maxPhone}`} style={{ color: '#2563eb' }}>
                {maxPhone}
              </Link>
            </Text>
          )}
          {maxEmail && (
            <Text style={{ color: '#374151', fontSize: '14px', margin: '0 0 16px' }}>
              ✉️{' '}
              <Link href={`mailto:${maxEmail}`} style={{ color: '#2563eb' }}>
                {maxEmail}
              </Link>
            </Text>
          )}

          {/* Sign-off */}
          <Text style={{ color: '#374151', fontSize: '14px', margin: '0' }}>
            Mit freundlichen Grüßen,
          </Text>
          <Text style={{ color: '#111827', fontSize: '14px', fontWeight: '600', margin: '4px 0 0' }}>
            {maxName}
          </Text>
          {maxCompanyName && (
            <Text style={{ color: '#6b7280', fontSize: '13px', margin: '2px 0 0' }}>
              {maxCompanyName}
            </Text>
          )}

          <Hr style={{ margin: '24px 0 16px', borderColor: '#e5e7eb' }} />

          <Text style={{ color: '#9ca3af', fontSize: '11px', margin: '0' }}>
            Sie erhalten diese E-Mail, weil Ihre Kontaktdaten bei uns für Wartungserinnerungen
            hinterlegt sind. Wenn Sie keine weiteren Erinnerungen erhalten möchten, können Sie
            sich{' '}
            <Link href={unsubscribeUrl} style={{ color: '#9ca3af' }}>
              hier abmelden
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
