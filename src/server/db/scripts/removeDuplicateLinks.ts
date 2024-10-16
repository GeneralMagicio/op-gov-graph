// File: src/server/db/scripts/removeDuplicateLinks.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "../schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export async function removeDuplicateTECHolderLinks() {
  console.log("Removing duplicate TEC Holder links...");

  // Get all TEC Holder links
  const allLinks = await db
    .select()
    .from(schema.links)
    .where(
      and(
        eq(schema.links.targetId, "TECHolder"),
        eq(schema.links.type, "TECHolder")
      )
    )
    .execute();

  // Group links by sourceId
  const groupedLinks = allLinks.reduce<Record<string, typeof allLinks>>(
    (acc, link) => {
      if (link.sourceId) {
        if (!acc[link.sourceId]) {
          acc[link.sourceId] = [];
        }
        acc[link.sourceId].push(link);
      } else {
        console.warn(
          `Found a link with null sourceId: ${JSON.stringify(link)}`
        );
      }
      return acc;
    },
    {}
  );

  // For each group, keep the first link and delete the rest
  for (const [sourceId, links] of Object.entries(groupedLinks)) {
    if (links.length > 1) {
      const [keep, ...remove] = links;
      for (const link of remove) {
        if (link.id !== undefined) {
          await db
            .delete(schema.links)
            .where(eq(schema.links.id, link.id))
            .execute();
        } else {
          console.warn(
            `Attempted to delete a link without an id: ${JSON.stringify(link)}`
          );
        }
      }
      console.log(`Removed ${remove.length} duplicate links for ${sourceId}`);
    }
  }

  console.log("Finished removing duplicate TEC Holder links");
}

export async function removeDuplicateRegenScoreLinks() {
  console.log("Removing duplicate RegenScore links...");

  // Get all RegenScore links
  const allLinks = await db
    .select()
    .from(schema.links)
    .where(
      and(
        eq(schema.links.targetId, "RegenScore"),
        eq(schema.links.type, "RegenScore")
      )
    )
    .execute();

  // Group links by sourceId
  const groupedLinks = allLinks.reduce<Record<string, typeof allLinks>>(
    (acc, link) => {
      if (link.sourceId) {
        if (!acc[link.sourceId]) {
          acc[link.sourceId] = [];
        }
        acc[link.sourceId].push(link);
      } else {
        console.warn(
          `Found a link with null sourceId: ${JSON.stringify(link)}`
        );
      }
      return acc;
    },
    {}
  );

  // For each group, keep the first link and delete the rest
  for (const [sourceId, links] of Object.entries(groupedLinks)) {
    if (links.length > 1) {
      const [keep, ...remove] = links;
      for (const link of remove) {
        if (link.id !== undefined) {
          await db
            .delete(schema.links)
            .where(eq(schema.links.id, link.id))
            .execute();
        } else {
          console.warn(
            `Attempted to delete a link without an id: ${JSON.stringify(link)}`
          );
        }
      }
      console.log(`Removed ${remove.length} duplicate links for ${sourceId}`);
    }
  }

  console.log("Finished removing duplicate RegenScore links");
}
