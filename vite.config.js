import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (!env.VITE_SITE_URL) {
    console.warn('[vite.config] VITE_SITE_URL is not set; og:url/og:image will use relative URLs. Set it in .env (see .env.example).');
    process.env.VITE_SITE_URL = '';
  }
  return { base: '/' };
});
