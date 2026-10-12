---
name: fix-bug
description: >-
  Diagnoses and fixes a bug the user explicitly reports in WebUtil — a thrown error, a
  pasted stack trace/console error, a feature behaving incorrectly ("lỗi này", "fix bug
  X", "tại sao cái này không hoạt động", "bị lỗi khi..."), or anything described as
  broken rather than missing. Always investigates root cause before changing code, fixes
  fast once the cause is confirmed, then adds or updates a regression test. Do NOT use
  this proactively when nothing was reported broken — for building a feature that doesn't
  exist yet, use add-tool-feature instead; this skill is strictly reactive to a reported
  problem.
---

# Fix Bug

## What this skill is for

This is strictly reactive — only trigger it when the user has actually told you
something is broken. Don't go looking for bugs unprompted as part of this skill (that's
a different, much riskier kind of work); just fix what was reported.

The shape of the work is: investigate first, fix fast once you know the real cause, then
lock it in with a test. Skipping the investigation step to fix faster usually backfires
— it's easy to patch a symptom in the wrong file and have the bug resurface somewhere
else, which costs more total time than spending a few minutes finding the actual cause
first.

## Step 1 — Make sure you actually have enough to investigate

You need at least one of: an error message/stack trace, a clear description of expected
vs. actual behavior, or reproduction steps. If the report is too vague to act on (e.g.
just "nó bị lỗi" with no detail), ask one focused question rather than guessing — don't
burn a fix attempt on a guess when a 10-second clarification would target it correctly.

## Step 2 — Find the root cause before touching any code

This step is mandatory, even for fixes that look obvious — the obvious-looking cause is
wrong often enough that skipping this step costs more time than it saves.

1. **Reproduce the path mentally (or in code) first.** Read the actual file(s) involved
   — don't fix from memory of what the code probably does. If the bug involves a
   multi-step flow (e.g. a PDF Tools operation, an AI Newsletter request), trace it
   following `ARCHITECTURE.md` §6's documented data flow for that module, and compare
   what *should* happen at each step against what the code *actually* does.

2. **Check whether the bug is actually a project-rule violation surfacing as a symptom.**
   Common patterns in this codebase:
   - A "file too large" or hang on big files in PDF/Image Tools → check whether
     processing is actually 100% client-side (`PROJECT-RULES.md` §4) or something is
     accidentally routing through a server call.
   - Newsletter errors leaking unhelpful messages → check whether the API Route is
     following the `ApiResponse<T>` / error-code rules in `API-CONTRACTS.md` §3-4
     instead of surfacing a raw provider error.
   - A value missing or `undefined` unexpectedly → check whether the type in play matches
     `DATA-SCHEMA.md` exactly, or whether something built a parallel/duplicate shape that
     drifted (`PROJECT-RULES.md` §7).
   - Behavior that's correct in one module but broken in an equivalent spot in another →
     check for a feature-to-feature import or duplicated-and-diverged logic
     (`PROJECT-RULES.md` §3) — if so, the real fix may belong in `share-data`, not here
     (see Step 3's note).
   - Stale state after removing/re-uploading a file → check the file lifecycle/cleanup
     rules (`PROJECT-RULES.md` §10) — likely a missed `URL.revokeObjectURL` or state
     reset.

3. **State the root cause in one sentence before fixing.** If you can't state it
   precisely, you haven't found it yet — keep tracing rather than fixing the first
   suspicious-looking line.

## Step 3 — Fix it directly

Once the cause is confirmed, make the minimal correct change at the actual source of the
problem — not a defensive patch at the symptom site that leaves the root cause intact.

- **If the bug is UI-related** (visual glitch, wrong styling, broken layout/responsive
  behavior, inconsistent component look), check `docs/ui/ui-conventions.md` before
  changing any markup/styles — the fix should bring the UI in line with that doc, not
  just silence the visible symptom in a way that drifts further from it.
- **If the real fix requires touching shared code** (`src/components`, `src/lib`,
  `src/types`, `src/services`) and the bug actually stems from divergence between
  per-module copies, route that part through the `share-data` skill rather than patching
  one copy and leaving the others still wrong.
- **Don't introduce a new module-boundary violation while fixing.** A quick fix that
  makes `pdf-tools` import something from `image-tools` (or similar) is trading one bug
  for a rule violation — extract to a shared location instead if that's what the fix
  actually needs.
- Keep the diff scoped to the bug. Resist drive-by refactoring unrelated code in the same
  pass — that's a separate, separately-reviewable change.

## Step 4 — Add or update a regression test

After the fix works, lock it in so the same bug can't silently come back. Follow
`PROJECT-RULES.md` §14's testing rules (mock external APIs, never call the real Gemini
API in tests, keep fixtures minimal) and the same file convention as other skills in this
project: flat under `src/__tests__/`, kebab-case, `<thing>.test.ts` for a unit-level
regression case.

- If a test file already covers this area, add a case to it that exercises exactly the
  broken scenario (the specific input/state that triggered the bug) and asserts the
  correct behavior.
- If nothing covers this area yet, create a minimal new test file for it.
- The test should fail against the pre-fix logic and pass against the fixed logic in
  principle — you don't need to literally check out the old code to prove this, but think
  it through: if the assertion would also have passed against the buggy version, it's not
  actually testing the fix.

## Step 5 — Verify before reporting fixed

Scoped to the files touched in this fix:

- Type-check (`npx tsc --noEmit` or the project's script).
- Lint if configured, and fix anything flagged.
- Run the regression test plus any existing tests covering the same file(s) —
  `npx vitest run <path>` — confirm everything is green. A fix isn't done until its own
  test passes and it hasn't broken neighboring tests.
- If the fix touched module boundaries or shared code, do the same cross-feature import
  check used in `add-tool-feature`/`share-data` (`from "@/features/<other-module>"`
  shouldn't appear outside its own module).

## Step 6 — Report concisely

State: the root cause (one or two sentences), what was changed and where, and that the
regression test now covers it. Skip re-explaining the whole investigation trace unless
the user asks — they need the conclusion and the fix, not the full diagnostic transcript.