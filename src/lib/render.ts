import 'maplibre-gl/dist/maplibre-gl.css';
import '@geolonia/maps-core/css';
import { GeoloniaMap, keyring } from '@geolonia/maps-core';
import parseAtts, { attsToOptions } from './parse-atts';
import { plugins } from './plugin';

/**
 * Parse API key and stage from the embed script tag URL.
 * e.g. <script src="https://cdn.geolonia.com/v1/embed?geolonia-api-key=YOUR-API-KEY"></script>
 */
const parseScriptTag = () => {
  const scripts: HTMLScriptElement[] | HTMLCollectionOf<HTMLScriptElement> =
    document.currentScript
      ? [document.currentScript as HTMLScriptElement]
      : document.getElementsByTagName('script');

  for (const script of scripts) {
    if (!script.src) continue;
    try {
      const url = new URL(script.src, location.href);
      const apiKey = url.searchParams.get('geolonia-api-key');
      if (apiKey) {
        keyring.setApiKey(apiKey);
        keyring.setStage(process.env.MAP_PLATFORM_STAGE || 'dev');
        break;
      }
    } catch {
      // ignore invalid URLs
    }
  }
};

export const renderGeoloniaMap = () => {
  // Extract API key from script tag URL (backward compatibility)
  parseScriptTag();

  // checkPermission inline (avoid importing deleted util.ts)
  const checkPermission = (): boolean => {
    if (window.self === window.parent) return true;
    if (keyring.apiKey) return true;
    try {
      if (window.self.location.origin === window.top.location.origin) return true;
    } catch {
      // cross-origin — fall through to whitelist checks
    }
    // Whitelist: CodePen, JSFiddle, CodeSandbox
    if (
      (window.self.location.origin === 'https://cdpn.io' || window.self.location.origin === 'https://codepen.io') &&
      window.document.referrer.indexOf('https://codepen.io') === 0
    ) return true;
    if (
      window.self.location.origin === 'https://fiddle.jshell.net' &&
      window.document.referrer.indexOf('https://jsfiddle.net') === 0
    ) return true;
    if (
      window.self.location.origin.match(/csb\.app$/) &&
      window.document.referrer.indexOf('https://codesandbox.io') === 0
    ) return true;
    return false;
  };

  if (checkPermission()) {
    let isDOMContentLoaded = false;
    const alreadyRenderedMaps = [];
    const isRemoved = Symbol('map-is-removed');

    /**
     * @param {HTMLElement} target
     */
    const renderSingleMap = (target) => {
      // Capture innerHTML for popup content before map clears it
      const content = target.innerHTML.trim();
      if (content) {
        target.dataset.popupContent = content;
      }

      const atts = parseAtts(target);

      // Warn if API key is missing for Geolonia styles
      if (keyring.isGeoloniaStyle && !keyring.apiKey) {
        console.error('[Geolonia] Missing API key.'); // eslint-disable-line
      }

      const options = attsToOptions(target, atts);
      const map = new GeoloniaMap(options);

      // detect if the map removed manually
      map.on('remove', () => {
        map[isRemoved] = true;
      });

      // remove map instance automatically if the container removed.
      // prevent memory leak
      const observer = new MutationObserver((mutationRecords) => {
        const removed = mutationRecords.some((record) =>
          [...record.removedNodes].some((node) => node === target),
        );
        if (removed && !map[isRemoved]) {
          map.remove();
        }
      });
      observer.observe(target.parentNode, { childList: true });

      // plugin
      if (isDOMContentLoaded && !map[isRemoved]) {
        plugins.forEach((plugin) => plugin(map, target, atts));
      } else {
        alreadyRenderedMaps.push({ map, target: target, atts });
      }
    };

    document.addEventListener('DOMContentLoaded', () => {
      isDOMContentLoaded = true;
      alreadyRenderedMaps.forEach(({ map, target, atts }) => {
        if (!map[isRemoved]) {
          plugins.forEach((plugin) => plugin(map, target, atts));
        }
      });
      // clear
      alreadyRenderedMaps.splice(0, alreadyRenderedMaps.length);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((item) => {
        if (!item.isIntersecting) {
          return;
        }
        try {
          renderSingleMap(item.target);
        } catch (e) {
          // Not throw error because, following maps will not be rendered.
          console.error('[Geolonia] Failed to initialize map', e); // eslint-disable-line
        }
        observer.unobserve(item.target);
      });
    });

    const containers = document.querySelectorAll(
      '.geolonia[data-lazy-loading="off"]',
    );
    const lazyContainers = document.querySelectorAll(
      '.geolonia:not([data-lazy-loading="off"])',
    );

    // render Map immediately
    for (let i = 0; i < containers.length; i++) {
      try {
        renderSingleMap(containers[i]);
      } catch (e) {
        // Not throw error because, following maps will not be rendered.
        console.error('[Geolonia] Failed to initialize map', e); // eslint-disable-line
      }
    }

    // set intersection observer
    for (let i = 0; i < lazyContainers.length; i++) {
      observer.observe(lazyContainers[i]);
    }
  } else {
    /* eslint-disable-next-line no-console */
    console.error(
      "[Geolonia] We are very sorry, but we can't display our map in iframe.",
    );
  }
};

export { registerPlugin } from './plugin';
