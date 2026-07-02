import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { players } from "../lib/schema";
import { requireAuth, AuthedRequest } from "../middlewares/auth";

const router = Router();

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const player = await db.query.players.findFirst({
    where: eq(players.walletAddress, req.walletAddress!),
  });
  res.json(player);
});

router.post("/progress", requireAuth, async (req: AuthedRequest, res) => {
  const { balance, clickPower, rank, energy } = req.body;

  // Lesson 10: никогда не доверяй клиенту без проверки типов/границ
  if (
    typeof balance !== "number" ||
    balance < 0 ||
    typeof clickPower !== "number" ||
    clickPower < 1 ||
    typeof rank !== "number" ||
    rank < 0 ||
    typeof energy !== "number" ||
    energy < 0
  ) {
    return res.status(400).json({ error: "invalid progress payload" });
  }

  await db
    .update(players)
    .set({ balance, clickPower, rank, energy })
    .where(eq(players.walletAddress, req.walletAddress!));

  return res.json({ ok: true });
});

export default router;
