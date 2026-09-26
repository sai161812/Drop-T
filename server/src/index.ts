import { createApp } from './app.js';
import { config } from './config.js';
import { closeDatabase } from './db/database.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[DROPTEST Server] Running on http://localhost:${config.port}`);
  console.log(`[DROPTEST Server] SQLite Database & Storage initialized in ${config.dataDir}`);
});

let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[DROPTEST Server] ${signal} received; finishing active requests.`);

  server.close(() => {
    closeDatabase();
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[DROPTEST Server] Graceful shutdown timed out.');
    process.exit(1);
  }, 55_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
