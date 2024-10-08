// src/db/schema.ts

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  varchar,
  index
} from "drizzle-orm/pg-core";

export const networks = pgTable("networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description")
});

export const nodes = pgTable(
  "nodes",
  {
    id: text("id").primaryKey(),
    networkId: integer("network_id").references(() => networks.id),
    type: text("type").notNull(),
    ens: text("ens"),
    userId: text("user_id"),
    identity: text("identity"),
    profileImage: text("profile_image"),
    profileName: text("profile_name"),
    profileDisplayName: text("profile_display_name"),
    profileBio: text("profile_bio"),
    userAddress: text("user_address"),
    chainId: text("chain_id"),
    tecBalance: text("tec_balance"),
    regenScore: integer("regen_score"),
    trustedSeed: boolean("trusted_seed"),
    regenPOAP: boolean("regen_poap"),
    hasFarcaster: boolean("has_farcaster"),
    data: jsonb("data")
  },
  (table) => {
    return {
      networkIdx: index("node_network_idx").on(table.networkId),
      typeIdx: index("node_type_idx").on(table.type)
    };
  }
);

export const links = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").references(() => nodes.id),
    targetId: text("target_id").references(() => nodes.id),
    type: text("type").notNull(),
    data: jsonb("data")
  },
  (table) => {
    return {
      sourceIdx: index("link_source_idx").on(table.sourceId),
      targetIdx: index("link_target_idx").on(table.targetId),
      typeIdx: index("link_type_idx").on(table.type)
    };
  }
);

export const tecHolders = pgTable("tec_holders", {
  id: text("id")
    .primaryKey()
    .references(() => nodes.id),
  balance: text("balance").notNull(),
  pendingBalanceUpdate: text("pending_balance_update")
});

export const regenScores = pgTable("regen_scores", {
  id: text("id")
    .primaryKey()
    .references(() => nodes.id),
  score: integer("score").notNull(),
  address: text("address").notNull(),
  meta: text("meta")
});

export const trustedSeeds = pgTable("trusted_seeds", {
  id: text("id")
    .primaryKey()
    .references(() => nodes.id)
});

export const farcasterConnections = pgTable(
  "farcaster_connections",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").references(() => nodes.id),
    targetId: text("target_id").references(() => nodes.id)
  },
  (table) => {
    return {
      sourceIdx: index("farcaster_source_idx").on(table.sourceId),
      targetIdx: index("farcaster_target_idx").on(table.targetId)
    };
  }
);

export const badgeHolders = pgTable("badge_holders", {
  id: serial("id").primaryKey(),
  attester: text("attester").notNull(),
  recipient: text("recipient")
    .notNull()
    .references(() => nodes.id),
  rpgfRound: text("rpgf_round").notNull(),
  referredBy: text("referred_by").references(() => nodes.id),
  referredMethod: text("referred_method")
});

export const regenPOAPs = pgTable("regen_poaps", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").references(() => nodes.id),
  collection: text("collection").notNull(),
  count: integer("count").notNull()
});

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    networkId: integer("network_id").references(() => networks.id),
    date: timestamp("date").notNull(),
    fromId: text("from_id").references(() => nodes.id),
    toId: text("to_id").references(() => nodes.id),
    tokenName: text("token_name").notNull(),
    tokenSymbol: text("token_symbol").notNull(),
    value: text("value").notNull(),
    hash: varchar("hash", { length: 66 }).notNull()
  },
  (table) => {
    return {
      networkIdx: index("transaction_network_idx").on(table.networkId),
      fromIdx: index("transaction_from_idx").on(table.fromId),
      toIdx: index("transaction_to_idx").on(table.toId)
    };
  }
);

export const refiDAOs = pgTable("refi_daos", {
  id: serial("id").primaryKey(),
  address: text("address")
    .notNull()
    .references(() => nodes.id)
});
