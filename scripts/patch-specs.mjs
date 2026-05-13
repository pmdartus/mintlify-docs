#!/usr/bin/env node
// Normalize tags on every checked-in OpenAPI spec under core-api/openapi.
//
// Drives Mintlify's tag-based auto-grouping in docs.json, replacing the
// per-path navigation list. Source of truth is scripts/tags.mjs. The script
// is idempotent — running twice is a no-op.
//
// Usage:
//   pnpm patch-specs            rewrites files in place
//   pnpm patch-specs --check    exit non-zero if any file is out of sync (CI)
//
// This is a prototype: once the upstream spec generator emits the same tag
// shape, delete this script and scripts/tags.mjs.

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TAG_MAP } from "./tags.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENAPI_DIR = path.join(ROOT, "core-api", "openapi");
const SPEC_KINDS = Object.keys(TAG_MAP); // ["server", "user", "webhook"]

const args = new Set(process.argv.slice(2));
const checkMode = args.has("--check");

async function listVersionDirs() {
  const entries = await readdir(OPENAPI_DIR, { withFileTypes: true });
  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    dirs.push(path.join(OPENAPI_DIR, entry.name));
  }
  return dirs;
}

function patchSpec(spec, kind) {
  const { order, paths: pathTagMap } = TAG_MAP[kind];

  spec.tags = order.map(({ name, description }) => ({ name, description }));

  for (const [pathKey, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of ["get", "post", "put", "patch", "delete", "head", "options"]) {
      const op = pathItem[method];
      if (!op) continue;
      const key = `${method.toUpperCase()} ${pathKey}`;
      const tag = pathTagMap[key];
      if (tag) {
        op.tags = [tag];
      }
    }
  }

  return spec;
}

function stableStringify(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

async function processFile(file, kind) {
  const original = await readFile(file, "utf8");
  const spec = JSON.parse(original);
  const patched = patchSpec(spec, kind);
  const next = stableStringify(patched);

  if (next === original) {
    return { file, changed: false };
  }
  if (checkMode) {
    return { file, changed: true };
  }
  await writeFile(file, next);
  return { file, changed: true };
}

async function main() {
  const versionDirs = await listVersionDirs();
  if (versionDirs.length === 0) {
    console.error(`No version directories under ${OPENAPI_DIR}`);
    process.exit(1);
  }

  const results = [];
  for (const dir of versionDirs) {
    for (const kind of SPEC_KINDS) {
      const file = path.join(dir, `${kind}.json`);
      try {
        await stat(file);
      } catch {
        continue; // a version may legitimately lack a kind (e.g. webhook only post-2024-10-01)
      }
      results.push(await processFile(file, kind));
    }
  }

  const changed = results.filter((r) => r.changed);
  if (checkMode) {
    if (changed.length > 0) {
      console.error("Specs out of sync with tag map. Run `pnpm patch-specs`.");
      for (const r of changed) console.error(`  ${path.relative(ROOT, r.file)}`);
      process.exit(1);
    }
    console.log(`Checked ${results.length} spec files — all in sync.`);
    return;
  }

  for (const r of changed) console.log(`patched ${path.relative(ROOT, r.file)}`);
  console.log(`Patched ${changed.length} of ${results.length} spec files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
