import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components';

export interface BookingRescheduleEmailProps {
  customerName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  heaterManufacturer: string | null;
  heaterModel: string;
  heaterSerialNumber: string | null;
  reason: string | null;
  maxPhone: string;
  maxEmail: string;
  maxName: string;
  maxCompanyName: string | null;
}

export function BookingRescheduleEmail({
  customerName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  heaterManufacturer,
  heaterModel,
  heaterSerialNumber,
  reason,
  maxPhone,
  maxEmail,
  maxName,
  maxCompanyName,
}: BookingRescheduleEmailProps) {
  const heaterInfo = [heaterManufacturer, heaterModel].filter(Boolean).join(' ');

  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", backgroundColor: '#F7F7F7', padding: '20px' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E0E0E0' }}>
          <Section style={{ backgroundColor: '#008000', padding: '20px 28px' }}>
            <Text style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: '0', letterSpacing: '-0.5px' }}>torqr</Text>
            <Text style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '2px 0 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
              Wartungsmanagement
            </Text>
          </Section>

          <Section style={{ padding: '28px' }}>
            <Heading style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 24px', letterSpacing: '-0.3px' }}>
              Ihr Wartungstermin wurde verschoben
            </Heading>

            <Text style={{ color: '#5C5C5C', margin: '0 0 8px', lineHeight: '1.7' }}>Guten Tag {customerName},</Text>
            <Text style={{ color: '#5C5C5C', margin: '0 0 24px', lineHeight: '1.7' }}>
              wir müssen Ihren Wartungstermin verschieben. Nachfolgend der neue Termin.
            </Text>

            <Section style={{ backgroundColor: '#FFF4E5', borderLeft: '3px solid #E8A33D', borderRadius: '6px', padding: '12px 16px', margin: '0 0 12px' }}>
              <Text style={{ margin: '0 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Alter Termin
              </Text>
              <Text style={{ margin: '0', color: '#1A1A1A', textDecoration: 'line-through' }}>
                {oldDate} · {oldTime}
              </Text>
            </Section>

            <Section style={{ backgroundColor: '#E6F2E6', borderLeft: '3px solid #008000', borderRadius: '6px', padding: '12px 16px', margin: '0 0 24px' }}>
              <Text style={{ margin: '0 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                Neuer Termin
              </Text>
              <Text style={{ margin: '0 0 2px', fontWeight: 600, color: '#1A1A1A', fontSize: '16px' }}>{newDate}</Text>
              <Text style={{ margin: '0 0 12px', color: '#006600' }}>{newTime}</Text>
              <Text style={{ margin: '12px 0 4px', color: '#5C5C5C', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderTop: '1px solid #99CC99', paddingTop: '12px' }}>
                Ihre Anlage
              </Text>
              <Text style={{ margin: '0 0 4px', fontWeight: 600, color: '#1A1A1A' }}>{heaterInfo}</Text>
              {heaterSerialNumber && (
                <Text style={{ margin: '0', color: '#9A9A9A', fontSize: '12px' }}>
                  Serien-Nr.: {heaterSerialNumber}
                </Text>
              )}
            </Section>

            {reason && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 16px' }}>
                Grund: {reason}
              </Text>
            )}

            <Hr style={{ margin: '32px 0 16px', borderColor: '#E0E0E0' }} />

            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 8px' }}>
              Falls der neue Termin nicht passt, melden Sie sich direkt:
            </Text>
            {maxPhone && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 4px' }}>
                Tel. <Link href={`tel:${maxPhone}`} style={{ color: '#008000' }}>{maxPhone}</Link>
              </Text>
            )}
            {maxEmail && (
              <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0 0 16px' }}>
                E-Mail <Link href={`mailto:${maxEmail}`} style={{ color: '#008000' }}>{maxEmail}</Link>
              </Text>
            )}

            <Text style={{ color: '#5C5C5C', fontSize: '14px', margin: '0' }}>Mit freundlichen Grüßen,</Text>
            <Text style={{ color: '#1A1A1A', fontSize: '14px', fontWeight: 600, margin: '4px 0 0' }}>{maxName}</Text>
            {maxCompanyName && (
              <Text style={{ color: '#9A9A9A', fontSize: '13px', margin: '2px 0 0' }}>{maxCompanyName}</Text>
            )}
          </Section>

          <Section style={{ backgroundColor: '#F7F7F7', borderTop: '1px solid #E0E0E0', padding: '14px 28px' }}>
            <Text style={{ color: '#9A9A9A', fontSize: '11px', margin: '0' }}>Automatisch versendet via torqr</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
