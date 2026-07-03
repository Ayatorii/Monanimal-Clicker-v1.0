import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { players } from '../lib/schema';
import { requireAuth, AuthedRequest } from '../middlewares/auth';

const router = Router();

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const player = await db.query.players.findFirst({
    where: eq(players.walletAddress, req.walletAddress!),
  });
  return res.json(player);
});

router.post('/progress', requireAuth, async (req: AuthedRequest, res) => {
  const { gameState } = req.body;

  if (typeof gameState !== 'object' || gameState === null || Array.isArray(gameState)) {
    return res.status(400).json({ error: 'invalid game state' });
  }

  // Lesson 10: грубая защита от мусорных/огромных payload
  const size = JSON.stringify(gameState).length;
  if (size > 200_000) {
    return res.status(400).json({ error: 'game state too large' });
  }

  await db.update(players)
    .set({ gameState })
    .where(eq(players.walletAddress, req.walletAddress!));

  return res.json({ ok: true });
});

export default router;