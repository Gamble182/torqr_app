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

// -- Prop types --

export interface BookingItem {
  customerName: string;
  systemInfo: string;
  dateTime: string;
}

export interface DueUnbookedItem {
  customerName: string;
  systemInfo: string;
  dueDate: string;
}

export interface OverdueItem {
  customerName: string;
  systemInfo: string;
  daysOverdue: number;
}

export interface WeeklySummaryEmailProps {
  userName: string;
  weekLabel: string;
  bookingsThisWeek: BookingItem[];
  bookingsThisWeekMore?: number;
  dueUnbooked: DueUnbookedItem[];
  dueUnbookedMore?: number;
  overdue: OverdueItem[];
  overdueMore?: number;
  retro: {
    maintenancesCompleted: number;
    bookingsAttended: number;
    remindersSent: number;
  };
  totals: {
    customers: number;
    systems: number;
  };
}

// -- Shared styles --

const sectionLabel = {
  fontSize: '11px' as const,
  fontWeight: 600 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 10px',
};

const listItemName = {
  margin: '0',
  fontWeight: 500 as const,
  color: '#1A1A1A',
  fontSize: '14px',
};

const listItemDetail = {
  margin: '2px 0 0',
  fontSize: '12px',
};

// -- Component --

export function WeeklySummaryEmail({
  userName,
  weekLabel,
  bookingsThisWeek,
  bookingsThisWeekMore,
  dueUnbooked,
  dueUnbookedMore,
  overdue,
  overdueMore,
  retro,
  totals,
}: WeeklySummaryEmailProps) {
  const hasRetroActivity =
    retro.maintenancesCompleted > 0 ||
    retro.bookingsAttended > 0 ||
    retro.remindersSent > 0;

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
            <Text
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#FFFFFF',
                margin: '0',
                letterSpacing: '-0.5px',
              }}
            >
              torqr
            </Text>
            <Text
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.65)',
                margin: '2px 0 0',
                textTransform: 'uppercase' as const,
                letterSpacing: '1px',
              }}
            >
              Wartungsmanagement
            </Text>
          </Section>

          <Section style={{ padding: '28px' }}>
            {/* Greeting */}
            <Heading
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1A1A1A',
                margin: '0 0 4px',
                letterSpacing: '-0.3px',
              }}
            >
              Wochenübersicht
            </Heading>
            <Text style={{ color: '#5C5C5C', margin: '0 0 4px', lineHeight: '1.7' }}>
              Guten Tag {userName},
            </Text>
            <Text style={{ color: '#9A9A9A', margin: '0 0 24px', fontSize: '14px' }}>
              {weekLabel}
            </Text>

            {/* Section 1: Bookings this week - GREEN */}
            <Section
              style={{
                backgroundColor: '#E6F2E6',
                borderLeft: '3px solid #008000',
                borderRadius: '6px',
                padding: '14px 16px',
                margin: '0 0 16px',
              }}
            >
              <Text style={{ ...sectionLabel, color: '#006600' }}>
                Termine diese Woche
              </Text>
              {bookingsThisWeek.length === 0 ? (
                <Text style={{ margin: '0', color: '#5C5C5C', fontSize: '14px' }}>
                  Keine Termine diese Woche gebucht.
                </Text>
              ) : (
                <>
                  {bookingsThisWeek.map((item, i) => (
                    <Section key={i} style={{ marginBottom: i < bookingsThisWeek.length - 1 ? '8px' : '0' }}>
                      <Text style={listItemName}>{item.customerName}</Text>
                      <Text style={{ ...listItemDetail, color: '#5C5C5C' }}>
                        {item.systemInfo} · {item.dateTime}
                      </Text>
                    </Section>
                  ))}
                  {bookingsThisWeekMore && bookingsThisWeekMore > 0 && (
                    <Text style={{ margin: '8px 0 0', color: '#9A9A9A', fontSize: '12px' }}>
                      … und {bookingsThisWeekMore} weitere
                    </Text>
                  )}
                </>
              )}
            </Section>

            {/* Section 2: Due but unbooked - AMBER */}
            <Section
              style={{
                backgroundColor: '#FEF3C7',
                borderLeft: '3px solid #D97706',
                borderRadius: '6px',
                padding: '14px 16px',
                margin: '0 0 16px',
              }}
            >
              <Text style={{ ...sectionLabel, color: '#92400E' }}>
                Wartungen fällig — noch nicht gebucht
              </Text>
              {dueUnbooked.length === 0 ? (
                <Text style={{ margin: '0', color: '#5C5C5C', fontSize: '14px' }}>
                  Alle fälligen Wartungen sind terminiert.
                </Text>
              ) : (
                <>
                  {dueUnbooked.map((item, i) => (
                    <Section key={i} style={{ marginBottom: i < dueUnbooked.length - 1 ? '8px' : '0' }}>
                      <Text style={listItemName}>{item.customerName}</Text>
                      <Text style={{ ...listItemDetail, color: '#92400E' }}>
                        {item.systemInfo} · Fällig: {item.dueDate}
                      </Text>
                    </Section>
                  ))}
                  {dueUnbookedMore && dueUnbookedMore > 0 && (
                    <Text style={{ margin: '8px 0 0', color: '#9A9A9A', fontSize: '12px' }}>
                      … und {dueUnbookedMore} weitere
                    </Text>
                  )}
                </>
              )}
            </Section>

            {/* Section 3: Overdue - RED (hidden if empty) */}
            {overdue.length > 0 && (
              <Section
                style={{
                  backgroundColor: '#FEE2E2',
                  borderLeft: '3px solid #DC2626',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  margin: '0 0 16px',
                }}
              >
                <Text style={{ ...sectionLabel, color: '#991B1B' }}>
                  Überfällige Wartungen
                </Text>
                {overdue.map((item, i) => (
                  <Section key={i} style={{ marginBottom: i < overdue.length - 1 ? '8px' : '0' }}>
                    <Text style={listItemName}>{item.customerName}</Text>
                    <Text style={{ ...listItemDetail, color: '#991B1B' }}>
                      {item.systemInfo} · {item.daysOverdue} Tage überfällig
                    </Text>
                  </Section>
                ))}
                {overdueMore && overdueMore > 0 && (
                  <Text style={{ margin: '8px 0 0', color: '#9A9A9A', fontSize: '12px' }}>
                    … und {overdueMore} weitere
                  </Text>
                )}
              </Section>
            )}

            {/* Section 4: Retro - GRAY */}
            <Section
              style={{
                backgroundColor: '#F3F4F6',
                borderLeft: '3px solid #9CA3AF',
                borderRadius: '6px',
                padding: '14px 16px',
                margin: '0 0 16px',
              }}
            >
              <Text style={{ ...sectionLabel, color: '#4B5563' }}>
                Rückblick letzte Woche
              </Text>
              <Text style={{ margin: '0', color: '#5C5C5C', fontSize: '14px' }}>
                {hasRetroActivity
                  ? `${retro.maintenancesCompleted} Wartungen durchgeführt · ${retro.bookingsAttended} Termine wahrgenommen · ${retro.remindersSent} Erinnerungen versendet`
                  : 'Keine Aktivitäten letzte Woche.'}
              </Text>
            </Section>

            {/* Totals line */}
            <Hr style={{ margin: '8px 0 12px', borderColor: '#E0E0E0' }} />
            <Text
              style={{
                color: '#9A9A9A',
                fontSize: '12px',
                margin: '0',
                textAlign: 'center' as const,
              }}
            >
              Gesamt: {totals.customers} Kunden · {totals.systems} Anlagen
            </Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              backgroundColor: '#F7F7F7',
              borderTop: '1px solid #E0E0E0',
              padding: '14px 28px',
            }}
          >
            <Text
              style={{
                color: '#9A9A9A',
                fontSize: '11px',
                textAlign: 'center' as const,
                margin: '0',
              }}
            >
              torqr · Automatisch generiert
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
