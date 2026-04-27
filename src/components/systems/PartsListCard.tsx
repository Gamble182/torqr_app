'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
  PackageIcon,
  WrenchIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCustomerSystem } from '@/hooks/useCustomerSystems';
import { useMaintenanceSets } from '@/hooks/useMaintenanceSets';
import { useEffectiveParts } from '@/hooks/useEffectiveParts';
import { formatPartCategory } from '@/lib/format';
import { CustomerSystemOverrideList } from './CustomerSystemOverrideList';

interface PartsListCardProps {
  systemId: string;
}

/**
 * Wartungsteile section on the system-detail page (Task 27 — Phase A).
 *
 * Three blocks:
 * 1. "Standard-Wartungsset" — read-only preview + (OWNER) deep link.
 * 2. "Abweichungen für diese Anlage" — ADD/EXCLUDE list, OWNER may mutate.
 * 3. "Effektive Liste" — collapsed by default; expands to resolved parts.
 */
export function PartsListCard({ systemId }: PartsListCardProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === 'OWNER';

  const { data: system } = useCustomerSystem(systemId);
  const catalogId = system?.catalogId;

  const { data: sets, isLoading: setsLoading } = useMaintenanceSets(catalogId);
  // The list endpoint enforces uniqueness per (companyId, catalogId), so the
  // first hit is the standard set for this catalog.
  const standardSet = sets?.[0];

  const {
    data: effectiveParts,
    isLoading: effectiveLoading,
    error: effectiveError,
  } = useEffectiveParts(systemId);

  const [effectiveOpen, setEffectiveOpen] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-5">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <WrenchIcon className="h-4 w-4" />
        Wartungsteile
      </h2>

      {/* 1) Standard-Wartungsset */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Standard-Wartungsset
        </h3>
        {setsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" /> Lädt…
          </div>
        ) : standardSet ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2">
            <div className="text-sm">
              <div className="font-medium text-foreground">
                {standardSet.catalog.manufacturer} {standardSet.catalog.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {standardSet._count.items}{' '}
                {standardSet._count.items === 1 ? 'Teil' : 'Teile'} im Standard
              </div>
            </div>
            {isOwner && (
              <Link
                href={`/dashboard/wartungssets/${standardSet.id}`}
                className="text-sm text-primary hover:underline whitespace-nowrap"
              >
                Bearbeiten →
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border px-3 py-2">
            <p className="text-sm text-muted-foreground">
              Noch kein Wartungsset für dieses Modell.
            </p>
            {isOwner && (
              <Link
                href="/dashboard/wartungssets"
                className="text-sm text-primary hover:underline whitespace-nowrap"
              >
                Wartungsset anlegen →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 2) Abweichungen */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Abweichungen für diese Anlage
        </h3>
        <CustomerSystemOverrideList
          systemId={systemId}
          overrides={system?.partOverrides ?? []}
          standardSetId={standardSet?.id}
          isOwner={isOwner}
        />
      </section>

      {/* 3) Effektive Liste */}
      <section className="space-y-2">
        <button
          type="button"
          onClick={() => setEffectiveOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-muted/30 transition-colors"
          aria-expanded={effectiveOpen}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Effektive Liste
            {effectiveParts && (
              <span className="ml-2 normal-case tracking-normal text-foreground">
                ({effectiveParts.length})
              </span>
            )}
          </span>
          {effectiveOpen ? (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {effectiveOpen && (
          <div className="rounded-md border border-border">
            {effectiveLoading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" /> Lädt…
              </div>
            ) : effectiveError ? (
              <div className="px-3 py-3 text-sm text-destructive">
                Fehler beim Laden der effektiven Liste.
              </div>
            ) : !effectiveParts || effectiveParts.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Keine effektiven Teile.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {effectiveParts.map((part) => (
                  <li
                    key={
                      part.source === 'DEFAULT'
                        ? `default-${part.setItemId}`
                        : `add-${part.overrideId}`
                    }
                    className="flex items-start justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={part.source === 'DEFAULT' ? 'secondary' : 'default'}
                        >
                          {part.source === 'DEFAULT' ? 'Standard' : 'Ergänzung'}
                        </Badge>
                        <Badge variant="outline">
                          {formatPartCategory(part.category)}
                        </Badge>
                        <span className="text-sm font-medium text-foreground truncate">
                          {part.description}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {part.articleNumber && <span>Art-Nr. {part.articleNumber}</span>}
                        {part.note && <span className="italic">{part.note}</span>}
                        {part.inventoryItem && (
                          <span className="inline-flex items-center gap-1">
                            <PackageIcon className="h-3 w-3" />
                            {part.inventoryItem.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-foreground whitespace-nowrap">
                      {part.quantity} {part.unit}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
