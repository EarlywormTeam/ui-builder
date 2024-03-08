import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import errorCatcher from './middleware/errorCatcher';
import requestLogger from './middleware/requestLogger';
import serve from 'koa-static';
import send from 'koa-send';
import path from 'path';

import configuredRouter from './router';
const buildPath = path.join(__dirname, 'build');

const app = new Koa();
app.use(cors({ origin: (req: Koa.Request) => {
  if (!req.header.origin) {
    return '';
  }
  if (process.env.NODE_ENV !== 'production') {
    return req.header.origin; // Reflect the request origin, as it is allowed
  }
  const allowedOrigins = ['http://somethingsecret.xyz', 'https://somethingsecret.xyz', 'http://www.somethingsecret.xyz', 'https://www.somethingsecret.xyz'];
  if (allowedOrigins.includes(req.header.origin)) {
    return req.header.origin; // Reflect the request origin, as it is allowed
  }
  return '';
}}));
app.use(errorCatcher);
app.use(requestLogger);
app.use(bodyParser());
app.use(configuredRouter.routes()).use(configuredRouter.allowedMethods());
app.use(serve(buildPath));
app.use(async (ctx: Koa.Context) => {
  // Catch all GET requests that aren't prefaced with /api
  if (ctx.method === 'GET' && !ctx.url.startsWith('/api')) {
    await send(ctx, 'index.html', { root: buildPath });
  }
});

export default app;
