/* eslint-disable no-loss-of-precision */
'use strict';

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { random } from './util';

const originalRequestAnimationFrame = window.requestAnimationFrame;
const originalCreateObjectURL = window.URL.createObjectURL;

beforeAll(() => {
  window.URL.createObjectURL ||= (_: Blob | MediaSource) => 'dummy';
  window.requestAnimationFrame = (cb) => {
    cb(performance.now());
    return random(999999);
  };
});

afterAll(() => {
  window.requestAnimationFrame = originalRequestAnimationFrame;
  if (originalCreateObjectURL) {
    window.URL.createObjectURL = originalCreateObjectURL;
  }
});

const sampleRemoteGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [139.6870422363281, 35.73425097869431],
          [139.76943969726562, 35.73425097869431],
          [139.73922729492188, 35.66399091134812],
          [139.70352172851562, 35.698571062054015],
        ],
      },
    },
  ],
};

class Map {
  public bounds = false;
  public layers = [];
  public sources = {};

  constructor(
    private json?,
    private options?,
  ) {}

  addSource(id, source) {
    this.sources[id] = source;
  }

  addLayer(layer) {
    this.layers.push(layer);
  }

  on() {}

  getSource(id) {
    class getSource {
      constructor(
        private id,
        private sources,
      ) {}
      setData(geojson) {
        this.sources[this.id] = {
          type: 'geojson',
          data: geojson,
        };
      }
    }

    return new getSource(id, this.sources);
  }

  getContainer() {
    return { dataset: true };
  }

  fitBounds() {
    this.bounds = true;
  }
}

const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [139.77012634277344, 35.68518697509636],
      },
    },
  ],
};

describe('Tests for simpleStyle()', () => {
  it('should has sources and layers as expected', async () => {
    const { SimpleStyle } = await import('./simplestyle');

    const map = new Map();
    new SimpleStyle(geojson).addTo(map).fitBounds();

    expect(Object.keys(map.sources)).toEqual(
      ['geolonia-simple-style', 'geolonia-simple-style-points'],
    );
    expect(map.layers.length).toEqual(8);
    expect(map.bounds).toEqual(true);
    expect(
      map.layers.find(
        (layer) => layer.id === 'geolonia-simple-style-symbol-points',
      ).layout['icon-allow-overlap'],
    ).toEqual(true);
    expect(
      map.layers.find(
        (layer) => layer.id === 'geolonia-simple-style-symbol-points',
      ).layout['text-allow-overlap'],
    ).toEqual(true);
  });

  it('should has sources and layers as expected with custom IDs', async () => {
    const { SimpleStyle } = await import('./simplestyle');

    const map = new Map();
    new SimpleStyle(geojson, { id: 'hello-world' }).addTo(map).fitBounds();

    expect(Object.keys(map.sources)).toEqual(
      ['hello-world', 'hello-world-points'],
    );
    expect(map.layers.length).toEqual(8);
    expect(map.bounds).toEqual(true);
  });

  it('should has sources and layers as expected with empty GeoJSON', async () => {
    const { SimpleStyle } = await import('./simplestyle');

    const map = new Map();

    const empty = {
      type: 'FeatureCollection',
      features: [],
    };

    new SimpleStyle(empty, { id: 'hello-world' }).addTo(map).fitBounds();

    expect(Object.keys(map.sources)).toEqual(
      ['hello-world', 'hello-world-points'],
    );
    expect(map.layers.length).toEqual(8);
    expect(map.bounds).toEqual(false);
  });

  it('should update GeoJSON', async () => {
    const { SimpleStyle } = await import('./simplestyle');

    const map = new Map();

    const empty = {
      type: 'FeatureCollection',
      features: [],
    };

    const ss = new SimpleStyle(empty).addTo(map).fitBounds();

    expect(Object.keys(map.sources)).toEqual(
      ['geolonia-simple-style', 'geolonia-simple-style-points'],
    );
    expect(map.layers.length).toEqual(8);
    expect(map.bounds).toEqual(false);
    expect(
      map.sources['geolonia-simple-style-points'].data.features.length,
    ).toEqual(0);

    ss.updateData(geojson);
    expect(map.bounds).toEqual(false);
    expect(
      map.sources['geolonia-simple-style-points'].data.features.length,
    ).toEqual(1);
  });

  it('should load GeoJSON from url', async () => {
    const { SimpleStyle } = await import('./simplestyle');
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(sampleRemoteGeoJSON), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const map = new Map();
    const geojsonUrl = 'https://example.com/test.geojson';
    const ss = new SimpleStyle(geojsonUrl);
    ss.addTo(map).fitBounds();

    await ss._loadingPromise;

    const geometry =
      map.sources['geolonia-simple-style'].data.features[0].geometry;
    const coordinates = geometry.coordinates;
    const type = geometry.type;

    const expectCoordinates = [
      [139.6870422363281, 35.73425097869431],
      [139.76943969726562, 35.73425097869431],
      [139.73922729492188, 35.66399091134812],
      [139.70352172851562, 35.698571062054015],
    ];

    expect(coordinates).toEqual(expectCoordinates);
    expect(type).toEqual('LineString');
    expect(map.bounds).toEqual(true);

    fetchSpy.mockRestore();
  });

  it('should load empty GeoJSON when failed to fetch GeoJSON', async () => {
    const { SimpleStyle } = await import('./simplestyle');
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    const map = new Map();
    const geojsonUrl = 'https://example.com/404.geojson';
    const ss = new SimpleStyle(geojsonUrl);
    ss.addTo(map).fitBounds();

    await ss._loadingPromise;

    expect(Object.keys(map.sources)).toEqual(
      ['geolonia-simple-style', 'geolonia-simple-style-points'],
    );
    expect(map.layers.length).toEqual(8);
    expect(map.bounds).toEqual(false);

    fetchSpy.mockRestore();
  });

  it('should update GeoJSON from url', async () => {
    const { SimpleStyle } = await import('./simplestyle');
    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(sampleRemoteGeoJSON), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const map = new Map();
    const empty = {
      type: 'FeatureCollection',
      features: [],
    };

    const ss = new SimpleStyle(empty);
    ss.addTo(map).fitBounds();

    await ss._loadingPromise;

    const geojsonUrl = 'https://example.com/test.geojson';

    ss.updateData(geojsonUrl);

    await ss._loadingPromise;

    const geometry =
      map.sources['geolonia-simple-style'].data.features[0].geometry;
    const coordinates = geometry.coordinates;
    const type = geometry.type;

    const expectCoordinates = [
      [139.6870422363281, 35.73425097869431],
      [139.76943969726562, 35.73425097869431],
      [139.73922729492188, 35.66399091134812],
      [139.70352172851562, 35.698571062054015],
    ];

    expect(coordinates).toEqual(expectCoordinates);
    expect(type).toEqual('LineString');
    expect(map.bounds).toEqual(true);

    fetchSpy.mockRestore();
  });
});
