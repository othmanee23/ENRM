import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import type { OpenNextConfig } from '@opennextjs/cloudflare';

export default {
  ...defineCloudflareConfig(),
  buildCommand: 'npx next build --webpack',
} satisfies OpenNextConfig;
