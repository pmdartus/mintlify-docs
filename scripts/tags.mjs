// Single source of truth for the tag layout applied to every versioned spec.
//
// Each spec defines:
//   - `order`: top-level tags in display order. Each entry becomes an entry
//     in the spec's `tags` array.
//   - `paths`: maps `METHOD /path` to the tag name an operation belongs to.
//     Operations not present in this map are left untouched (so newer or
//     experimental endpoints don't blow up the patch).
//
// Sub-groups in the current docs.json (e.g. "Bulk operations" under "Dot
// phrases") are flattened to sibling tags because OpenAPI 3.0 tags are flat
// and Mintlify auto-grouping follows the same shape. The naming convention
// "Parent — Sub" keeps them adjacent and readable.

export const TAG_MAP = {
  server: {
    order: [
      { name: "Authentication", description: "Authenticate your backend." },
      { name: "Manage users", description: "Provision and manage users." },
      { name: "Transcribe", description: "Convert audio into text." },
      { name: "Dictate", description: "Convert dictation audio into text." },
      { name: "Generate note", description: "Generate clinical notes." },
      { name: "Generate normalized data", description: "Extract FHIR-normalized data." },
      { name: "Generate patient instructions", description: "Generate patient-friendly instructions." },
      { name: "Edit note with instructions", description: "Apply natural-language edits to a note." },
      { name: "Report feedback", description: "Report feedback on API output." },
    ],
    paths: {
      "POST /oauth/token": "Authentication",
      "POST /users": "Manage users",
      "PATCH /users/{user_id}": "Manage users",
      "POST /jwt/authenticate/{user_id}": "Manage users",
      "POST /users/{user_id}/deactivate": "Manage users",
      "POST /users/{user_id}/activate": "Manage users",
      "GET /users": "Manage users",
      "GET /users/{user_id}": "Manage users",
      "GET /users/find_by_external_id/{external_id}": "Manage users",
      "POST /transcribe": "Transcribe",
      "POST /transcribe-async": "Transcribe",
      "GET /transcribe-async/{id}": "Transcribe",
      "POST /dictate": "Dictate",
      "POST /dictate-async": "Dictate",
      "GET /dictate-async/{id}": "Dictate",
      "POST /generate-note": "Generate note",
      "POST /generate-note-async": "Generate note",
      "GET /generate-note-async/{id}": "Generate note",
      "POST /generate-normalized-data": "Generate normalized data",
      "POST /generate-patient-instructions": "Generate patient instructions",
      "POST /edit-note-with-instructions": "Edit note with instructions",
      "POST /reports": "Report feedback",
    },
  },
  user: {
    order: [
      { name: "Authenticate", description: "Refresh or revoke user tokens." },
      { name: "User settings", description: "Per-user note generation preferences." },
      { name: "Transcribe", description: "Convert audio into text." },
      { name: "Dictate", description: "Convert dictation audio into text." },
      { name: "Text replacements", description: "Manage dictation text replacements." },
      { name: "Generate note", description: "Generate clinical notes." },
      { name: "Dot phrases", description: "Manage user-level Dot Phrases." },
      { name: "Dot phrases — Bulk operations", description: "Bulk-manage Dot Phrases (up to 100 per call)." },
      { name: "Custom dictionary", description: "Manage user-level custom dictionary expressions." },
      { name: "Generate normalized data", description: "Extract FHIR-normalized data." },
      { name: "Generate patient instructions", description: "Generate patient-friendly instructions." },
      { name: "Edit note with instructions", description: "Apply natural-language edits to a note." },
      { name: "Report feedback", description: "Report feedback on API output." },
    ],
    paths: {
      "POST /jwt/refresh": "Authenticate",
      "POST /jwt/logout": "Authenticate",
      "GET /note-settings": "User settings",
      "PATCH /note-settings": "User settings",
      "GET /note-settings/note-sections-customization/{note_template}": "User settings",
      "PATCH /note-settings/note-sections-customization/{note_template}": "User settings",
      "POST /transcribe": "Transcribe",
      "POST /transcribe-async": "Transcribe",
      "GET /transcribe-async/{id}": "Transcribe",
      "POST /dictate": "Dictate",
      "POST /dictate-async": "Dictate",
      "GET /dictate-async/{id}": "Dictate",
      "GET /text-replacements": "Text replacements",
      "GET /text-replacements/{id}": "Text replacements",
      "POST /text-replacements": "Text replacements",
      "PATCH /text-replacements/{id}": "Text replacements",
      "DELETE /text-replacements/{id}": "Text replacements",
      "POST /generate-note": "Generate note",
      "POST /generate-note-async": "Generate note",
      "GET /generate-note-async/{id}": "Generate note",
      "GET /dot-phrases": "Dot phrases",
      "GET /dot-phrases/{id}": "Dot phrases",
      "POST /dot-phrases": "Dot phrases",
      "PATCH /dot-phrases/{id}": "Dot phrases",
      "DELETE /dot-phrases/{id}": "Dot phrases",
      "POST /dot-phrases/bulk-create": "Dot phrases — Bulk operations",
      "POST /dot-phrases/bulk-update": "Dot phrases — Bulk operations",
      "POST /dot-phrases/bulk-delete": "Dot phrases — Bulk operations",
      "GET /custom-dictionary-expressions": "Custom dictionary",
      "GET /custom-dictionary-expressions/{id}": "Custom dictionary",
      "POST /custom-dictionary-expressions": "Custom dictionary",
      "PATCH /custom-dictionary-expressions/{id}": "Custom dictionary",
      "DELETE /custom-dictionary-expressions/{id}": "Custom dictionary",
      "POST /generate-normalized-data": "Generate normalized data",
      "POST /generate-patient-instructions": "Generate patient instructions",
      "POST /edit-note-with-instructions": "Edit note with instructions",
      "POST /reports": "Report feedback",
    },
  },
  webhook: {
    order: [
      { name: "Receive webhook events", description: "Endpoint to receive Nabla webhook events." },
    ],
    paths: {
      "POST /webhook": "Receive webhook events",
    },
  },
};
