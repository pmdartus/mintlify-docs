#!/usr/bin/env node
// Generate docs.json from docs.template.json + core-api/openapi/versions.json.
//
// The template carries everything except the parts that fan out per API
// version. Each generator placeholder has the shape:
//   { "$generate": "<id>" }
// and is replaced by the matching expansion below.
//
// Usage:
//   pnpm build-docs-json           write docs.json
//   pnpm build-docs-json --check   exit non-zero if docs.json is stale (CI)

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = path.join(ROOT, "docs.template.json");
const MANIFEST = path.join(ROOT, "core-api", "openapi", "versions.json");
const OUTPUT = path.join(ROOT, "docs.json");
const SNIPPET = path.join(ROOT, "snippets", "current-version.mdx");

const args = new Set(process.argv.slice(2));
const checkMode = args.has("--check");

// Each version block produces a Mintlify version entry containing the
// Core API "API Reference" tab. The Server / User / Webhooks groups
// auto-generate their pages from the spec's tags (configured by
// scripts/patch-specs.mjs), so we don't list endpoints here.
//
// SCHEMA NOTE: Mintlify's `versions` array is consumed inside `navigation`.
// We attach it to the API Reference tab via a `versions` property so the
// dropdown only swaps API Reference content. If Mintlify's resolver
// expects `versions` higher up the tree, move the array up — the data
// shape stays the same.
function buildApiReferenceTab(manifest) {
  const entries = [];

  entries.push(buildVersionEntry({
    version: manifest.next.label,
    dir: manifest.next.dir,
    isPreview: true,
  }));

  for (const v of manifest.versions) {
    entries.push(buildVersionEntry({
      version: v.date,
      dir: v.date,
      isDefault: v.date === manifest.current,
    }));
  }

  return {
    tab: "API Reference",
    versions: entries,
  };
}

function buildVersionEntry({ version, dir, isDefault = false, isPreview = false }) {
  const entry = { version };
  if (isDefault) entry.default = true;
  entry.groups = [
    {
      group: "Server API",
      openapi: { source: `core-api/openapi/${dir}/server.json` },
      pages: ["core-api/api-reference/server/transcribe-ws", "core-api/api-reference/server/dictate-ws"],
    },
    {
      group: "User API",
      openapi: { source: `core-api/openapi/${dir}/user.json` },
      pages: ["core-api/api-reference/user/transcribe-ws", "core-api/api-reference/user/dictate-ws"],
    },
    {
      group: "Receive webhook events",
      openapi: { source: `core-api/openapi/${dir}/webhook.json` },
    },
  ];
  if (isPreview) entry.tag = "preview";
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
  } catch {
    // first run
  }
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
    { name: "docs.json", target: OUTPUT, ...(await syncFile(OUTPUT, docsJson)) },
    { name: "snippets/current-version.mdx", target: SNIPPET, ...(await syncFile(SNIPPET, snippet)) },
  ];

  const stale = results.filter((r) => r.changed);
  if (checkMode) {
    if (stale.length > 0) {
      console.error("Generated files are stale. Run `pnpm build-docs-json`:");
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
