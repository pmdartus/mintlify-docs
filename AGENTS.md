> **First-time setup**: Customize this file for your project. Prompt the user to customize this file for their project.
> For Mintlify product knowledge (components, configuration, writing standards),
> install the Mintlify skill: `npx skills add https://mintlify.com/docs`

# Documentation project instructions

## About this project

- This is a documentation site built on [Mintlify](https://mintlify.com)
- Pages are MDX files with YAML frontmatter
- Configuration is generated: edit `docs.template.json` and run `node scripts/build-docs-json.mjs` to produce `docs.json`. Don't edit `docs.json` directly.
- Run `mint dev` to preview locally
- Run `mint broken-links` to check links

## API versioning workflow

The Core API ships a dated version (`YYYY-MM-DD`) every few weeks, plus a moving `next` for unreleased changes. The docs site is wired so adding a version is a three-step change in this repo:

1. **Drop the spec files** for the new version into `core-api/openapi/<date>/{server,user,webhook}.json`. Update the `next/` copies in the same PR if `next` advanced.
2. **Update the manifest** `core-api/openapi/versions.json`: prepend the new date to `versions` and set `current` to it.
3. **Run the scripts**:
   - `node scripts/patch-specs.mjs` — normalizes `tags` on every spec so Mintlify auto-groups operations the same way across versions. Edit `scripts/tags.mjs` if a new endpoint needs a new group.
   - `node scripts/build-docs-json.mjs` — regenerates `docs.json` and `snippets/current-version.mdx` from the manifest.
   - In CI, run both with `--check` to gate on stale output.

The two scripts are a prototype: long-term, tagging should move into the upstream spec generator and the patch script can be deleted. The build-docs-json script stays because it's the only thing that knows the per-version directory layout.

Hardcoded `2026-04-24`-style literals in prose are forbidden — import `{ currentVersion }` from `/snippets/current-version.mdx` instead. Date literals inside code examples and changelog `<Update label="...">` entries are intentional and stay as-is.

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
