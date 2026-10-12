---
name: share-data
description: >-
  Writes new shared UI components, helper functions, TypeScript types, or external API
  wrappers for WebUtil, and refactors logic duplicated across pdf-tools, image-tools, and
  ai-newsletter into the correct shared location (src/components, src/lib, src/types, or
  src/services) — per PROJECT-RULES.md §2-3 module boundary rules (feature modules must
  never import from each other). Use when the user asks to "tạo shared component",
  "share logic giữa các module", "extract code dùng chung", "reuse code", "tách helper ra
  chung", "tạo type chung", or wants something usable by multiple features. ALSO use
  proactively, unprompted, whenever you're about to write code for one feature module and
  notice the same or near-identical logic/component/type already exists in another
  feature module — don't silently duplicate it or import across module boundaries; route
  it through this skill to extract it to the right shared location first.
---

# Share Data

## What this skill is for

WebUtil's three feature modules (`pdf-tools`, `image-tools`, `ai-newsletter`) must stay
independent — `PROJECT-RULES.md` §3 is explicit that none of them may import from each
other. But real code still needs to be reused: file-size validation, a result/status
card component, a download-blob helper, a shared `ApiResponse<T>` type, a fetch wrapper.
The only place that kind of code is allowed to live is one of four shared homes:

| Kind of code | Lives in |
| --- | --- |
| Shared UI components | `src/components` (`common/` and `ui/` per ARCHITECTURE.md §9) |
| Shared helper functions | `src/lib` |
| Shared TypeScript types | `src/types` |
| External API wrappers | `src/services` |
| AI prompt templates | `src/prompts` (ai-newsletter only consumer today, but lives outside the feature folder per PROJECT-RULES.md §5) |

This skill has two entry points: **writing something new** that's meant to be shared
from the start, and **refactoring something that already got duplicated** into one of
these homes. Both end at the same place — correctly placed, correctly named, imported
by every feature that needs it, duplicated nowhere.

### UI code has an extra source of truth: `docs/ui/ui-conventions.md`

Any time the shared code being written or extracted is UI — a component, a layout
pattern, styling, variants, spacing, color usage — `docs/ui/ui-conventions.md` is
authoritative, in addition to (and more specific than) `PROJECT-RULES.md` §11's general
Tailwind rules. Locate and read it before writing or moving any component:

```text
docs/ui/ui-conventions.md
```

If it can't be found at that path, search the repo for it (it may be nested under a
different docs root depending on the checkout) before falling back to just
PROJECT-RULES.md §11 — and tell the user you couldn't find it, since UI conventions
silently skipped is exactly the kind of inconsistency this skill exists to prevent. If
`ui-conventions.md` and PROJECT-RULES.md §11 ever conflict on something UI-specific
(component variants, spacing scale, color tokens, naming of style props, etc.),
`ui-conventions.md` wins — treat PROJECT-RULES.md §11 as the generic fallback for
anything the UI doc doesn't cover.

This applies in both Step 2 (writing new shared UI) and Step 3 (extracting a UI
component that was duplicated) below.

### A note on search commands and Windows

The steps below show `grep` for finding duplicate or boundary-violating code. `grep`
works as written inside Claude's own Linux sandbox here, regardless of what OS the
person you're talking to is on. But if this skill is followed by an agent running
directly on a local machine (e.g. Claude Code on a plain Windows shell without Git Bash
or WSL), `grep` may not exist. In that case, use whatever cross-platform equivalent is
available instead — `rg` (ripgrep, if installed), the coding tool's own built-in
project-wide search/grep capability, or `findstr` as a last resort on Windows. The intent
of every search step is "find all occurrences of this pattern in these folders" — pick
whatever tool on the current system actually does that.

## Step 1 — Figure out which entry point this is

- **New shared code**: user is asking for something that doesn't exist yet but will be
  used by 2+ features (or is generically useful even if only 1 feature uses it today,
  e.g. a generic `Button` component). Skip to Step 2.
- **Refactor / extraction**: code already exists — either duplicated in two+ feature
  folders, or living inside one feature folder while another feature also needs it (or
  is about to, because you're mid-task writing that other feature and noticed the
  overlap). Skip to Step 3.

If you triggered this skill proactively while implementing a feature (not because the
user asked), say so briefly before proceeding — e.g. "Mình thấy `validateFileSize` y hệt
hàm đã có trong `image-tools`, mình sẽ tách ra `src/lib` trước khi dùng tiếp, ok?" — and
default to proceeding unless the user objects; this is a quick, low-risk cleanup, not a
scope change.

## Step 2 — Writing new shared code

