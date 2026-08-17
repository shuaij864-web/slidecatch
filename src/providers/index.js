import { customProvidersFromSettings } from './custom.js';
import { genericProvider } from './generic.js';
import { yuketangProvider } from './yuketang.js';
export function providersForSettings(settings={}){return[...customProvidersFromSettings(settings),yuketangProvider,genericProvider];}
export function selectProvider(rawUrl,settings={}){return providersForSettings(settings).find((p)=>p.matchesLocation(rawUrl))||genericProvider;}
export function providerById(providerId,settings={}){return providersForSettings(settings).find((p)=>p.id===providerId)||genericProvider;}
