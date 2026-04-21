import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Link,
} from '@react-email/components';

export interface BookingConfirmationEmailProps {
  customerName: string;
  appointmentDate: string; // e.g. "Montag, 12. Mai 2025"
  appointmentTime: string; // e.g. "10:00 Uhr"
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  maxPhone: string;
  maxEmail: string;
  maxName: string;
  maxCompanyName: string | null;
}

export function BookingConfirmationEmail({
  customerName,
  appointmentDate,
  appointmentTime,
  heaterManufacturer,
  heaterModel,
  heaterSerialNumber,
  maxPhone,
  maxEmail,
  maxName,
  maxCompanyName,
}: BookingConfirmationEmailProps) {
  const heaterInfo = [heaterManufacturer, heaterModel].filter(Boolean).join(' ');

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
            Ihr Wartungstermin ist bestätigt
          </Heading>

          <Text style={{ color: '#374151', margin: '0 0 8px' }}>
            Guten Tag {customerName},
          </Text>
          <Text style={{ color: '#374151', margin: '0 0 24px' }}>
            wir haben für Sie einen Wartungstermin eingetragen. Wir freuen uns auf Ihren Besuch.
          </Text>

          {/* Appointment card */}
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
              Ihr Termin
            </Text>
            <Text style={{ margin: '0 0 2px', fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>
              {appointmentDate}
            </Text>
            <Text style={{ margin: '0 0 12px', color: '#374151' }}>
              {appointmentTime}
            </Text>
            <Text
              style={{
                margin: '12px 0 4px',
                color: '#6b7280',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '12px',
              }}
            >
              Ihre Anlage
            </Text>
            <Text style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#111827' }}>
              {heaterInfo}
            </Text>
            {heaterSerialNumber && (
              <Text style={{ margin: '0', color: '#6b7280', fontSize: '12px' }}>
                Serien-Nr.: {heaterSerialNumber}
              </Text>
            )}
          </Section>

          <Hr style={{ margin: '32px 0 16px', borderColor: '#e5e7eb' }} />

          <Text style={{ color: '#374151', fontSize: '14px', margin: '0 0 8px' }}>
            Bei Fragen oder falls Sie den Termin nicht wahrnehmen können, erreichen Sie uns direkt:
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
        </Container>
      </Body>
    </Html>
  );
}
