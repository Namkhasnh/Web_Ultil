---
name: add-tool-feature
description: >-
  Vibe-codes a working first version of a specific WebUtil tool feature — e.g. Merge PDF,
  Split PDF, Compress PDF, Remove Watermark, Resize Image, Convert Image, Compress Image,
  Collect News, or Summarize Newsletter — fast, with minimal upfront questions, including
  unit and integration tests, then iterates from feedback. Use whenever the user asks to
  "code tính năng", "implement feature", "làm tool X", "thêm chức năng X", "vibe code
  giúp tôi tính năng X", "viết test cho tính năng X", or names one of the MVP tools from
  PRD.md and wants it built end-to-end (UI + logic + tests, following ARCHITECTURE.md's
  client-side-only PDF/Image rule or server-side API Route rule for AI Newsletter).
  Covers a single tool operation or a whole module depending on what the user asks for.
  Do NOT use this for pure refactors of shared code (use share-data) or for scaffolding
  empty folders only (use init-feature-module) — this skill is for writing the real,
  working feature logic and its tests.
---

# Add Tool Feature

## What this skill is for

This is the "just build it" skill. The user names a feature from `PRD.md` §3 and wants
working code — upload UI, processing logic, result/download UI — fast, in one pass,
without a long back-and-forth first. Get something runnable, show it, then iterate on
real feedback instead of trying to nail every detail before writing a line of code.

This skill doesn't duplicate what other project skills already do — it calls them:

- Folder skeleton missing for the target module? → invoke `init-feature-module` first,
  don't hand-roll folders here.
- About to write a component/helper/type that's generic and reusable across modules
  (or that already exists in another module)? → invoke `share-data` for that piece,
  don't duplicate it inline.
- The feature involves UI? → still follow `docs/ui/ui-conventions.md`, same as the other
  skills.

## Step 1 — Figure out scope from what the user actually said

Don't force a fixed scope. Read the request:

- Named one specific operation ("code Merge PDF") → scope is that one tool.
- Named a whole module ("làm xong PDF Tools đi") → scope is all operations in that
  module's MVP list (Merge, Split, Compress, Remove Watermark for PDF Tools; Resize,
  Convert, Compress for Image Tools; Collect News + Summarize + Generate Newsletter for
  AI Newsletter). For multi-operation scope, still build and show one operation at a
  time rather than dumping all of them at once — vibe coding means short feedback loops,
  not one giant unreviewable commit.

## Step 2 — Quick PRD check (don't block on it)

Check the requested feature against `PRD.md` §3's MVP list:

- **PDF Tools**: Merge, Split, Compress, Remove Watermark
- **Image Tools**: Resize, Convert, Compress
- **AI Newsletter**: Collect News, Summarize News with AI, Generate Newsletter Draft,
  Export Newsletter

If it's on the list, proceed straight to coding — no need to ask permission for
documented MVP work.

If it's **not** on the list (a genuinely new feature, or scope from §4 "Out of Scope"),
don't refuse outright, but don't silently build it either: flag it in one short line —
e.g. "Tính năng này chưa có trong PRD.md (MVP scope) — mình vẫn code nếu bạn xác nhận,
nhưng PRD.md nên được cập nhật sau để khỏi lệch tài liệu." — and wait for a yes before
writing code. If they confirm, proceed; don't keep re-raising it.

## Step 3 — Make sure the skeleton exists, then just start coding

Check whether the target feature folder (`src/features/<module>/`) and its
`components/hooks/lib/types.ts/index.ts` subfolders already exist.

- If missing: invoke the `init-feature-module` skill to scaffold it first (single
  feature module path, not full project init unless the whole project is missing).
- If it already exists: skip straight to Step 4. Don't re-scaffold what's already there.

## Step 4 — Vibe code the first working pass

Don't stop to ask about library choices, exact UI copy, or edge-case handling up front —
pick the sensible, commonly-used default and keep moving; mention the choice briefly in
your summary afterward so the user can redirect if they'd rather use something else.
Reasonable defaults for this stack:

- **PDF Tools**: a browser-compatible PDF library (e.g. `pdf-lib`) run fully client-side.
  Never upload the PDF anywhere — `ARCHITECTURE.md` §4.1 and `PROJECT-RULES.md` §4 are
  explicit that PDF processing must be 100% client-side.
- **Image Tools**: Canvas API / `ImageBitmap`, fully client-side. Same no-upload rule —
  `ARCHITECTURE.md` §4.2.
- **AI Newsletter**: client UI calls an internal API Route (`/api/newsletter/fetch-news`
  or `/api/newsletter/summarize`, exactly as defined in `API-CONTRACTS.md`), which is the
  only place allowed to call Gemini, per `ARCHITECTURE.md` §4.3 and `PROJECT-RULES.md`
  §5. Never call Gemini from a Client Component, never expose `GEMINI_API_KEY` with a
  `NEXT_PUBLIC_` prefix.

For every feature, build the standard slice in one pass:

1. **Types** — in the feature's `types.ts`, matching `DATA-SCHEMA.md` exactly (e.g.
   `PDFProcessResult`, `ImageProcessResult`, `Article`, `NewsletterResult`). Don't invent
   parallel shapes — reuse the documented ones.
