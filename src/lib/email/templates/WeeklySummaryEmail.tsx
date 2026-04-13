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
          fontFamily: 'sans-serif',
          backgroundColor: '#f9fafb',
          padding: '20px',
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
          }}
        >
          <Heading style={{ fontSize: '20px', color: '#111827', margin: '0 0 4px' }}>
            Wochenübersicht
          </Heading>
          <Text style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '14px' }}>
            {weekLabel}
          </Text>

          {/* Stat blocks */}
          <Section style={{ margin: '0 0 8px' }}>
            <Row>
              <Column
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '6px',
                }}
              >
                <Text
                  style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#1d4ed8' }}
                >
                  {upcomingCount}
                </Text>
                <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#3b82f6' }}>
                  📅 Anstehend
                </Text>
              </Column>
              <Column style={{ width: '12px' }} />
              <Column
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '6px',
                }}
              >
                <Text
                  style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#b45309' }}
                >
                  {overdueCount}
                </Text>
                <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#d97706' }}>
                  ⚠️ Überfällig
                </Text>
              </Column>
              <Column style={{ width: '12px' }} />
              <Column
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                }}
              >
                <Text
                  style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#15803d' }}
                >
                  {completedCount}
                </Text>
                <Text style={{ margin: '4px 0 0', fontSize: '12px', color: '#16a34a' }}>
                  ✅ Abgeschlossen
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Upcoming list */}
          {upcomingList.length > 0 && (
            <>
              <Hr style={{ margin: '24px 0 16px', borderColor: '#e5e7eb' }} />
              <Text
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  margin: '0 0 12px',
                  letterSpacing: '0.05em',
                }}
              >
                Anstehende Termine diese Woche
              </Text>
              {upcomingList.map((item, i) => (
                <Section key={i} style={{ marginBottom: '8px' }}>
                  <Text
                    style={{ margin: '0', fontWeight: '500', color: '#111827', fontSize: '14px' }}
                  >
                    {item.customerName}
                  </Text>
                  <Text style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '12px' }}>
                    {item.heaterInfo} · {item.date}
                  </Text>
                </Section>
              ))}
            </>
          )}

          {/* Overdue list */}
          {overdueList.length > 0 && (
            <>
              <Hr style={{ margin: '24px 0 16px', borderColor: '#e5e7eb' }} />
              <Text
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#b45309',
                  textTransform: 'uppercase',
                  margin: '0 0 12px',
                  letterSpacing: '0.05em',
                }}
              >
                ⚠️ Überfällige Wartungen
              </Text>
              {overdueList.map((item, i) => (
                <Section key={i} style={{ marginBottom: '8px' }}>
                  <Text
                    style={{ margin: '0', fontWeight: '500', color: '#111827', fontSize: '14px' }}
                  >
                    {item.customerName}
                  </Text>
                  <Text style={{ margin: '2px 0 0', color: '#d97706', fontSize: '12px' }}>
                    {item.heaterInfo} · {item.daysOverdue} Tage überfällig
                  </Text>
                </Section>
              ))}
            </>
          )}

          <Hr style={{ margin: '32px 0 16px', borderColor: '#e5e7eb' }} />
          <Text
            style={{ color: '#9ca3af', fontSize: '11px', textAlign: 'center', margin: '0' }}
          >
            Torqr · Automatisch generiert
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
