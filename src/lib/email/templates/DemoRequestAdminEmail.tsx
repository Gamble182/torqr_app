import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components';

export interface DemoRequestAdminEmailProps {
  email: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  preferredSlot?: string | null;
  message?: string | null;
  source?: string | null;
  receivedAt: string;
}

export function DemoRequestAdminEmail({
  email, name, company, phone, preferredSlot, message, source, receivedAt,
}: DemoRequestAdminEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ backgroundColor: '#f4f7f4', fontFamily: '-apple-system, system-ui, sans-serif', padding: 0 }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 600, margin: '24px auto', borderRadius: 8, padding: 24 }}>
          <Heading style={{ fontSize: 20, color: '#008000', marginBottom: 4 }}>Neue Demo-Anfrage 📅</Heading>
          <Text style={{ color: '#666', fontSize: 13, marginTop: 0 }}>{receivedAt}</Text>
          <Hr />
          <Section>
            <Text><strong>Name:</strong> {name}</Text>
            <Text><strong>E-Mail:</strong> {email}</Text>
            {company ? <Text><strong>Firma:</strong> {company}</Text> : null}
            {phone ? <Text><strong>Telefon:</strong> {phone}</Text> : null}
            {preferredSlot ? <Text><strong>Wunschtermin:</strong> {preferredSlot}</Text> : null}
            {source ? <Text><strong>Quelle:</strong> {source}</Text> : null}
          </Section>
          {message ? (
            <>
              <Hr />
              <Section>
                <Text style={{ fontWeight: 600 }}>Nachricht:</Text>
                <Text style={{ whiteSpace: 'pre-line' }}>{message}</Text>
              </Section>
            </>
          ) : null}
          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>
            Antwort innerhalb von 1 Werktag versprochen.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default DemoRequestAdminEmail;
