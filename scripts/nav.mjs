// Single source of truth for the API Reference navigation tree, per spec.
//
// The build script materializes this tree once per API version, filtering
// out operations a given version's spec doesn't contain. Sub-groups
// (e.g. "Bulk operations" under "Dot phrases") nest inside their parent
// just like the original hand-curated docs.json. MDX pages (WebSocket
// reference, dictation commands) sit alongside operations in the same
// sub-group, which is the layout Mintlify's auto-tag-grouping can't
// reproduce on its own.
//
// Format inside each spec's `pages` array:
//   "METHOD /path"           bare operation; included if the spec defines it
//   "core-api/reference/x"   bare MDX page; always included as-is
//   { group, pages }         nested sub-group with the same recursive shape
//
// Top-level entries must be groups (no bare operations at the root), so
// every operation has a parent group whose name doubles as its OpenAPI tag
// (set by scripts/patch-specs.mjs).

export const NAV = {
  server: {
    title: "Server API",
    directory: "api-reference/server",
    pages: [
      { group: "Authentication", pages: ["POST /oauth/token"] },
      {
        group: "Manage users",
        pages: [
          "POST /users",
          "PATCH /users/{user_id}",
          "POST /jwt/authenticate/{user_id}",
          "POST /users/{user_id}/deactivate",
          "POST /users/{user_id}/activate",
          "GET /users",
          "GET /users/{user_id}",
          "GET /users/find_by_external_id/{external_id}",
        ],
      },
      {
        group: "Transcribe",
        pages: [
          "POST /transcribe",
          "POST /transcribe-async",
          "GET /transcribe-async/{id}",
          "core-api/api-reference/server/transcribe-ws",
          // Pre-2024-10-01 only — renamed to /transcribe and /transcribe-async.
          // Covered by core-api/api-versioning/migrating-pre-2024-10-01.mdx.
          // "POST /listen",
          // "POST /listen_async",
          // "POST /copilot/listen",
        ],
      },
      {
        group: "Dictate",
        pages: [
          "POST /dictate",
          "POST /dictate-async",
          "GET /dictate-async/{id}",
          "core-api/api-reference/server/dictate-ws",
          "core-api/reference/dictation-commands",
        ],
      },
      {
        group: "Generate note",
        pages: [
          "POST /generate-note",
          "POST /generate-note-async",
          "GET /generate-note-async/{id}",
          // Pre-2024-10-01 only — renamed to /generate-note and /generate-note-async.
          // "POST /digest",
          // "POST /digest_async",
          // "POST /copilot/digest",
          // "POST /copilot/digest_async",
        ],
      },
      {
        group: "Generate normalized data",
        pages: [
          "POST /generate-normalized-data",
          // Pre-2024-10-01 only — snake_case ancestor.
          // "POST /generate_normalized_data",
        ],
      },
      {
        group: "Generate patient instructions",
        pages: [
          "POST /generate-patient-instructions",
          // Pre-2024-10-01 only — snake_case ancestor.
          // "POST /generate_patient_instructions",
        ],
      },
      { group: "Edit note with instructions", pages: ["POST /edit-note-with-instructions"] },
      { group: "Report feedback", pages: ["POST /reports"] },
    ],
  },

  user: {
    title: "User API",
    directory: "api-reference/user",
    pages: [
      { group: "Authenticate", pages: ["POST /jwt/refresh", "POST /jwt/logout"] },
      {
        group: "User settings",
        pages: [
          "GET /note-settings",
          "PATCH /note-settings",
          "GET /note-settings/note-sections-customization/{note_template}",
          "PATCH /note-settings/note-sections-customization/{note_template}",
        ],
      },
      {
        group: "Transcribe",
        pages: [
          "POST /transcribe",
          "POST /transcribe-async",
          "GET /transcribe-async/{id}",
          "core-api/api-reference/user/transcribe-ws",
          // Pre-2024-10-01 only — renamed to /transcribe and /transcribe-async.
          // Covered by core-api/api-versioning/migrating-pre-2024-10-01.mdx.
          // "POST /listen",
          // "POST /listen_async",
        ],
      },
      {
        group: "Dictate",
        pages: [
          "POST /dictate",
          "POST /dictate-async",
          "GET /dictate-async/{id}",
          "core-api/api-reference/user/dictate-ws",
          "core-api/reference/dictation-commands",
        ],
      },
      {
        group: "Text replacements",
        pages: [
          "GET /text-replacements",
          "GET /text-replacements/{id}",
          "POST /text-replacements",
          "PATCH /text-replacements/{id}",
          "DELETE /text-replacements/{id}",
        ],
      },
      {
        group: "Generate note",
        pages: [
          "POST /generate-note",
          "POST /generate-note-async",
          "GET /generate-note-async/{id}",
          // Pre-2024-10-01 only — renamed to /generate-note and /generate-note-async.
          // "POST /digest",
          // "POST /digest_async",
        ],
      },
      {
        group: "Dot phrases",
        pages: [
          "GET /dot-phrases",
          "GET /dot-phrases/{id}",
          "POST /dot-phrases",
          "PATCH /dot-phrases/{id}",
          "DELETE /dot-phrases/{id}",
          {
            group: "Bulk operations",
            pages: [
              "POST /dot-phrases/bulk-create",
              "POST /dot-phrases/bulk-update",
              "POST /dot-phrases/bulk-delete",
            ],
          },
          // Pre-2024-10-01 only — snake_case ancestor of /dot-phrases.
          // "GET /dot_phrases",
          // "GET /dot_phrases/{id}",
          // "POST /dot_phrases",
          // "PATCH /dot_phrases/{id}",
          // "DELETE /dot_phrases/{id}",
        ],
      },
      {
        group: "Custom dictionary",
        pages: [
          "GET /custom-dictionary-expressions",
          "GET /custom-dictionary-expressions/{id}",
          "POST /custom-dictionary-expressions",
          "PATCH /custom-dictionary-expressions/{id}",
          "DELETE /custom-dictionary-expressions/{id}",
        ],
      },
      {
        group: "Generate normalized data",
        pages: [
          "POST /generate-normalized-data",
          // Pre-2024-10-01 only — snake_case ancestor.
          // "POST /generate_normalized_data",
        ],
      },
      {
        group: "Generate patient instructions",
        pages: [
          "POST /generate-patient-instructions",
          // Pre-2024-10-01 only — snake_case ancestor.
          // "POST /generate_patient_instructions",
        ],
      },
      { group: "Edit note with instructions", pages: ["POST /edit-note-with-instructions"] },
      { group: "Report feedback", pages: ["POST /reports"] },
    ],
  },

  webhook: {
    title: "Receive webhook events",
    directory: "api-reference/webhook",
    pages: [
      { group: "Receive webhook events", pages: ["POST /webhook"] },
    ],
  },
};

// Walks a NAV.<kind>.pages tree and returns every path -> immediate-parent-group
// pairing. Used by patch-specs to set per-operation tags consistently.
export function flattenPathTags(pages, parentGroup = null) {
  const out = [];
  for (const entry of pages) {
    if (typeof entry === "string") {
      if (/^[A-Z]+ \//.test(entry) && parentGroup) {
        out.push({ key: entry, tag: parentGroup });
      }
      continue;
    }
    if (entry && typeof entry === "object" && entry.group) {
      out.push(...flattenPathTags(entry.pages ?? [], entry.group));
    }
  }
  return out;
}

// Top-level tag descriptors derived from NAV. Order is the display order.
export function topLevelTags(pages) {
  const seen = new Set();
  const out = [];
  const visit = (entries) => {
    for (const entry of entries) {
      if (entry && typeof entry === "object" && entry.group) {
        if (!seen.has(entry.group)) {
          seen.add(entry.group);
          out.push({ name: entry.group });
        }
        visit(entry.pages ?? []);
      }
    }
  };
  visit(pages);
  return out;
}
