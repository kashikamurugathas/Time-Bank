import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './server/gateway/router.ts';
import { initSocketIO } from './server/socket.ts';
import { seedDatabase } from './server/db/seed.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Parse JSON payloads (supporting base64 images up to 10MB)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Seed SQLite database on startup
  try {
    await seedDatabase();
  } catch (err: any) {
    console.error('Database seeding error:', err.message);
  }

  // Initialize Socket.IO for real-time messaging
  initSocketIO(server);

  // Mount API Gateway
  app.use('/api', apiRouter);

  // Serve static public assets in both development and production
  const publicPath = path.resolve(__dirname, 'public');
  app.use(express.static(publicPath));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', platform: 'Time Bank', timestamp: new Date().toISOString() });
  });

  // Mount Vite middlewares in development or serve static in production
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const isHttps = process.env.APP_URL?.startsWith('https') ?? false;
    const clientPort = isHttps ? 443 : PORT;
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: {
          server,
          clientPort,
        },
        hmr: {
          server,
          clientPort,
        },
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Time Bank Platform backend & API Gateway running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
