import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';

import maplibregl from 'maplibre-gl';

/**
 * このテストは、jsdom環境ではmaplibre-glのMapインスタンスが
 * WebGL不足のため生成できないことを「動作証跡付き」でドキュメント化するものです。
 * 実際の描画テストはE2Eテストで行ってください。
 */

describe('maplibre-gl jsdom limitation', () => {
  it('jsdom上ではMaplibre Mapインスタンス生成時にエラー（WebGL未対応のため）', () => {
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><div id="map"></div></body></html>',
      {
        url: 'http://localhost',
        pretendToBeVisual: true, // jsdomを視覚的な環境として
      },
    );
    // @ts-ignore
    global.window = dom.window;
    global.document = dom.window.document;
    let errorCaught = null;
    try {
      new maplibregl.Map({
        container: 'map',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [139.767, 35.681],
        zoom: 10,
      });
    } catch (err) {
      errorCaught = err;
    }
    expect(errorCaught).toBeInstanceOf(Error);
    // 期待される理由: WebGLが利用できない旨のエラーメッセージ
    expect(
      /webgl|WebGL|context|device/i.test(errorCaught.message),
    ).toBe(true);
  });

  it('【NOTE】描画テストが必要な場合はE2E（ブラウザ実行）で行うこと', () => {
    // このテストは常に成功。ドキュメント用途。
    expect(true).toBe(true);
  });
});
