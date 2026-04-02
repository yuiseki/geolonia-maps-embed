import type { GeoloniaMap } from '@geolonia/maps-core';

export const plugins: Array<(map: GeoloniaMap, target: HTMLElement, atts: any) => void> = [];

export const registerPlugin = (
  plugin: (map: GeoloniaMap, target: HTMLElement, atts: any) => void,
): void => {
  plugins.push(plugin);
  return void 0;
};
