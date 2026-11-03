import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  const isHttps = process.env.APP_URL?.startsWith('https') ?? false;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Configure WebSocket / HMR for both local dev and hosted preview environment
      ws: {
        clientPort: isHttps ? 443 : 3000,
      },
      hmr: {
        clientPort: isHttps ? 443 : 3000,
      },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
