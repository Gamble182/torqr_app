'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { usePackingList } from '@/hooks/usePackingList';
import type { EffectivePart } from '@/hooks/useEffectiveParts';

interface Props {
  bookingId: string;
}

function stockStatus(p: EffectivePart): string {
  if (!p.inventoryItem) return '(nicht im Lager erfasst)';
  const curr = Number(p.inventoryItem.currentStock);
  const needed = Number(p.quantity);
  return curr >= needed ? `Lager: ${curr} ✓` : `Lager: ${curr} ⚠ FEHLBESTAND`;
}

export function PackingListPrintView({ bookingId }: Props) {
  const { data, isLoading, error } = usePackingList(bookingId);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Lädt…</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-sm text-destructive">
        {error?.message || 'Packliste konnte nicht geladen werden.'}
      </div>
    );
  }

  const parts = data.effectiveParts ?? [];
  const tools = parts.filter((p) => p.category === 'TOOL');
  const consumables = parts.filter((p) => p.category !== 'TOOL');

  const systemLabel = data.system
    ? [data.system.catalog.manufacturer, data.system.catalog.name]
        .filter(Boolean)
        .join(' ')
    : '—';

  const serial = data.system?.serialNumber ?? null;

  return (
    <div className="packing-list-print mx-auto max-w-3xl bg-white p-8 text-black">
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body { background: white !important; }
          .packing-list-print { max-width: none; padding: 0; }
          .no-print { display: none !important; }
        }
        .packing-list-print h1 { font-size: 1.5rem; font-weight: 700; }
        .packing-list-print h2 { font-size: 1.05rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; border-bottom: 1px solid #999; padding-bottom: 0.25rem; }
        .packing-list-print .meta-row { display: flex; gap: 0.5rem; font-size: 0.875rem; margin-top: 0.25rem; }
        .packing-list-print .meta-label { font-weight: 600; min-width: 6.5rem; }
        .packing-list-print table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .packing-list-print th, .packing-list-print td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #ddd; vertical-align: top; }
        .packing-list-print th { background: #f4f4f4; font-weight: 600; }
        .packing-list-print .tickbox { display: inline-block; width: 14px; height: 14px; border: 1.5px solid #333; vertical-align: middle; }
        .packing-list-print .footer { margin-top: 2rem; font-size: 0.75rem; color: #555; border-top: 1px solid #ccc; padding-top: 0.5rem; }
      `}</style>

      <div className="no-print mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Drucken
        </button>
      </div>

      <header>
        <h1>Packliste</h1>
        <div className="meta-row">
          <span className="meta-label">Kunde:</span>
          <span>
            {data.customer.name}
            {data.customer.street && `, ${data.customer.street}`}
            {(data.customer.zipCode || data.customer.city) &&
              `, ${[data.customer.zipCode, data.customer.city].filter(Boolean).join(' ')}`}
          </span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Anlage:</span>
          <span>
            {systemLabel}
            {serial && ` · Serien-Nr.: ${serial}`}
          </span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Termin:</span>
          <span>
            {format(new Date(data.booking.startTime), 'EEEE, dd. MMMM yyyy · HH:mm', {
              locale: de,
            })}{' '}
            Uhr
          </span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Techniker:</span>
          <span>{data.technician.name ?? '—'}</span>
        </div>
      </header>

      <section>
        <h2>Teile</h2>
        {consumables.length === 0 ? (
          <p className="text-sm text-gray-600">Keine Teile hinterlegt.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '2rem' }}></th>
                <th style={{ width: '5rem' }}>Menge</th>
                <th>Beschreibung</th>
                <th style={{ width: '8rem' }}>Art.-Nr.</th>
                <th style={{ width: '12rem' }}>Lagerstatus</th>
              </tr>
            </thead>
            <tbody>
              {consumables.map((p, idx) => (
                <tr key={`${p.source}-${p.setItemId ?? p.overrideId ?? idx}`}>
                  <td>
                    <span className="tickbox" />
                  </td>
                  <td>
                    {p.quantity} {p.unit}
                  </td>
                  <td>
                    {p.description}
                    {p.note && (
                      <div className="text-xs text-gray-600">{p.note}</div>
                    )}
                  </td>
                  <td>{p.articleNumber ?? '—'}</td>
                  <td>{stockStatus(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {tools.length > 0 && (
        <section>
          <h2>Werkzeug</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: '2rem' }}></th>
                <th>Beschreibung</th>
                <th style={{ width: '8rem' }}>Art.-Nr.</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((p, idx) => (
                <tr key={`${p.source}-${p.setItemId ?? p.overrideId ?? idx}`}>
                  <td>
                    <span className="tickbox" />
                  </td>
                  <td>
                    {p.description}
                    {p.note && (
                      <div className="text-xs text-gray-600">{p.note}</div>
                    )}
                  </td>
                  <td>{p.articleNumber ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="footer">
        Druckdatum: {format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
      </footer>
    </div>
  );
}
