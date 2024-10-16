// File: src/server/db/scripts/removeDuplicateLinks.ts

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import * as schema from "../schema";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

/**
 * Removes duplicate links across all link types.
 * For each combination of type, sourceId, and targetId, only one link is retained.
 */
export async function removeDuplicateLinks() {
  console.log("Removing duplicate links...");

  try {
    // Fetch all links from the database
    const allLinks = await db.select().from(schema.links).execute();

    // Group links by a combination of type, sourceId, and targetId
    const groupedLinks = allLinks.reduce<Record<string, typeof allLinks>>(
      (acc, link) => {
        if (link.sourceId && link.type && link.targetId) {
          const key = `${link.type}_${link.sourceId}_${link.targetId}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(link);
        } else {
          console.warn(
            `Found a link with null type, sourceId, or targetId: ${JSON.stringify(
              link
            )}`
          );
        }
        return acc;
      },
      {}
    );

    const duplicatesToDelete: number[] = [];

    // Identify duplicates
    for (const [key, links] of Object.entries(groupedLinks)) {
      if (links.length > 1) {
        const [keep, ...remove] = links;
        remove.forEach((link) => {
          if (link.id !== undefined) {
            duplicatesToDelete.push(link.id);
          } else {
            console.warn(
              `Attempted to delete a link without an id: ${JSON.stringify(
                link
              )}`
            );
          }
        });
        console.log(`Found ${remove.length} duplicate link(s) for key: ${key}`);
      }
    }

    if (duplicatesToDelete.length > 0) {
      // Batch delete duplicates
      await db
        .delete(schema.links)
        .where(inArray(schema.links.id, duplicatesToDelete))
        .execute();

      console.log(
        `Deleted ${duplicatesToDelete.length} duplicate link(s) successfully.`
      );
    } else {
      console.log("No duplicate links found.");
    }

    console.log("Finished removing duplicate links.");
  } catch (error) {
    console.error("Error while removing duplicate links:", error);
  } finally {
    await sql.end();
  }
}
