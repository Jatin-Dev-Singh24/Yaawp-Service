import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './server/db';
import { apiRouter } from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize SQLite tables and seed data if needed
  try {
    initDatabase();
    console.log('[YAAWP] SQLite database initialized successfully.');
  } catch (err) {
    console.error('[YAAWP] Error initializing database:', err);
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount backend API router
  app.use('/api', apiRouter);

  // In production, serve static built files from dist
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In development, mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[YAAWP] Agency server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
