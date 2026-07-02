import {
  pgTable,
  serial,
  text,
  bigint,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  nonce: text("nonce"),
  balance: bigint("balance", { mode: "number" }).notNull().default(0),
  clickPower: integer("click_power").notNull().default(1),
  rank: integer("rank").notNull().default(0),
  energy: integer("energy").notNull().default(100),
  lastLoginAt: timestamp("last_login_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
