---
name: init-feature-module
description: Scaffolds WebUtil's base project folder structure, or a single new feature module folder under src/features/, exactly as defined in this project's ARCHITECTURE.md and PROJECT-RULES.md. Use this whenever the user asks to init/khởi tạo the project, set up the base folder structure, scaffold, bootstrap, or "tạo cấu trúc thư mục", "thêm module mới", "thêm feature module", "init dự án theo docs" — basically any request to create the skeleton folders/files for WebUtil before writing real implementation code. This skill ONLY creates empty folders and placeholder files (no business logic, no UI code, no real implementation) — if the user wants actual feature code written, this skill sets the stage but does not do that part.
---

# Init Feature Module

## What this skill is for

WebUtil's docs (`ARCHITECTURE.md`, `PROJECT-RULES.md`, `PRD.md`, `API-CONTRACTS.md`,
`DATA-SCHEMA.md`) define a strict, opinionated project structure: a single Next.js
monolith with independent feature modules, no backend, no database, no auth. The whole
point of this structure is to keep the three modules (`pdf-tools`, `image-tools`,
`ai-newsletter`) decoupled and to keep shared code in the right shared folders.

It's easy for a new structure to drift from the docs when folders get created ad hoc
while someone is mid-feature. This skill exists to create the skeleton **first**, exactly
matching the docs, before any real code is written — so the structure is never the thing
that's wrong.

This skill never writes business logic, UI markup, API handlers, or anything that would
count as "real" implementation. Every file it creates is either empty, a `.gitkeep`, or a
one-line placeholder (`export {};` or a `// TODO` comment pointing at the relevant doc
section). If the user wants implementation code, that's a separate task — say so and stop
once the skeleton is in place.

## Step 1 — Always ask the user what scope they want first

Don't guess this. Ask directly, something like:

> "Bạn muốn mình (a) khởi tạo toàn bộ base structure của project (dùng cho lần setup đầu
> tiên), hay (b) chỉ tạo thêm 1 feature module mới (project đã có sẵn structure rồi)?"

If the user picks (b), also ask for the module name. Don't proceed until you have an
answer — even if the user's original phrasing sounded like it implied one or the other,
confirm explicitly, because the two operations touch very different parts of the tree and
getting it wrong means cleaning up files that shouldn't exist.

## Step 2 — Confirm the project root and re-check the docs

Find the project root (where `package.json` lives). Then check whether
`docs/ARCHITECTURE.md` and `docs/PROJECT-RULES.md` (or wherever this project's docs live)
exist on disk and are reachable.

- If they exist, read them. They are the source of truth — if anything in them has
  diverged from `references/target-structure.md` in this skill, the live docs win. Treat
  a mismatch as a signal the cached reference is stale, not as a reason to ignore the
  docs.
- If they can't be found, fall back to `references/target-structure.md` (a cached copy of
  the same structure) and mention to the user that you couldn't locate the live docs, so
  they know you're working from the cached version.

## Step 3a — Full project init

Only the documented modules from `PRD.md` (`pdf-tools`, `image-tools`, `ai-newsletter`)
get scaffolded by this path — see `references/target-structure.md` for the complete tree.

Run:

```bash
node scripts/init-project-structure.mjs <project-root>
```

The scripts are plain Node.js (no shell syntax, no external deps), so they run the same
way on Windows, macOS, and Linux — no need to check whether the user has Bash, Git Bash,
WSL, or PowerShell available. Since this is a Next.js project, Node is already a
guaranteed dependency.

This is idempotent — it never overwrites a file that already exists, so it's safe to run
on a project that's partially set up. It only fills in what's missing.

## Step 3b — Single new feature module

First, validate the module name against `PRD.md`'s documented modules
(`pdf-tools`, `image-tools`, `ai-newsletter`). If the requested name is **not** one of
these:

- Stop and tell the user this module isn't in the documented MVP scope.
- Point to PROJECT-RULES.md §1: "New features must not be added unless they are
  documented first" and PRD.md §10: "Any new feature must be documented before
  implementation."
- Ask whether `PRD.md` should be updated first, or whether they actually meant one of the
  three existing modules. Only proceed once they've confirmed they want to add an
  undocumented module on purpose (e.g. they're about to update the PRD themselves).

Once confirmed, run:

```bash
node scripts/init-feature-module.mjs <module-name-kebab-case> <project-root>
```

The script itself rejects names that aren't kebab-case (per PROJECT-RULES.md §16), so a
bad name fails fast with a clear error rather than creating something inconsistent.

## Step 4 — Verify before reporting done

Don't tell the user the scaffold is "done" until you've checked it doesn't break the
project's tooling. Both scripts print a final line like:

```text
CREATED_TS_FILES_JSON=["src/lib/download.ts","src/features/pdf-tools/types.ts",...]
```

Use that list to scope the checks below to only what this run actually touched — don't
lint or test the whole repo, since unrelated pre-existing issues aren't this skill's job
to surface or fix.

**Lint check:**

- Look for an ESLint config (`eslint.config.*`, `.eslintrc*`) and `eslint` in
  `node_modules/.bin` or `package.json`.
- If found, run `npx eslint <the created .ts/.tsx files>` and read the output.
- If ESLint isn't installed/configured yet (common right after `init-project-structure`
  on a brand-new repo, before `npm install`), skip the check and say so plainly — don't
  pretend it passed.
- If lint errors show up, don't report success. Fix the placeholder content (it should
  always be trivial — `export {};` or a `describe.todo(...)` stub — so an error here
  usually means something about the project's lint config is stricter than expected,
  e.g. it forbids empty files or requires a specific import order) and re-run.

**Test check:**

- Check `package.json` for a `"test"` script (e.g. Vitest, per `vitest.config.mts` in
  ARCHITECTURE.md §9).
- If present, run it. The placeholder test files created by `init-project-structure`
  (`src/__tests__/file-validation.test.ts`, `api-response.test.ts`,
  `newsletter-validation.test.ts`, per PROJECT-RULES.md §14) use `describe.todo(...)`, so
  they should report as pending/todo, not failing — confirm that's what happens rather
  than assuming it.
- If no test script exists yet, skip and say so — don't invent one. Writing real test
  *content* isn't this skill's job (there's no logic yet to test); the only test-related
  work here is making sure the recommended test file skeleton exists and that running the
  existing test command doesn't crash because of what was just scaffolded.

## Step 5 — Show the result, don't narrate the rules back as a wall of text

After running either script, show the user the resulting tree for what was touched
(`find src/features/<module> -type f` or similar — keep it scoped, not the whole repo)
and a one-line summary of what was created vs. already existed. Briefly remind them this
is skeleton only — no logic was written — and that:

- Modules must not import from each other.
- Shared code belongs in `src/components`, `src/lib`, `src/types`, `src/services`,
  `src/prompts` — not duplicated inside a feature folder.

Don't re-paste the full rule set from `references/target-structure.md` into the chat —
that file is for your own reference while scaffolding, not something the user needs
repeated at them every time.

## Reference

`references/target-structure.md` has the full target tree, the feature-module pattern,
module boundary rules, and naming rules, cached from this project's docs. Read it before
running either script if you need to double check exact paths or file names.
