// Load inside the handler so startup errors (including storage initialization)
// are logged and returned as JSON instead of an opaque invocation failure.
let appPromise: Promise<any> | undefined;

export default async function handler(req: any, res: any) {
  try {
    appPromise ??= import('../server/dist/app.js').then(({ createApp }) => createApp());
    const app = await appPromise;
    // Vercel preserves the original request URL through a rewrite. In
    // particular, /uploads must stay /uploads for Express's static middleware.
    return app(req, res);
  } catch (err: any) {
    appPromise = undefined;
    console.error('[Vercel Serverless Error]:', err);
    return res.status(500).json({
      error: 'Backend initialization failed. Check the Vercel function logs.'
    });
  }
}
