import {resolve} from 'node:path';
import {defineConfig} from 'vitest/config';

// The end to end tests drive the core library's internals (CogReader, cogProtocol), which its package
// does not export, so they are read from its ESM build. It has to be processed by vitest, not
// loaded by Node, as its relative imports have no file extension.
const CORE = resolve(__dirname, 'node_modules/@geomatico/maplibre-cog-protocol/dist/esm');

export default defineConfig({
  resolve: {
    alias: [{find: /^@core\//, replacement: `${CORE}/`}],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    server: {deps: {inline: [/maplibre-cog-protocol/]}},
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      include: ['src/**/*.ts'],
    },
  },
});
