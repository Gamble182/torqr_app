// src/lib/marketing/wartungsintervall.ts
export const SYSTEM_TYPE_KEYS = [
  'HEATING',
  'AC',
  'WATER_TREATMENT',
  'ENERGY_STORAGE',
] as const;

export type SystemTypeKey = (typeof SYSTEM_TYPE_KEYS)[number];

export const DEFAULT_SYSTEM_TYPE: SystemTypeKey = 'HEATING';
export const DEFAULT_BAUJAHR_OFFSET_YEARS = 5;
export const MIN_BAUJAHR = 1980;
export const OLD_SYSTEM_THRESHOLD_YEARS = 15;

export interface WartungsintervallInput {
  systemType: SystemTypeKey;
  baujahr: number;
}

export interface WartungsintervallResult {
  empfohlenInMonaten: number;
  gesetzlichePflicht: boolean;
  begruendung: string;
  isAltAnlage: boolean;
}

interface BaseRule {
  months: number;
  legallyRequired: boolean;
  baseReason: string;
}

const BASE_RULES: Record<SystemTypeKey, BaseRule> = {
  HEATING: {
    months: 12,
    legallyRequired: true,
    baseReason:
      'Heizungsanlagen unterliegen nach KÜO und DIN 4795 einer jährlichen Wartungspflicht. Hersteller setzen 12 Monate i. d. R. als Garantie-Bedingung voraus.',
  },
  AC: {
    months: 12,
    legallyRequired: true,
    baseReason:
      'Klimaanlagen ab 3 kg CO₂-Äquivalent F-Gas-Füllmenge sind nach EU 517/2014 jährlich dichtigkeitsprüfpflichtig. Hersteller empfehlen 12-Monats-Wartung.',
  },
  WATER_TREATMENT: {
    months: 12,
    legallyRequired: false,
    baseReason:
      'Wasseraufbereitungs-Anlagen (Enthärtung, Filtration) haben keine gesetzliche Wartungspflicht. Trinkwasser-Hygiene erfordert jedoch jährlichen Filter- und Salz-Check.',
  },
  ENERGY_STORAGE: {
    months: 24,
    legallyRequired: false,
    baseReason:
      'Pufferspeicher und Warmwasser-Boiler benötigen keine gesetzliche Wartung. Anoden-Prüfung und Spülung alle 24 Monate verhindert Korrosionsschäden.',
  },
};

export function computeWartungsintervall({
  systemType,
  baujahr,
}: WartungsintervallInput): WartungsintervallResult {
  const currentYear = new Date().getFullYear();
  if (
    !Number.isInteger(baujahr) ||
    baujahr < MIN_BAUJAHR ||
    baujahr > currentYear
  ) {
    throw new RangeError(
      `Baujahr muss eine ganze Zahl zwischen ${MIN_BAUJAHR} und ${currentYear} sein.`,
    );
  }
  const rule = BASE_RULES[systemType];
  const alterJahre = currentYear - baujahr;
  const isAltAnlage = alterJahre >= OLD_SYSTEM_THRESHOLD_YEARS;
  const begruendung = isAltAnlage
    ? `${rule.baseReason} Hinweis: Bei einem Anlagenalter von ${alterJahre} Jahren empfehlen wir zusätzliche Sicht- und Funktionskontrollen zwischen den Hauptwartungen.`
    : rule.baseReason;
  return {
    empfohlenInMonaten: rule.months,
    gesetzlichePflicht: rule.legallyRequired,
    begruendung,
    isAltAnlage,
  };
}
