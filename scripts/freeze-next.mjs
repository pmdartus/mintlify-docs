#!/usr/bin/env node
// Freezes core-api/openapi/versions/next/ into a new dated version.
//
// Usage: node scripts/freeze-next.mjs 2026-05-22
//
// Steps:
//   1. Copies versions/next/ -> versions/<date>/ (errors if target exists).
//   2. Updates core-api/openapi/versions.json: prepends <date> to `stable`,
//      sets `current` = <date>. `next` keeps pointing at versions/next/, which
//      remains in place as the new editing target.
//
// You must run `npm run gen:nav` afterwards to refresh docs.json.

import { cp, readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERSIONS_DIR = path.join(REPO_ROOT, "core-api/openapi/versions");
const MANIFEST_PATH = path.join(REPO_ROOT, "core-api/openapi/versions.json");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const date = process.argv[2];
  if (!date || !DATE_RE.test(date)) {
    console.error("Usage: node scripts/freeze-next.mjs YYYY-MM-DD");
    process.exit(1);
  }

  const src = path.join(VERSIONS_DIR, "next");
  const dest = path.join(VERSIONS_DIR, date);

  if (!(await exists(src))) {
    console.error(`Source ${src} does not exist`);
    process.exit(1);
  }
  if (await exists(dest)) {
    console.error(`Target ${dest} already exists; refusing to overwrite`);
    process.exit(1);
  }

  await cp(src, dest, { recursive: true });

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  if (manifest.stable.includes(date)) {
    console.error(`Version ${date} already in manifest.stable`);
    process.exit(1);
  }
  manifest.stable = [date, ...manifest.stable];
  manifest.current = date;
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`Froze versions/next/ -> versions/${date}/`);
  console.log(`Set current=${date}, prepended to stable.`);
  console.log("Next steps:");
  console.log("  1. Update versions/next/ specs for ongoing work.");
  console.log("  2. Run `npm run gen:nav` to regenerate docs.json.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
