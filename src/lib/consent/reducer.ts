// src/lib/consent/reducer.ts
import {
  CONSENT_VERSION,
  type ConsentState,
  type ServiceConsent,
} from './types';

export type ConsentAction =
  | { type: 'hydrate'; state: ConsentState }
  | { type: 'accept_all' }
  | { type: 'reject_all' }
  | { type: 'set_services'; services: Partial<ServiceConsent> }
  | { type: 'reopen' };

export function consentReducer(state: ConsentState, action: ConsentAction): ConsentState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'accept_all':
      return {
        version: CONSENT_VERSION,
        decided: true,
        services: { vercelAnalytics: true, posthog: true },
        decidedAt: new Date().toISOString(),
      };
    case 'reject_all':
      return {
        version: CONSENT_VERSION,
        decided: true,
        services: { vercelAnalytics: false, posthog: false },
        decidedAt: new Date().toISOString(),
      };
    case 'set_services':
      return {
        version: CONSENT_VERSION,
        decided: true,
        services: { ...state.services, ...action.services },
        decidedAt: new Date().toISOString(),
      };
    case 'reopen':
      return { ...state, decided: false };
    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}
