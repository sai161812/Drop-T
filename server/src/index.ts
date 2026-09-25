import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`[DROPTEST Server] Running on http://localhost:${config.port}`);
  console.log(`[DROPTEST Server] SQLite Database & Storage initialized in ${config.dataDir}`);
});
