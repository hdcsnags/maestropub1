import { Router, type Request, type Response } from 'express';

const router = Router();

router.post('/', async (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Webhook endpoint is not configured yet.',
  });
});

export default router;
