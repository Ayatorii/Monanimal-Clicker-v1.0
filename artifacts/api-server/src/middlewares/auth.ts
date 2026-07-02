import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthedRequest extends Request {
  walletAddress?: string;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing token" });
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as {
      walletAddress: string;
    };
    req.walletAddress = payload.walletAddress;
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired token" });
  }
}
