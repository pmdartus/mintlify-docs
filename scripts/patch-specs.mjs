#!/usr/bin/env node
// Normalize tags on every checked-in OpenAPI spec under core-api/openapi.
//
// Tags themselves don't drive Mintlify navigation in this repo (the
// build-docs-json script materializes pages explicitly from nav.mjs).
// We still set them so that third-party OpenAPI tooling sees consistent
// grouping. Source of truth is scripts/nav.mjs.
//
// Usage:
//   pnpm patch-specs            rewrites files in place
//   pnpm patch-specs --check    exit non-zero if any file is out of sync (CI)
//
// Prototype: once the upstream spec generator emits the same tag shape,
// delete this script.

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { NAV, flattenPathTags, topLevelTags } from "./nav.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENAPI_DIR = path.join(ROOT, "core-api", "openapi");
const SPEC_KINDS = Object.keys(NAV); // ["server", "user", "webhook"]

const args = new Set(process.argv.slice(2));
const checkMode = args.has("--check");

async function listVersionDirs() {
  const entries = await readdir(OPENAPI_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => path.join(OPENAPI_DIR, e.name));
}

function patchSpec(spec, kind) {
  const nav = NAV[kind];
  spec.tags = topLevelTags(nav.pages);

  const tagByKey = new Map(flattenPathTags(nav.pages).map(({ key, tag }) => [key, tag]));

  for (const [pathKey, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of ["get", "post", "put", "patch", "delete", "head", "options"]) {
      const op = pathItem[method];
      if (!op) continue;
      const key = `${method.toUpperCase()} ${pathKey}`;
      const tag = tagByKey.get(key);
      if (tag) op.tags = [tag];
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
  const next = stableStringify(patchSpec(spec, kind));

  if (next === original) return { file, changed: false };
  if (checkMode) return { file, changed: true };
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
        continue;
      }
      results.push(await processFile(file, kind));
    }
  }

  const changed = results.filter((r) => r.changed);
  if (checkMode) {
    if (changed.length > 0) {
      console.error("Specs out of sync with nav. Run `node scripts/patch-specs.mjs`.");
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
