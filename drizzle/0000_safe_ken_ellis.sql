DO $$ BEGIN
 CREATE TYPE "public"."link_type" AS ENUM('FarcasterConnection', 'BadgeHolderReferral', 'RegenPOAP', 'RegenScore', 'TrustedSeed', 'CitizenTransaction', 'TECHolder');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."node_type" AS ENUM('Citizen', 'TECHolder', 'RegenScore', 'TrustedSeed', 'RegenPOAP', 'Delegate');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "badge_holders" (
	"id" serial PRIMARY KEY NOT NULL,
	"attester" text NOT NULL,
	"recipient" text NOT NULL,
	"rpgf_round" text NOT NULL,
	"referred_by" text,
	"referred_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "farcaster_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text,
	"target_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "links" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text,
	"target_id" text,
	"type" "link_type" NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "networks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"network_id" integer,
	"type" "node_type" NOT NULL,
	"node_types" text[] DEFAULT '{}' NOT NULL,
	"ens" text,
	"user_id" text,
	"identity" text,
	"profile_image" text,
	"profile_name" text,
	"profile_display_name" text,
	"profile_bio" text,
	"user_address" text,
	"chain_id" text,
	"tec_balance" text,
	"regen_score" integer,
	"trusted_seed" boolean,
	"regen_poap" boolean,
	"has_farcaster" boolean,
	"is_special" boolean,
	"ens_address" text,
	"farcaster_url" text,
	"twitter_url" text,
	"roles" text,
	"ambassador_of" text,
	"op_rewards_earned" text,
	"is_delegate" boolean DEFAULT false,
	"description" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regen_poaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_id" text,
	"collection" text NOT NULL,
	"count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regen_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"score" integer NOT NULL,
	"address" text NOT NULL,
	"meta" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tec_holders" (
	"id" text PRIMARY KEY NOT NULL,
	"balance" text NOT NULL,
	"pending_balance_update" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_id" integer,
	"date" timestamp NOT NULL,
	"from_id" text,
	"to_id" text,
	"token_name" text NOT NULL,
	"token_symbol" text NOT NULL,
	"value" text NOT NULL,
	"hash" varchar(66) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trusted_seeds" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "badge_holders" ADD CONSTRAINT "badge_holders_recipient_nodes_id_fk" FOREIGN KEY ("recipient") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "badge_holders" ADD CONSTRAINT "badge_holders_referred_by_nodes_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "farcaster_connections" ADD CONSTRAINT "farcaster_connections_source_id_nodes_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "farcaster_connections" ADD CONSTRAINT "farcaster_connections_target_id_nodes_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "links" ADD CONSTRAINT "links_source_id_nodes_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "links" ADD CONSTRAINT "links_target_id_nodes_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_network_id_networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "regen_poaps" ADD CONSTRAINT "regen_poaps_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_network_id_networks_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_id_nodes_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."nodes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_id_nodes_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."nodes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trusted_seeds" ADD CONSTRAINT "trusted_seeds_id_nodes_id_fk" FOREIGN KEY ("id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "farcaster_source_idx" ON "farcaster_connections" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "farcaster_target_idx" ON "farcaster_connections" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "link_source_idx" ON "links" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "link_target_idx" ON "links" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "link_type_idx" ON "links" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_network_idx" ON "nodes" USING btree ("network_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_type_idx" ON "nodes" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_network_idx" ON "transactions" USING btree ("network_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_from_idx" ON "transactions" USING btree ("from_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_to_idx" ON "transactions" USING btree ("to_id");