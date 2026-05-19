/**
 * Copies ../_content_desktop/ -> src/content/tracks/ before builds.
 * Run manually or as part of "pnpm build".
 */
import { cp, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../_content_desktop/tracks");
const dest = resolve(__dirname, "src/content/tracks");

await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`Copied content: ${src} → ${dest}`);