2. **Processing logic** — in `lib/`, a pure-ish function doing the actual work
   (`mergePdfFiles()`, `resizeImage()`, etc., per naming in `PROJECT-RULES.md` §16).
3. **Hook** — in `hooks/`, wiring the processing logic to React state
   (`FileProcessingStatus`: idle → validating → ready → processing → done/error).
4. **Components** — in `components/`, split by responsibility (`*Uploader`,
   `*OptionsForm`, `*Result`, `*ErrorMessage` — small and composable, per
   `PROJECT-RULES.md` §8, not one mega-component).
5. **Validation** — per `PROJECT-RULES.md` §13's rules for the relevant module (file
   type/size, page ranges, quality range 0-1, non-empty query/articles, etc.) before any
   processing starts.
6. **Error handling** — short, user-actionable messages per `PROJECT-RULES.md` §12. No
   stack traces, no raw provider errors surfaced to the UI.
7. **Cleanup** — revoke object URLs and clear file state per `PROJECT-RULES.md` §10 when
   a file is removed or processing finishes.

For AI Newsletter specifically, also build the API Route side: validate the request body,
return only the `ApiResponse<T>` shape from `API-CONTRACTS.md` §3, use the right error
code (400/429/500) per the rules table there, and never persist anything.

## Step 5 — Write unit + integration tests for what you just built

Tests are part of "done," not an optional follow-up — write them in the same pass, right
after the implementation, before showing the result. Follow `PROJECT-RULES.md` §14:
test pure functions first, avoid testing implementation details, mock external APIs,
never call the real Gemini API in tests, and only use small fixture files when truly
necessary (prefer constructing minimal `File`/`Blob` objects in-memory over loading real
sample files).

Location: flat under `src/__tests__/`, kebab-case filenames per `PROJECT-RULES.md` §16.
Use `<thing>.test.ts` for unit tests and `<thing>.integration.test.ts` for integration
tests, so the two are easy to tell apart at a glance.

**Unit tests** — cover the pure logic in isolation:

- The core processing function in `lib/` (`mergePdfFiles()`, `resizeImage()`, etc.) —
  happy path plus the edge cases called out in `PROJECT-RULES.md` §13 (e.g. invalid page
  range for split, quality out of `0–1` range for image compress, empty article list for
  newsletter).
- Validation helpers — both pass and fail cases.
- API response helpers (`ok()` / `fail()`) for Newsletter routes.
- Prompt-building functions in `src/prompts/` — assert the prompt contains the expected
  injected content, not snapshot the whole string.

**Integration tests** — cover the pieces working together:

- **PDF Tools / Image Tools**: drive the feature's hook (or the exported processing
  pipeline) end-to-end with one or more in-memory fixture `File` objects — upload →
  validate → process → assert the resulting `PDFProcessResult`/`ImageProcessResult` shape
  and that `FileProcessingStatus` transitions correctly through
  `idle → validating → ready → processing → done` (and `→ error` on a bad input). No
  network calls are involved here since these modules are 100% client-side, so this is
  about wiring, not mocking.
- **AI Newsletter**: test the API Route handler directly (call the exported route
  function with a constructed `Request`, not a real HTTP server) for both endpoints:
  - `fetch-news`: valid query → `200` with `FetchNewsResponse` shape; empty query →
    `400`; simulate the news source throwing → `500` or `429` as appropriate. Mock the
    news client in `src/services/news`, don't hit a real network.
  - `summarize`: valid articles → `200` with `SummarizeNewsletterResponse` shape; empty
    `articles` array → `400`. Mock `src/services/ai/gemini.ts` (`vi.mock(...)` if using
    Vitest) so the test never calls the real Gemini API, per `PROJECT-RULES.md` §14.

If `src/__tests__/` already has a relevant existing file (e.g. `file-validation.test.ts`,
`api-response.test.ts`, `newsletter-validation.test.ts` from the initial scaffold), check
whether your new code is covered by extending that file rather than creating a near-
duplicate one.

## Step 6 — Show it, then iterate fast

After the first pass, give a short summary (what was built, where, any default choices
made, and the tests written) and invite quick feedback rather than a long explanation.
When the user gives feedback, apply it directly and re-show — keep the loop tight. Don't
re-litigate foundational decisions (file structure, library choice) on every iteration
unless the feedback is specifically about that. If feedback changes behavior, update the
matching test(s) in the same edit — don't let tests go stale relative to the code.

## Step 7 — Light verification before calling a pass "done"

Keep this fast, scoped only to files touched in this pass — vibe coding doesn't mean
skipping sanity checks, it means not letting them slow down the loop:

- Type-check the touched files (`npx tsc --noEmit` or the project's script).
- If ESLint is configured, run it on the touched files and fix anything it flags.
- Run the test file(s) you just wrote (and any existing ones covering touched code) —
  e.g. `npx vitest run src/__tests__/<file>.test.ts` — and don't report the pass as done
  until they're green. A red test here means the implementation or the test is wrong;
  fix whichever one is actually incorrect rather than loosening the assertion to pass.

## Step 8 — Module boundary sanity check

Before reporting a feature "working," confirm the new code doesn't import from another
feature's folder (`src/features/<other-module>`) — if the operation needed something
generic, it should have gone through `share-data` into a shared location instead. A
quick search for `from "@/features/` inside the module you just touched, pointing
anywhere outside that module, means something needs to move.