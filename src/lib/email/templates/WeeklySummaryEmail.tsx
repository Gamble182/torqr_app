import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Row,
  Column,
} from '@react-email/components';

export interface UpcomingItem {
  customerName: string;
  date: string;
  heaterInfo: string;
}

export interface OverdueItem {
  customerName: string;
  daysOverdue: number;
  heaterInfo: string;
}

export interface WeeklySummaryEmailProps {
  weekLabel: string;
  upcomingCount: number;
  overdueCount: number;
  completedCount: number;
  upcomingList: UpcomingItem[];
  overdueList: OverdueItem[];
}

export function WeeklySummaryEmail({
  weekLabel,
  upcomingCount,
  overdueCount,
  completedCount,
  upcomingList,
  overdueList,
}: WeeklySummaryEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Body
        style={{
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          backgroundColor: '#F7F7F7',
          padding: '20px',
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
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
            <Heading style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px' }}>
              Wochenübersicht
            </Heading>
            <Text style={{ color: '#9A9A9A', margin: '0 0 24px', fontSize: '14px' }}>
              {weekLabel}
            </Text>

            {/* Stat blocks */}
            <Section style={{ margin: '0 0 8px' }}>
              <Row>
                <Column
                  style={{
                    textAlign: 'center' as const,
                    padding: '12px',
                    backgroundColor: '#E6F1FB',
                    borderRadius: '6px',
                  }}
                >
                  <Text
                    style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#0C447C' }}
                  >
                    {upcomingCount}
                  </Text>
                  <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#0C447C' }}>
                    Anstehend
                  </Text>
                </Column>
                <Column style={{ width: '12px' }} />
                <Column
                  style={{
                    textAlign: 'center' as const,
                    padding: '12px',
                    backgroundColor: '#FAEEDA',
                    borderRadius: '6px',
                  }}
                >
                  <Text
                    style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#633806' }}
                  >
                    {overdueCount}
                  </Text>
                  <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#633806' }}>
                    Überfällig
                  </Text>
                </Column>
                <Column style={{ width: '12px' }} />
                <Column
                  style={{
                    textAlign: 'center' as const,
                    padding: '12px',
                    backgroundColor: '#E6F2E6',
                    borderRadius: '6px',
                  }}
                >
                  <Text
                    style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#006600' }}
                  >
                    {completedCount}
                  </Text>
                  <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#006600' }}>
                    Abgeschlossen
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Upcoming list */}
            {upcomingList.length > 0 && (
              <>
                <Hr style={{ margin: '24px 0 16px', borderColor: '#E0E0E0' }} />
                <Text
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#5C5C5C',
                    textTransform: 'uppercase' as const,
                    margin: '0 0 12px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Anstehende Termine diese Woche
                </Text>
                {upcomingList.map((item, i) => (
                  <Section key={i} style={{ marginBottom: '8px' }}>
                    <Text
                      style={{ margin: '0', fontWeight: 500, color: '#1A1A1A', fontSize: '14px' }}
                    >
                      {item.customerName}
                    </Text>
                    <Text style={{ margin: '2px 0 0', color: '#9A9A9A', fontSize: '12px' }}>
                      {item.heaterInfo} · {item.date}
                    </Text>
                  </Section>
                ))}
              </>
            )}

            {/* Overdue list */}
            {overdueList.length > 0 && (
              <>
                <Hr style={{ margin: '24px 0 16px', borderColor: '#E0E0E0' }} />
                <Text
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#712B13',
                    textTransform: 'uppercase' as const,
                    margin: '0 0 12px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Überfällige Wartungen
                </Text>
                {overdueList.map((item, i) => (
                  <Section key={i} style={{ marginBottom: '8px' }}>
                    <Text
                      style={{ margin: '0', fontWeight: 500, color: '#1A1A1A', fontSize: '14px' }}
                    >
                      {item.customerName}
                    </Text>
                    <Text style={{ margin: '2px 0 0', color: '#712B13', fontSize: '12px' }}>
                      {item.heaterInfo} · {item.daysOverdue} Tage überfällig
                    </Text>
                  </Section>
                ))}
              </>
            )}
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: '#F7F7F7', borderTop: '1px solid #E0E0E0', padding: '14px 28px' }}>
            <Text
              style={{ color: '#9A9A9A', fontSize: '11px', textAlign: 'center' as const, margin: '0' }}
            >
              torqr · Automatisch generiert
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
