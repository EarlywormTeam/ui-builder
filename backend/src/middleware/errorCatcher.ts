import { Middleware } from 'koa';

const errorCatcher: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Error caught by errorCatcher middleware:', error);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }
};

export default errorCatcher;
