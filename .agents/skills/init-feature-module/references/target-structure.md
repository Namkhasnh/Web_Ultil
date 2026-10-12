# Target structure (source of truth: ARCHITECTURE.md §9, PROJECT-RULES.md §2-3)

This is a cached copy for quick reference. If the project's `docs/ARCHITECTURE.md` or
`docs/PROJECT-RULES.md` exist and differ from this file, **the live docs win** — re-read
them before scaffolding, since they may have been updated since this skill was written.

## Documented modules (per PRD.md §3)

Only these three feature modules are in scope for v1:

- `pdf-tools`
- `image-tools`
- `ai-newsletter`

Any other module name is **not yet documented**. PROJECT-RULES.md §1 says: "New features
must not be added unless they are documented first." Do not silently scaffold an
undocumented module — confirm with the user that PRD.md will be (or has been) updated.

## Full project base structure

```text
src/
├── app/
│   ├── api/
│   │   └── newsletter/
│   │       ├── fetch-news/route.ts
│   │       └── summarize/route.ts
│   ├── pdf-tools/page.tsx
│   ├── image-tools/page.tsx
│   ├── ai-newsletter/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── common/
│   └── ui/
├── features/
│   ├── pdf-tools/
│   ├── image-tools/
│   └── ai-newsletter/
├── lib/
│   ├── download.ts
│   ├── file-validation.ts
│   └── result.ts
├── services/
│   ├── ai/gemini.ts
│   └── news/news-client.ts
├── prompts/
│   └── newsletter.ts
├── types/
│   └── index.ts
└── __tests__/
    ├── file-validation.test.ts
    ├── api-response.test.ts
    └── newsletter-validation.test.ts
```

Notes:

- `src/app/api/*` only ever contains the AI Newsletter routes — PDF Tools and Image Tools
  must never get API routes (PROJECT-RULES.md §4, §5).
- API route filenames must match API-CONTRACTS.md §2 exactly:
  `POST /api/newsletter/fetch-news` and `POST /api/newsletter/summarize`.
- The three `__tests__` files match the recommended structure in PROJECT-RULES.md §14.
  They're created as `describe.todo(...)` stubs — empty skeletons, not real test logic.

## Feature module folder pattern (PROJECT-RULES.md §2)

Every entry under `src/features/<feature-name>/` follows this shape:

```text
src/features/<feature-name>/
├── components/
├── hooks/
├── lib/
├── types.ts
└── index.ts
```

- `components/` — UI only, no business logic (PROJECT-RULES.md §8).
- `hooks/` — reusable stateful logic for this module only.
- `lib/` — pure processing/business logic for this module only.
- `types.ts` — module-specific types; do not duplicate shared types here.
- `index.ts` — the module's public surface; this is what other code outside the module
  folder should import from, if anything is ever exposed (in practice, modules should not
  import from each other at all — see Module Boundary Rules below).

## Module boundary rules (PROJECT-RULES.md §3)

- `pdf-tools` must not import from `image-tools`, and vice versa.
- `ai-newsletter` must not import from `pdf-tools` or `image-tools`.
- Shared UI → `src/components`. Shared helpers → `src/lib`. Shared types → `src/types`.
  External API wrappers → `src/services`. AI prompts → `src/prompts`.

## Naming rules (PROJECT-RULES.md §16)

- kebab-case for file names (`merge-pdf.ts`, `resize-image.ts`)
- PascalCase for React components and TS types (`PdfUploader.tsx`, `PDFFile`)
- camelCase for variables and functions (`mergePdfFiles`, `fetchNews`)
