import Router from 'koa-router';
import * as CodeGenController from '../controllers/codeGenController';

const router = new Router();

router.prefix('/api/visual-ide');

router.post(
  '/magic-wiring',
  CodeGenController.doMagicWiring
);

export default router;
