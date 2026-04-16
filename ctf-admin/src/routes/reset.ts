import { Router, type Request, type Response } from 'express';

const router = Router();

router.post('/', async (_req: Request, res: Response) => {
  try {
    res.status(501).json({
      ok: false,
      error: 'Reset route is not implemented in this build.',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
