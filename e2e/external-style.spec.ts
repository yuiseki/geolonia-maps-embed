import { test, expect } from '@playwright/test';
import { TEST_URL, waitForMapLoad } from './helper';

const EXTERNAL_STYLE_URL = 'https://tile.openstreetmap.jp/styles/osm-bright/style.json';

test.describe('External Style Support', () => {
  test('data-style で外部スタイルを指定しても地図が表示されること', async ({ page }) => {
    await page.goto(`${TEST_URL}/external-style.html`);
    await waitForMapLoad(page, '#map');

    const mapCanvas = page.locator('#map canvas.maplibregl-canvas');
    await expect(mapCanvas).toBeVisible();
  });

  test('data-style で指定した外部スタイルURLにアクセスしていること', async ({ page }) => {
    const styleRequest = page.waitForRequest((req) =>
      req.url().includes(EXTERNAL_STYLE_URL),
    );

    await page.goto(`${TEST_URL}/external-style.html`);

    const req = await styleRequest;
    expect(req.url()).toBe(EXTERNAL_STYLE_URL);
  });
});
