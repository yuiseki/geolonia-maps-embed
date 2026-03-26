import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['@geolonia/maps-core', 'maplibre-gl'],
      },
    },
  },
});
