#!/usr/bin/env node
// Generates the `navigation.versions[*]` slice of docs.json from the
// per-version OpenAPI specs in core-api/openapi/versions/<version>/ and
// the shared (non-versioned) tab content in core-api/openapi/nav-shared.json.
//
// Run via `npm run gen:nav`.
//
// File ownership inside docs.json:
//   - `navigation` (entire key): generator-owned, do not hand-edit.
//   - everything else: hand-edited.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VERSIONS_DIR = path.join(REPO_ROOT, "core-api/openapi/versions");
const MANIFEST_PATH = path.join(REPO_ROOT, "core-api/openapi/versions.json");
const SHARED_PATH = path.join(REPO_ROOT, "core-api/openapi/nav-shared.json");
const DOCS_JSON_PATH = path.join(REPO_ROOT, "docs.json");

const SCOPES = ["server", "user", "webhook"];
const HTTP_METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);

const readJSON = async (p) => JSON.parse(await readFile(p, "utf8"));
const writeJSON = async (p, v) => writeFile(p, JSON.stringify(v, null, 2) + "\n");

function specPath(version, scope) {
  return `/core-api/openapi/versions/${version}/${scope}.json`;
}

function specDirectory(version, scope) {
  return `api-reference/${version}/${scope}`;
}

function asyncapiPath(version, name) {
  return `/core-api/openapi/versions/${version}/asyncapi/${name}.json`;
}

function asyncapiDirectory(version, scope, name) {
  return `api-reference/${version}/${scope}/${name}`;
}

function buildScopeGroup(version, scope, spec, navExtras) {
  const cfg = navExtras[scope];
  if (!cfg) throw new Error(`nav-extras missing scope "${scope}" for version ${version}`);

  const labels = cfg.labels || {};
  const untaggedAssign = cfg.untagged_assign || {};
  const regroup = cfg.regroup || {};
  const topLevelSet = new Set(cfg.top_level || []);

  // Collect operations preserving spec path order.
  const ops = [];
  for (const [pathName, methods] of Object.entries(spec.paths || {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      if (typeof op !== "object" || op === null) continue;
      const id = `${method.toUpperCase()} ${pathName}`;
      const srcTag = (op.tags && op.tags[0]) || null;
      ops.push({ id, srcTag });
    }
  }

  // Resolve each op's display group.
  for (const op of ops) {
    if (op.srcTag) {
      op.displayGroup = labels[op.srcTag] || op.srcTag;
    } else if (untaggedAssign[op.id]) {
      op.displayGroup = untaggedAssign[op.id];
    } else if (topLevelSet.has(op.id)) {
      op.displayGroup = null;
    } else {
      throw new Error(
        `Operation ${op.id} in ${scope} (${version}) has no tag and is not in untagged_assign or top_level`
      );
    }
    if (regroup[op.id]) op.displayGroup = regroup[op.id];
  }

  // Split top-level vs grouped.
  const topLevelOps = [];
  const grouped = new Map();
  for (const op of ops) {
    if (topLevelSet.has(op.id)) {
      topLevelOps.push(op.id);
      continue;
    }
    if (!grouped.has(op.displayGroup)) grouped.set(op.displayGroup, []);
    grouped.get(op.displayGroup).push(op.id);
  }

  // Group order: configured first, then any remaining (spec-discovery order).
  const orderedGroups = [];
  const seen = new Set();
  for (const g of cfg.order || []) {
    if (grouped.has(g)) {
      orderedGroups.push(g);
      seen.add(g);
    }
  }
  for (const g of grouped.keys()) {
    if (!seen.has(g)) orderedGroups.push(g);
  }

  // Build the pages array (top-level ops first, then groups).
  const pages = [...topLevelOps];

  for (const groupName of orderedGroups) {
    const opIds = grouped.get(groupName);
    const subgroupSpec = (cfg.subgroups || {})[groupName] || {};

    // Assign ops to sub-groups; remainder stays in the parent.
    const subAssignments = new Map();
    const subClaim = {};
    for (const [subName, subOps] of Object.entries(subgroupSpec)) {
      subAssignments.set(subName, []);
      for (const id of subOps) subClaim[id] = subName;
    }
    const remaining = [];
    for (const id of opIds) {
      if (subClaim[id]) {
        subAssignments.get(subClaim[id]).push(id);
      } else {
        remaining.push(id);
      }
    }

    const groupPages = [...remaining];
    for (const [subName, subOps] of subAssignments) {
      if (subOps.length) groupPages.push({ group: subName, pages: subOps });
    }

    // Append extras (asyncapi sub-groups, cross-link pages).
    for (const extra of (cfg.append || {})[groupName] || []) {
      if (extra.asyncapi) {
        groupPages.push({
          group: extra.group || `WebSocket /${extra.asyncapi}`,
          asyncapi: {
            source: asyncapiPath(version, extra.asyncapi),
            directory: asyncapiDirectory(version, scope, extra.asyncapi),
          },
        });
      } else if (extra.page) {
        groupPages.push(extra.page);
      }
    }

    pages.push({ group: groupName, pages: groupPages });
  }

  return {
    group: cfg.title || scope,
    openapi: {
      source: specPath(version, scope),
      directory: specDirectory(version, scope),
    },
    pages,
  };
}

async function buildApiReferenceTab(version) {
  const navExtras = await readJSON(path.join(VERSIONS_DIR, version, "nav-extras.json"));
  const groups = [];
  for (const scope of SCOPES) {
    const spec = await readJSON(path.join(VERSIONS_DIR, version, `${scope}.json`));
    groups.push(buildScopeGroup(version, scope, spec, navExtras));
  }
  return { tab: "API Reference", groups };
}

function versionLabel(version, manifest) {
  if (version === manifest.current) return `Current (${version})`;
  if (version === manifest.next) return "Next";
  return version;
}

async function buildVersionEntry(version, manifest, shared) {
  const coreApiTabs = [
    shared.coreApi.guidesTab,
    await buildApiReferenceTab(version),
    shared.coreApi.changelogTab,
  ];
  const entry = {
    version: versionLabel(version, manifest),
    products: [
      {
        product: "Core API",
        description: shared.coreApi.description,
        icon: shared.coreApi.icon,
        tabs: coreApiTabs,
      },
      shared.connect,
    ],
  };
  if (version === manifest.current) entry.default = true;
  return entry;
}

async function main() {
  const manifest = await readJSON(MANIFEST_PATH);
  const shared = await readJSON(SHARED_PATH);
  const docs = await readJSON(DOCS_JSON_PATH);

  // Order: current first, then other stable versions in manifest order, then next.
  const ordered = [
    manifest.current,
    ...manifest.stable.filter((v) => v !== manifest.current),
    manifest.next,
  ];

  const versions = [];
  for (const v of ordered) versions.push(await buildVersionEntry(v, manifest, shared));

  docs.navigation = { versions };
  await writeJSON(DOCS_JSON_PATH, docs);

  console.log(`Wrote ${versions.length} versions to docs.json: ${ordered.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
