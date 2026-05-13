#!/usr/bin/env node
// Generate docs.json from docs.template.json + core-api/openapi/versions.json.
//
// For each entry in versions.json (plus `next`), this emits an API Reference
// version block that materializes the NAV tree from scripts/nav.mjs against
// the actual paths in that version's spec. The `directory` field on each
// openapi config is namespaced by the version directory, which gives every
// operation a distinct URL like `/<version>/api-reference/server/<slug>`.
//
// Usage:
//   node scripts/build-docs-json.mjs           write docs.json + snippet
//   node scripts/build-docs-json.mjs --check   exit non-zero if stale (CI)

import { readFile, writeFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { NAV } from "./nav.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(ROOT, "docs.template.json");
const MANIFEST = path.join(ROOT, "core-api", "openapi", "versions.json");
const OPENAPI_DIR = path.join(ROOT, "core-api", "openapi");
const OUTPUT = path.join(ROOT, "docs.json");
const SNIPPET = path.join(ROOT, "snippets", "current-version.mdx");

const args = new Set(process.argv.slice(2));
const checkMode = args.has("--check");

function specHasOperation(spec, key) {
  const m = key.match(/^([A-Z]+) (\/.+)$/);
  if (!m) return false;
  const [, method, p] = m;
  return Boolean(spec.paths?.[p]?.[method.toLowerCase()]);
}

function filterPagesForSpec(pages, spec) {
  const out = [];
  for (const entry of pages) {
    if (typeof entry === "string") {
      if (/^[A-Z]+ \//.test(entry)) {
        if (specHasOperation(spec, entry)) out.push(entry);
      } else {
        out.push(entry);
      }
      continue;
    }
    if (entry && typeof entry === "object" && entry.group) {
      const sub = filterPagesForSpec(entry.pages ?? [], spec);
      if (sub.length > 0) out.push({ group: entry.group, pages: sub });
    }
  }
  return out;
}

function buildApiReferenceTab(manifest) {
  const versionsEntries = [];

  versionsEntries.push(buildVersionEntry({
    version: manifest.next.label,
    dir: manifest.next.dir,
    isPreview: true,
  }));

  for (const v of manifest.versions) {
    versionsEntries.push(buildVersionEntry({
      version: v.date,
      dir: v.date,
      isDefault: v.date === manifest.current,
    }));
  }

  return { tab: "API Reference", versions: versionsEntries };
}

function buildVersionEntry({ version, dir, isDefault = false, isPreview = false }) {
  const entry = { version };
  if (isDefault) entry.default = true;
  if (isPreview) entry.tag = "preview";

  entry.groups = [];
  for (const kind of Object.keys(NAV)) {
    const specFile = path.join(OPENAPI_DIR, dir, `${kind}.json`);
    if (!existsSync(specFile)) continue;
    const spec = JSON.parse(readFileSync(specFile, "utf8"));
    const nav = NAV[kind];
    const filtered = filterPagesForSpec(nav.pages, spec);
    if (filtered.length === 0) continue;

    entry.groups.push({
      group: nav.title,
      openapi: {
        source: `core-api/openapi/${dir}/${kind}.json`,
        directory: `${dir}/${nav.directory}`,
      },
      pages: filtered,
    });
  }

  return entry;
}

const GENERATORS = {
  "core-api-versioned-api-reference": buildApiReferenceTab,
};

function expand(node, manifest) {
  if (Array.isArray(node)) return node.map((n) => expand(n, manifest));
  if (node && typeof node === "object") {
    if (typeof node.$generate === "string") {
      const gen = GENERATORS[node.$generate];
      if (!gen) throw new Error(`Unknown generator: ${node.$generate}`);
      return gen(manifest);
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = expand(v, manifest);
    return out;
  }
  return node;
}

function buildSnippet(manifest) {
  return `export const currentVersion = '${manifest.current}';\n`;
}

async function syncFile(target, next) {
  let current = "";
  try {
    current = await readFile(target, "utf8");
  } catch {}
  if (next === current) return { changed: false };
  if (checkMode) return { changed: true };
  await writeFile(target, next);
  return { changed: true };
}

async function main() {
  const template = JSON.parse(await readFile(TEMPLATE, "utf8"));
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));

  const expanded = expand(template, manifest);
  const docsJson = JSON.stringify(expanded, null, 2) + "\n";
  const snippet = buildSnippet(manifest);

  const results = [
    { name: "docs.json", ...(await syncFile(OUTPUT, docsJson)) },
    { name: "snippets/current-version.mdx", ...(await syncFile(SNIPPET, snippet)) },
  ];

  const stale = results.filter((r) => r.changed);
  if (checkMode) {
    if (stale.length > 0) {
      console.error("Generated files are stale. Run `node scripts/build-docs-json.mjs`:");
      for (const r of stale) console.error(`  ${r.name}`);
      process.exit(1);
    }
    console.log("All generated files in sync.");
    return;
  }

  if (stale.length === 0) {
    console.log("Already in sync.");
    return;
  }
  for (const r of stale) console.log(`wrote ${r.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
