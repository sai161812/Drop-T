import { createApp } from '../server/dist/app.js';

let appInstance: any = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

export default function handler(req: any, res: any) {
  try {
    const app = getApp();
    
    // Normalize url if Vercel strips /api in rewrites
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }

    return app(req, res);
  } catch (err: any) {
    console.error('[Vercel Serverless Error]:', err);
    return res.status(500).json({
      error: 'Internal Serverless Error',
      message: err?.message || String(err),
      stack: err?.stack
    });
  }
}
