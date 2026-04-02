/**
 * @file Side-effect-free entry point for programmatic use (e.g. React wrapper).
 * Does NOT call renderGeoloniaMap() or set window.geolonia.
 * Re-exports from @geolonia/maps-core.
 */

export {
  GeoloniaMap,
  GeoloniaMarker,
  SimpleStyle,
  SimpleStyleVector,
  keyring,
  CustomAttributionControl,
  GeoloniaControl,
  getStyle,
  getLang,
  isGeoloniaTilesHost,
} from '@geolonia/maps-core';
export { VERSION as embedVersion } from './version';

export type {
  GeoloniaMapOptions,
} from '@geolonia/maps-core';

export { registerPlugin } from './lib/plugin';
export type { EmbedAttributes, EmbedPlugin } from './types';
