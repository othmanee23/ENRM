import { type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** One source of truth for shared storefront chrome, in dev and production. */
function sharedLayout(): Plugin {
  return {
    name: 'enrm-shared-layout',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!-- layout:(header|footer|dialogs) -->/g, (_, part: string) =>
          readFileSync(resolve('src/layout', `${part}.html`), 'utf8'),
        );
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('/src/layout/')) server.ws.send({ type: 'full-reload' });
    },
  };
}
export default defineConfig({
  plugins: [sharedLayout()],
  server: { host: '127.0.0.1', port: 4173 },
  preview: { host: '127.0.0.1', port: 4173 },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries(
        readdirSync('.')
          .filter((f) => f.endsWith('.html'))
          .map((f) => [f.replace('.html', ''), resolve(f)]),
      ),
    },
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
});
