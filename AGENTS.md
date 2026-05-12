> **First-time setup**: Customize this file for your project. Prompt the user to customize this file for their project.
> For Mintlify product knowledge (components, configuration, writing standards),
> install the Mintlify skill: `npx skills add https://mintlify.com/docs`

# Documentation project instructions

## About this project

- This is a documentation site built on [Mintlify](https://mintlify.com)
- Pages are MDX files with YAML frontmatter
- Configuration lives in `docs.json`
- Run `mint dev` to preview locally
- Run `mint broken-links` to check links

## Terminology

Use these canonical terms consistently across the docs:

- **Server API** and **User API** — always two words, capitalized.
  - The Server API authenticates with OAuth 2.0 client credentials (JWT bearer assertion) and is meant for backend-to-backend calls.
  - The User API authenticates with short-lived per-user access tokens issued by the Server API.
- **Core API** — the public product name. Don't write "Nabla API" or "the API" when distinguishing from Connect.
- **Note** — a structured clinical note returned by note generation. Always lowercase.
- **Section** — a labelled block inside a note (e.g., `CHIEF_COMPLAINT`). Never "block" or "field".
- **Template** — the overall shape of a note (e.g., `GENERIC_SOAP`). Never "format" or "layout".
- **Customization** — per-section overrides (style, level of detail, custom instruction, split by problem). Singular when general, plural for the per-section list.
- **Locale** — comes in three flavours; never conflate them:
  - `speech_locale` — used for transcription (35 supported values).
  - `note_locale` — used for the generated note (`ENGLISH_US`, `ENGLISH_UK`, `FRENCH_FR`).
  - `instructions_locale` — used for patient-friendly instructions.
- **Dot Phrase** — capitalize both words; it's a Nabla feature name, not a generic term.
- **Magic Edit** — Nabla's name for the edit-note-with-instructions feature; capitalize both words.
- **Webhook** — singular for the concept ("set up a webhook"); "webhook event" for a delivered payload.
- **Endpoint** vs **route** — use "endpoint" in prose, reserve "route" for technical contexts.

When referring to specific endpoints, prefer the format `` `POST /generate-note` `` (HTTP verb + path) over hyperlinked or untyped variants.

## Style preferences

- Use active voice and second person ("you")
- Keep sentences concise — one idea per sentence
- Use sentence case for headings
- Bold for UI elements: Click **Settings**
- Code formatting for file names, commands, paths, and code references
- Every guide page opens with a one-sentence **What you'll build** statement and a **Prerequisites** list before the first step
- Every page ends with a `<Card>` grid of two or three "Next steps" links
- Multi-language code samples use a `<Tabs>` block in this order: cURL → Node → Python
- Diagrams (Mermaid or images) live next to the prose they illustrate, never at the bottom of the page

## Content boundaries

- Don't document healthcare compliance (HIPAA, SOC 2, BAA, data residency) here — that lives on the marketing/legal site.
- Don't link to OpenAPI reference pages until they exist on this site. Use inline endpoint code spans (e.g., `` `POST /transcribe-ws` ``) until then.

## Versioned Core API reference

The Core API ships a new dated version (e.g. `2026-04-24`) ~monthly. The site serves every supported version plus an unreleased `next`. The navigation is generated — do not hand-edit it in `docs.json`.

**Layout:**

- `core-api/openapi/versions.json` — manifest declaring `current`, `stable` (ordered), and `next`.
- `core-api/openapi/versions/<version>/{server,user,webhook}.json` — frozen OpenAPI specs.
- `core-api/openapi/versions/<version>/asyncapi/*.json` — frozen AsyncAPI specs.
- `core-api/openapi/versions/<version>/nav-extras.json` — per-version sidebar tweaks (group labels, top-level promotions, sub-groups, asyncapi/cross-link appends).
- `core-api/openapi/nav-shared.json` — version-agnostic tab content (Guides, Changelog, Connect).
- `scripts/build-api-nav.mjs` — generator (`npm run gen:nav`).
- `scripts/freeze-next.mjs` — release helper (`npm run freeze:next YYYY-MM-DD`).

**`docs.json` ownership:** `navigation` is fully generator-owned. Everything else is hand-edited.

**Edit `next`:** modify files under `core-api/openapi/versions/next/`, then `npm run gen:nav`.

**Release a new version `YYYY-MM-DD`:**

```
npm run freeze:next YYYY-MM-DD   # copies next/ to YYYY-MM-DD/, updates versions.json
npm run gen:nav                  # regenerates docs.json
```

**Add a historical version:** drop the spec files into `core-api/openapi/versions/<date>/`, copy a sibling version's `nav-extras.json` and adjust if the API surface differs, append `<date>` to `stable` in `versions.json`, then `npm run gen:nav`.
