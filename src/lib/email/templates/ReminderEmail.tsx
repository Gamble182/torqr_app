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
  maintenanceDate: string; // formatted: DD.MM.YYYY
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  weeksUntil: 4 | 1;
  calComUrl: string;
  maxPhone: string;
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
  unsubscribeUrl,
}: ReminderEmailProps) {
  const heaterInfo = [heaterManufacturer, heaterModel].filter(Boolean).join(' ');
  const weekWord = weeksUntil === 1 ? 'Woche' : 'Wochen';

  return (
    <Html lang="de">
      <Head />
      <Body
        style={{
          fontFamily: 'sans-serif',
          backgroundColor: '#f9fafb',
          padding: '20px',
        }}
      >
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
          <Text style={{ color: '#374151', margin: '0 0 24px' }}>
            der Wartungstermin für Ihre Heizungsanlage steht in{' '}
            <strong>
              {weeksUntil} {weekWord}
            </strong>{' '}
            an.
          </Text>

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
              }}
            >
              Anlage
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
              Termindatum: <strong>{maintenanceDate}</strong>
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

          <Text style={{ color: '#374151', fontSize: '14px', margin: '0' }}>
            Bei Fragen erreichen Sie uns unter: <strong>{maxPhone}</strong>
          </Text>

          <Hr style={{ margin: '16px 0', borderColor: '#e5e7eb' }} />

          <Text style={{ color: '#9ca3af', fontSize: '11px', margin: '0' }}>
            Sie erhalten diese E-Mail, weil Ihre Kontaktdaten bei uns für
            Wartungserinnerungen hinterlegt sind.{' '}
            <Link href={unsubscribeUrl} style={{ color: '#9ca3af' }}>
              Abmelden
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
