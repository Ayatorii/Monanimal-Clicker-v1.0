import { Router } from "express";
import { randomBytes } from "crypto";
import { verifyMessage } from "viem";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { players } from "../lib/schema";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

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

  return res.json({
    nonce,
    message: `Sign in to Monanimal Clicker. Nonce: ${nonce}`,
  });
});

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

  let isValid = false;
  try {
    isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return res.status(401).json({ error: "invalid signature" });
  }

  await db
    .update(players)
    .set({ nonce: null, lastLoginAt: new Date() })
    .where(eq(players.walletAddress, address));

  const token = jwt.sign({ walletAddress: address }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return res.json({ token, player: { ...player, nonce: undefined } });
});

export default router;
