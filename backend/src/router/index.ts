import Router from 'koa-router';
import * as CodeGenController from '../controllers/codeGen';

const router = new Router();

router.prefix('/api/visual-ide');

router.post(
  '/magic-wiring',
  CodeGenController.doMagicWiring
);

router.post(
  '/magic-paint',
  CodeGenController.doMagicPaint
);

router.post(
  '/starter-template',
  CodeGenController.genStarterTemplate
);

export default router;
