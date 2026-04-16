import { Router } from 'express';

const router = Router();

router.get('/', async (_req, res) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Scoreboard route is not yet implemented.',
  });
});

export default router;
