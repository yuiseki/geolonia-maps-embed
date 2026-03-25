'use strict';

import { keyring, getLang, type GeoloniaMapOptions } from '@geolonia/maps-core';
import type { EmbedAttributes } from '../types';

type ParseAttsParams = {
  interactive?: boolean;
};

export default (container: HTMLElement, params: ParseAttsParams = {}): EmbedAttributes => {
  const dataset = (container as HTMLElement & { dataset: DOMStringMap }).dataset;
  if (!dataset) {
    (container as any).dataset = {};
  }

  let lang = 'auto';
  if (dataset.lang && dataset.lang === 'auto') {
    lang = getLang();
  } else if (dataset.lang && dataset.lang === 'ja') {
    lang = 'ja';
  } else if (dataset.lang && dataset.lang !== 'ja') {
    lang = 'en';
  } else {
    lang = getLang();
  }

  // Set API key from data-key attribute
  const apiKey = dataset.key || '';
  if (apiKey) {
    keyring.setApiKey(apiKey);
  }

  const stage = dataset.stage || 'dev';
  keyring.setStage(stage);

  // Check if using Geolonia style or external style
  const style = dataset.style || 'geolonia/basic-v2';
  keyring.isGeoloniaStyle = keyring.isGeoloniaStyleCheck(style);

  return {
    lat: 0,
    lng: 0,
    zoom: 0,
    bearing: 0,
    pitch: 0,
    hash: 'off',
    marker: 'on',
    markerColor: '#E4402F',
    openPopup: 'off',
    customMarker: '',
    customMarkerOffset: '0, 0',
    gestureHandling: params.interactive === false ? 'off' : 'on',
    navigationControl: params.interactive === false ? 'off' : 'on',
    geolocateControl: 'off',
    fullscreenControl: 'off',
    scaleControl: 'off',
    geoloniaControl: 'on',
    geojson: '',
    simpleVector: '',
    cluster: 'on',
    clusterColor: '#ff0000',
    style: 'geolonia/basic-v2',
    lang: lang,
    plugin: 'off',
    key: keyring.apiKey,
    apiUrl: `https://api.geolonia.com/${keyring.stage}`,
    stage: keyring.stage,
    loader: 'on',
    minZoom: '',
    maxZoom: 20,
    '3d': '',
    ...dataset,
  };
};

/**
 * Convert EmbedAttributes to GeoloniaMapOptions.
 * Bridge between HTML data-* attributes and maps-core options.
 */
export function attsToOptions(container: HTMLElement, atts: EmbedAttributes): GeoloniaMapOptions {
  const toBool = (val: string | number, defaultVal: boolean): boolean => {
    if (val === 'on') return true;
    if (val === 'off') return false;
    return defaultVal;
  };

  const toControl = (val: string | number): boolean | string => {
    if (val === 'on') return true;
    if (val === 'off') return false;
    const positions = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
    if (typeof val === 'string' && positions.includes(val.toLowerCase())) {
      return val.toLowerCase();
    }
    return false;
  };

  return {
    container,
    apiKey: String(atts.key || ''),
    stage: String(atts.stage || 'dev'),
    style: String(atts.style || 'geolonia/basic-v2'),
    lang: String(atts.lang || 'auto') as 'ja' | 'en' | 'auto',
    center: [parseFloat(String(atts.lng)), parseFloat(String(atts.lat))],
    zoom: parseFloat(String(atts.zoom)),
    bearing: parseFloat(String(atts.bearing)),
    pitch: parseFloat(String(atts.pitch)),
    hash: atts.hash === 'on',
    minZoom: atts.minZoom !== '' ? Number(atts.minZoom) : undefined,
    maxZoom: Number(atts.maxZoom) || 20,
    marker: toBool(atts.marker, true),
    markerColor: String(atts.markerColor),
    openPopup: toBool(atts.openPopup, false),
    customMarker: String(atts.customMarker) || undefined,
    customMarkerOffset: atts.customMarkerOffset && String(atts.customMarkerOffset) !== '0, 0'
      ? String(atts.customMarkerOffset).split(',').map((n) => Number(n.trim())) as [number, number]
      : undefined,
    loader: toBool(atts.loader, true),
    gestureHandling: toBool(atts.gestureHandling, true),
    navigationControl: toControl(atts.navigationControl) as boolean,
    geolocateControl: toControl(atts.geolocateControl) as boolean,
    fullscreenControl: toControl(atts.fullscreenControl) as boolean,
    scaleControl: toControl(atts.scaleControl) as boolean,
    geoloniaControl: toControl(atts.geoloniaControl) as boolean,
    geojson: String(atts.geojson) || undefined,
    cluster: toBool(atts.cluster, true),
    clusterColor: String(atts.clusterColor),
    simpleVector: String(atts.simpleVector) || undefined,
    '3d': toBool(atts['3d'], false),
  };
}
