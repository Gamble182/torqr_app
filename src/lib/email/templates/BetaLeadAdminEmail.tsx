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

export interface BetaLeadAdminEmailProps {
  email: string;
  name?: string | null;
  company?: string | null;
  tierInterest?: string | null;
  source?: string | null;
  receivedAt: string;
}

export function BetaLeadAdminEmail({ email, name, company, tierInterest, source, receivedAt }: BetaLeadAdminEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ backgroundColor: '#f4f7f4', fontFamily: '-apple-system, system-ui, sans-serif', padding: 0 }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '24px auto', borderRadius: 8, padding: 24 }}>
          <Heading style={{ fontSize: 20, color: '#008000', marginBottom: 4 }}>Neuer Beta-Lead 🎉</Heading>
          <Text style={{ color: '#666', fontSize: 13, marginTop: 0 }}>{receivedAt}</Text>
          <Hr />
          <Section>
            <Text><strong>E-Mail:</strong> {email}</Text>
            {name ? <Text><strong>Name:</strong> {name}</Text> : null}
            {company ? <Text><strong>Firma:</strong> {company}</Text> : null}
            {tierInterest ? <Text><strong>Tier-Interesse:</strong> {tierInterest}</Text> : null}
            {source ? <Text><strong>Quelle:</strong> {source}</Text> : null}
          </Section>
          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>
            Antwortmöglichkeit: direkt auf {email}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BetaLeadAdminEmail;
