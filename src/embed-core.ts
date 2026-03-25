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
  coreVersion as embedVersion,
} from '@geolonia/maps-core';

export type {
  GeoloniaMapOptions,
} from '@geolonia/maps-core';

export { registerPlugin } from './lib/render';
export type { EmbedAttributes, EmbedPlugin } from './types';