1. **Confirm it's actually generic.** Strip out any feature-specific assumptions before
   writing it. A function pulled mentally from "PDF Tools needs this" should take
   generic params (`file: File`, `maxSizeBytes: number`), not PDF-specific ones
   (`pdfFile: PDFFile`). If the user's request is inherently feature-specific (e.g. "a
   component that shows PDF page thumbnails"), it doesn't belong here — it belongs in
   that feature's own folder instead. Gently flag this back to the user rather than
   forcing a bad abstraction into shared space.

2. **Check it doesn't already exist.** Before creating anything, search `src/lib`,
   `src/components`, `src/types`, and `src/services` for the function/component name and
   close variants of it (`grep -rn` on Unix/Linux, `rg` if available, or your editor's
   project search on Windows without Git Bash/WSL — see the search-commands note above).
   PROJECT-RULES.md §7 explicitly forbids duplicating the same type across modules —
   this applies just as much to helpers and components.

3. **If it's UI, read `docs/ui/ui-conventions.md` first** (see the note above) and design
   the component to match it — variant names, spacing, color tokens, component API shape
   — before writing any markup.

4. **Place it correctly** per the table above, following naming rules from
   PROJECT-RULES.md §16 (kebab-case files, PascalCase components/types, camelCase
   functions/variables) and the TypeScript rules from §7 (no `any`, explicit types on
   public functions).

5. **Write it with the same quality bar as the rest of the project**: clear loading/
   error states if it's a component with async behavior, explicit return types, no
   feature-module imports inside it (a shared file importing from
   `src/features/*` is itself a boundary violation — shared code only depends on other
   shared code, or external packages).

6. **Export it cleanly.** Components and lib functions should be importable the way the
   docs show:

   ```ts
   import { validateFileSize } from "@/lib/file-validation";
   import { Button } from "@/components/ui/button";
   ```

   Avoid default exports for shared utilities — named exports keep refactors and
   cross-feature imports easier to trace.

## Step 3 — Refactoring duplicated code into a shared location

1. **Find every copy.** Don't assume there are only two — search across all three
   feature folders for the suspected duplicate logic (`grep -rln` on Unix/Linux, `rg -l`,
   or editor search on Windows without Git Bash/WSL):

   ```bash
   grep -rln "suspectedDuplicateLogic" src/features
   ```

   Also check whether one feature is already importing from another feature directly
   (an existing boundary violation) — that's a stronger signal it should already have
   been shared, and a stronger reason to fix it now:

   ```bash
   grep -rn "from \"@/features/" src/features/pdf-tools
   grep -rn "from \"@/features/" src/features/image-tools
   grep -rn "from \"@/features/" src/features/ai-newsletter
   ```

2. **If the duplicated code is UI** (a component, a layout pattern, repeated styling),
   read `docs/ui/ui-conventions.md` before writing the merged version — see the note
   above. The extracted version should conform to it even if none of the original
   per-feature copies did.

3. **Reconcile differences before merging.** Duplicated code that grew independently in
   two features often drifted slightly (different param names, one has an edge case the
   other doesn't). Read all copies fully before writing the merged version — don't just
   keep whichever copy you saw first. Make the merged version a superset that handles
   every case the originals handled.

4. **Create the shared version** in the right home (Step 2's table), following the same
   naming/typing rules.

5. **Update every call site** in every feature that used a copy, switching the import to
   the shared path, and delete the old per-feature copies. Don't leave the old copy
   behind "just in case" — that defeats the point and reintroduces the duplication risk
   PROJECT-RULES.md §7 warns about.

6. **Re-check module boundaries are clean afterward**:

   ```bash
   grep -rln "from \"@/features/" src/features/pdf-tools src/features/image-tools src/features/ai-newsletter
   ```

   This should return nothing pointing at a *different* feature folder. If it does, the
   extraction isn't finished yet.

## Step 4 — Verify before reporting done

Scope all checks to only the files this run touched — don't lint or test the whole repo.

- **Lint**: if ESLint is configured, run it on the new/changed files. Fix issues rather
  than reporting success with errors present.
- **Type check**: run `npx tsc --noEmit` (or the project's existing type-check script if
  one exists in `package.json`) and confirm the shared file and all updated call sites
  compile clean.
- **Tests**: if any of the affected logic has tests under `src/__tests__/` (per
  PROJECT-RULES.md §14), run them. If extraction changed a function's location/import
  path, update the test's import path too — don't leave a stale path that silently stops
  testing the real code.

## Step 5 — Report what changed, concisely

Summarize: what was created/moved, where it now lives, which features import it now, and
confirm no feature-to-feature imports remain. Don't re-paste the full file contents back
into chat if the user can already see the diff/file — a short summary plus the file path
is enough, per this project's general preference for concise reporting over walls of
text.