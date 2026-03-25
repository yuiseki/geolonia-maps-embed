import parseAtts from './parse-atts';
import assert from 'assert';
import { JSDOM } from 'jsdom';
import { keyring } from '@geolonia/maps-core';

describe('tests for parse Attributes', () => {
  const prevWindow = global.window;

  beforeEach(() => {
    global.window = {
      // @ts-ignore forcefully assigning values to readonly properties
      navigator: { languages: ['ja'] },
    };

    keyring.reset();
  });

  it('should parse attribute from container with data-key', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
          <div id="map" class="geolonia" data-key="YOUR-API-KEY"></div>
          </body></html>`).window;

    const container = mocDocument.querySelector('#map') as HTMLElement;
    const atts = parseAtts(container);
    assert.deepStrictEqual(atts.key, 'YOUR-API-KEY');
    assert.deepStrictEqual(atts.style, 'geolonia/basic-v2');
    assert.deepStrictEqual(atts.lang, 'ja');
    assert.deepStrictEqual(atts.marker, 'on');
    assert.deepStrictEqual(atts.zoom, 0);
    assert.deepStrictEqual(atts.lat, 0);
    assert.deepStrictEqual(atts.lng, 0);
    assert.deepStrictEqual(keyring.apiKey, 'YOUR-API-KEY');
  });

  it('should parse container with data-* attributes', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
          <div id="map" class="geolonia"
            data-lat="35.68"
            data-lng="139.77"
            data-zoom="14"
            data-style="geolonia/gsi"
            data-marker="off"
          ></div>
          </body></html>`).window;

    const container = mocDocument.querySelector('#map') as HTMLElement;
    const atts = parseAtts(container);
    assert.deepStrictEqual(atts.lat, '35.68');
    assert.deepStrictEqual(atts.lng, '139.77');
    assert.deepStrictEqual(atts.zoom, '14');
    assert.deepStrictEqual(atts.style, 'geolonia/gsi');
    assert.deepStrictEqual(atts.marker, 'off');
  });

  it('should have default values for empty container', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
          <div id="map" class="geolonia"></div>
          </body></html>`).window;

    const container = mocDocument.querySelector('#map') as HTMLElement;
    const atts = parseAtts(container);
    assert.deepStrictEqual(atts.lat, 0);
    assert.deepStrictEqual(atts.lng, 0);
    assert.deepStrictEqual(atts.zoom, 0);
    assert.deepStrictEqual(atts.marker, 'on');
    assert.deepStrictEqual(atts.loader, 'on');
    assert.deepStrictEqual(atts.gestureHandling, 'on');
  });

  afterEach(() => {
    global.window = prevWindow;
    keyring.reset();
  });
});
