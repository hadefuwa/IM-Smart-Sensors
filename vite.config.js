import { defineConfig } from 'vite';

export default defineConfig({
  // Default to root for local/Pi hosting; override in CI for GitHub Pages.
  base: process.env.VITE_BASE_PATH || '/'
});
