import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import parseAtts from './parse-atts';
import { JSDOM } from 'jsdom';

describe('tests for parse Attributes', () => {
  const prevWindow = global.window;

  beforeEach(() => {
    global.window = {
      // @ts-ignore forcefully assigning values to readonly properties
      navigator: { languages: ['ja'] },
    };
  });

  it('should parse attribute from container with data-key', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
          <div id="map" class="geolonia" data-key="YOUR-API-KEY"></div>
          </body></html>`).window;

    const container = mocDocument.querySelector('#map') as HTMLElement;
    const atts = parseAtts(container);
    expect(atts.key).toEqual('YOUR-API-KEY');
    expect(atts.style).toEqual('geolonia/basic-v2');
    expect(typeof atts.lang).toEqual('string'); // 'ja' or 'en' depending on environment
    expect(atts.marker).toEqual('on');
    expect(atts.zoom).toEqual(0);
    expect(atts.lat).toEqual(0);
    expect(atts.lng).toEqual(0);
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
    expect(atts.lat).toEqual('35.68');
    expect(atts.lng).toEqual('139.77');
    expect(atts.zoom).toEqual('14');
    expect(atts.style).toEqual('geolonia/gsi');
    expect(atts.marker).toEqual('off');
  });

  it('should have default values for empty container', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
          <div id="map" class="geolonia"></div>
          </body></html>`).window;

    const container = mocDocument.querySelector('#map') as HTMLElement;
    const atts = parseAtts(container);
    expect(atts.lat).toEqual(0);
    expect(atts.lng).toEqual(0);
    expect(atts.zoom).toEqual(0);
    expect(atts.marker).toEqual('on');
    expect(atts.loader).toEqual('on');
    expect(atts.gestureHandling).toEqual('on');
  });

  afterEach(() => {
    global.window = prevWindow;
  });
});
