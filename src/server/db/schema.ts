// src/db/schema.ts

import { TopIssue, VotingPower } from "@/app/graph/types";
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  varchar,
  index,
  pgEnum
} from "drizzle-orm/pg-core";

// Create enum types
export const nodeTypeEnum = pgEnum("node_type", [
  "Citizen",
  "TECHolder",
  "RegenScore",
  "TrustedSeed",
  "RegenPOAP",
  "Delegate"
]);

export const linkTypeEnum = pgEnum("link_type", [
  "FarcasterConnection",
  "BadgeHolderReferral",
  "RegenPOAP",
  "RegenScore",
  "TrustedSeed",
  "CitizenTransaction",
  "TECHolder"
]);

export const networks = pgTable("networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const nodes = pgTable(
  "nodes",
  {
    // Existing fields
    id: text("id").primaryKey(),
    networkId: integer("network_id").references(() => networks.id, {
      onDelete: "cascade"
    }),
    nodeTypes: text("node_types").array().notNull().default([]),
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
    isSpecial: boolean("is_special"),

    // Existing delegate-related fields
    ensAddress: text("ens_address"),
    farcasterUrl: text("farcaster_url"),
    twitterUrl: text("twitter_url"),
    roles: text("roles"),
    ambassadorOf: text("ambassador_of"),
    opRewardsEarned: text("op_rewards_earned"),
    isDelegate: boolean("is_delegate").default(false),
    description: text("description"),
    data: jsonb("data"),

    // New delegate-specific fields from API
    votingPower: jsonb("voting_power").$type<VotingPower | null>(),
    delegateStatement: jsonb("delegate_statement").$type<string | null>(),
    discordUrl: text("discord_url"),
    topIssues: jsonb("top_issues").$type<TopIssue[] | null>(),
    endorsed: boolean("endorsed"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => {
    return {
      networkIdx: index("node_network_idx").on(table.networkId)
    };
  }
);

export const links = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").references(() => nodes.id, {
      onDelete: "cascade"
    }),
    targetId: text("target_id").references(() => nodes.id, {
      onDelete: "cascade"
    }),
    type: linkTypeEnum("type").notNull(),
    data: jsonb("data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
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
  id: text("id").primaryKey(),
  balance: text("balance").notNull(),
  pendingBalanceUpdate: text("pending_balance_update"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const regenScores = pgTable("regen_scores", {
  id: text("id").primaryKey(),
  score: integer("score").notNull(),
  address: text("address").notNull(),
  meta: text("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const trustedSeeds = pgTable("trusted_seeds", {
  id: text("id")
    .primaryKey()
    .references(() => nodes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const farcasterConnections = pgTable(
  "farcaster_connections",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").references(() => nodes.id, {
      onDelete: "cascade"
    }),
    targetId: text("target_id").references(() => nodes.id, {
      onDelete: "cascade"
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
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
    .references(() => nodes.id, { onDelete: "cascade" }),
  rpgfRound: text("rpgf_round").notNull(),
  referredBy: text("referred_by").references(() => nodes.id, {
    onDelete: "cascade"
  }),
  referredMethod: text("referred_method"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const regenPOAPs = pgTable("regen_poaps", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").references(() => nodes.id, { onDelete: "cascade" }),
  collection: text("collection").notNull(),
  count: integer("count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    networkId: integer("network_id").references(() => networks.id, {
      onDelete: "cascade"
    }),
    date: timestamp("date").notNull(),
    fromId: text("from_id").references(() => nodes.id, {
      onDelete: "set null"
    }),
    toId: text("to_id").references(() => nodes.id, { onDelete: "set null" }),
    tokenName: text("token_name").notNull(),
    tokenSymbol: text("token_symbol").notNull(),
    value: text("value").notNull(),
    hash: varchar("hash", { length: 66 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => {
    return {
      networkIdx: index("transaction_network_idx").on(table.networkId),
      fromIdx: index("transaction_from_idx").on(table.fromId),
      toIdx: index("transaction_to_idx").on(table.toId)
    };
  }
);

export const vouches = pgTable(
  "vouches",
  {
    id: serial("id").primaryKey(),
    vouchingAddress: text("vouching_address").notNull(),
    vouchedAddress: text("vouched_address").notNull(),
    vouchNumber: integer("vouch_number").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => {
    return {
      vouchingIdx: index("vouch_vouching_idx").on(table.vouchingAddress),
      vouchedIdx: index("vouch_vouched_idx").on(table.vouchedAddress)
    };
  }
);
