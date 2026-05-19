/**
 * Seed script — creates the 9 team users if they don't exist.
 * Run with: pnpm run seed
 *
 * Idempotent: uses INSERT ... ON CONFLICT DO NOTHING so re-runs are safe.
 * Passwords are hashed with bcrypt (10 rounds) before storage.
 */
import "dotenv/config";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool } from "./pool.js";
import { runMigration } from "./migrate.js";

const USERS: { username: string; password: string; displayName: string }[] = [
  { username: "rodro", password: "rodro1",  displayName: "Rodro"  },
  { username: "mate",  password: "mate12",  displayName: "Mate"   },
  { username: "juli",  password: "juli12",  displayName: "Juli"   },
  { username: "sofi",  password: "sofi12",  displayName: "Sofi"   },
  { username: "gabi",  password: "gabi12",  displayName: "Gabi"   },
  { username: "migue", password: "migue1",  displayName: "Migue"  },
  { username: "vane",  password: "vane12",  displayName: "Vane"   },
  { username: "jesi",  password: "jesi12",  displayName: "Jesi"   },
  { username: "eli",   password: "eli123",  displayName: "Eli"    },
];

const BCRYPT_ROUNDS = 10;

async function seedUsers(): Promise<void> {
  // Ensure tables exist before inserting
  await runMigration();

  const client = await pool.connect();
  try {
    let created = 0;
    let skipped = 0;

    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
      const result = await client.query(
        `INSERT INTO users (username, password_hash, display_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
        [u.username, hash, u.displayName]
      );
      if ((result.rowCount ?? 0) > 0) {
        console.log(`  ✓ Created: ${u.username}`);
        created++;
      } else {
        console.log(`  - Skipped (already exists): ${u.username}`);
        skipped++;
      }
    }

    console.log(`\nSeed complete. Created: ${created}, Skipped: ${skipped}`);
  } finally {
    client.release();
    await pool.end();
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  seedUsers().catch((err) => {
    console.error("Seed failed:", err);
    pool.end().finally(() => process.exit(1));
  });
}
