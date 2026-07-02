import { Router } from "express";
import { randomBytes } from "crypto";
import { verifyMessage } from "viem";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { players } from "../lib/schema";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// Шаг 1: клиент запрашивает nonce под свой адрес
router.post("/nonce", async (req, res) => {
  const { walletAddress } = req.body;
  if (
    typeof walletAddress !== "string" ||
    !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)
  ) {
    return res.status(400).json({ error: "invalid wallet address" });
  }

  const address = walletAddress.toLowerCase();
  const nonce = randomBytes(16).toString("hex");

  const existing = await db.query.players.findFirst({
    where: eq(players.walletAddress, address),
  });

  if (existing) {
    await db
      .update(players)
      .set({ nonce })
      .where(eq(players.walletAddress, address));
  } else {
    await db.insert(players).values({ walletAddress: address, nonce });
  }

  res.json({ nonce, message: `Sign in to Monanimal Clicker. Nonce: ${nonce}` });
});

// Шаг 2: клиент присылает подпись, сервер проверяет и выдаёт токен
router.post("/verify", async (req, res) => {
  const { walletAddress, signature } = req.body;
  if (typeof walletAddress !== "string" || typeof signature !== "string") {
    return res.status(400).json({ error: "missing fields" });
  }

  const address = walletAddress.toLowerCase();
  const player = await db.query.players.findFirst({
    where: eq(players.walletAddress, address),
  });

  if (!player || !player.nonce) {
    return res
      .status(400)
      .json({ error: "nonce not found, request a new one" });
  }

  const message = `Sign in to Monanimal Clicker. Nonce: ${player.nonce}`;

  const isValid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) {
    return res.status(401).json({ error: "invalid signature" });
  }

  // nonce одноразовый — сразу гасим, чтобы подпись нельзя было переиспользовать
  await db
    .update(players)
    .set({ nonce: null, lastLoginAt: new Date() })
    .where(eq(players.walletAddress, address));

  const token = jwt.sign({ walletAddress: address }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token, player: { ...player, nonce: undefined } });
});

export default router;
