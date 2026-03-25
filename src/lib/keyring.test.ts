import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { keyring } from './keyring';
import { JSDOM } from 'jsdom';

describe('parse api key from dom', () => {
  beforeEach(() => {
    keyring.reset();
    process.env.MAP_PLATFORM_STAGE = 'dev';
  });
  afterEach(() => {
    delete process.env.MAP_PLATFORM_STAGE;
  });
  afterAll(() => {
    keyring.reset();
  });

  it('should parse with geolonia flag', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
      <script src="https://external.example.com/?geolonia-api-key=abc"></script>
    </body></html>`).window;

    keyring.parse(mocDocument);
    expect(keyring.apiKey).toEqual('abc');
    expect(keyring.stage).toEqual('dev');
  });

  it('should parse with geolonia flag (multiple scripts)', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
      <script src="https://external.example.com/jquery.js"></script>
      <script src="https://external.example.com/?geolonia-api-key=def"></script>
    </body></html>`).window;

    keyring.parse(mocDocument);
    expect(keyring.apiKey).toEqual('def');
    expect(keyring.stage).toEqual('dev');
  });

  it('should be "YOUR-API-KEY" and "dev"', () => {
    const { document: mocDocument } = new JSDOM(`<html><body>
      <script src="https://external.example.com/jquery.js"></script>
      <script type="text/javascript" src="https://api.geolonia.com/dev/embed?geolonia-api-key=YOUR-API-KEY"></script>
    </body></html>`).window;

    keyring.parse(mocDocument);
    expect(keyring.apiKey).toEqual('YOUR-API-KEY');
    expect(keyring.stage).toEqual('dev');
  });

  it('should be "YOUR-API-KEY" and "v1"', () => {
    process.env.MAP_PLATFORM_STAGE = 'v1';
    const { document: mocDocument } = new JSDOM(`<html><body>
      <script src="https://external.example.com/jquery.js"></script>
      <script type="text/javascript" src="https://api.geolonia.com/v1/embed?geolonia-api-key=YOUR-API-KEY"></script>
    </body></html>`).window;

    keyring.parse(mocDocument);
    expect(keyring.apiKey).toEqual('YOUR-API-KEY');
    expect(keyring.stage).toEqual('v1');
  });

  it('should be "YOUR-API-KEY" and "v123.4"', () => {
    process.env.MAP_PLATFORM_STAGE = 'v123.4';
    const { document: mocDocument } = new JSDOM(`<html><body>
      <script src="https://external.example.com/jquery.js"></script>
      <script type="text/javascript" src="https://api.geolonia.com/v123.4/embed?geolonia-api-key=YOUR-API-KEY"></script>
    </body></html>`).window;

    keyring.parse(mocDocument);
    expect(keyring.apiKey).toEqual('YOUR-API-KEY');
    expect(keyring.stage).toEqual('v123.4');
  });

  it('should be "YOUR-API-KEY" and "dev" if process.env.MAP_PLATFORM_STAGE is not set', () => {
    delete process.env.MAP_PLATFORM_STAGE;
    const { document: mocDocument } = new JSDOM(`<html><body>
      <script src="https://external.example.com/jquery.js"></script>
      <script src="https://external.example.com/?geolonia-api-key=YOUR-API-KEY"></script>
    </body></html>`).window;

    keyring.parse(mocDocument);
    expect(keyring.apiKey).toEqual('YOUR-API-KEY');
    expect(keyring.stage).toEqual('dev');
  });
});

describe('isGeoloniaStyleCheck', () => {
  it('should return true for empty or null style (default)', () => {
    expect(keyring.isGeoloniaStyleCheck('')).toBe(true);
    expect(keyring.isGeoloniaStyleCheck(null)).toBe(true);
    expect(keyring.isGeoloniaStyleCheck(undefined)).toBe(true);
  });

  it('should return true for Geolonia logical names', () => {
    expect(keyring.isGeoloniaStyleCheck('geolonia/basic')).toBe(true);
    expect(keyring.isGeoloniaStyleCheck('geolonia/basic-v2')).toBe(true);
    expect(keyring.isGeoloniaStyleCheck('geolonia/gsi')).toBe(true);
  });

  it('should return true for Geolonia CDN URLs', () => {
    expect(keyring.isGeoloniaStyleCheck('https://cdn.geolonia.com/style/geolonia/basic/ja.json')).toBe(true);
    expect(keyring.isGeoloniaStyleCheck('https://api.geolonia.com/v1/styles/basic.json')).toBe(true);
  });

  it('should return false for external HTTPS URLs', () => {
    expect(keyring.isGeoloniaStyleCheck('https://tile.openstreetmap.jp/styles/osm-bright/style.json')).toBe(false);
    expect(keyring.isGeoloniaStyleCheck('https://example.com/style.json')).toBe(false);
  });

  it('should return false for relative paths to external .json files', () => {
    expect(keyring.isGeoloniaStyleCheck('./my-style.json')).toBe(false);
    expect(keyring.isGeoloniaStyleCheck('/styles/custom.json')).toBe(false);
  });

  it('should return true for relative paths to geolonia.com', () => {
    // Simulate being on geolonia.com
    const origHref = global.location?.href;
    global.location = {
      ...global.location,
      href: 'https://cdn.geolonia.com/demo.html',
    };
    expect(keyring.isGeoloniaStyleCheck('./style.json')).toBe(true);
    // Restore
    if (origHref) {
      global.location = { ...global.location, href: origHref };
    }
  });
});
