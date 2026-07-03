import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  nonce: text('nonce'),
  gameState: jsonb('game_state'),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});