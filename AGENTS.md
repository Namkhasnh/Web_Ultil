<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Codex Agent — Router

You are a coding assistant for **WebUtil** — a Next.js 16 + React 19 + TypeScript + Tailwind CSS monolith with 3 independent modules: **PDF Tools**, **Image Tools**, **AI Newsletter**.

Before responding to any request, route yourself to the appropriate context below.

---

## Quick Reference (always apply these)

### Hard constraints — never violate

| Rule | Detail |
|------|--------|
| PDF & Image processing | **Client-side only.** Never upload files to API Routes. |
| Gemini API | **Server-side only.** Only call from API Routes, never from Client Components. |
| API key | Use `process.env.GEMINI_API_KEY` — never `NEXT_PUBLIC_*`. |
| Module isolation | `pdf-tools`, `image-tools`, `ai-newsletter` must not import from each other. |
| No `any` | Use explicit types. Shared types in `src/types`, feature types in `src/features/<name>/types.ts`. |
| Styling | Tailwind utility classes only. No inline `style={{}}`. |
| No new features | Only implement features already in `docs/PRD.md`. |
| State management | `useState` / `useReducer` / custom hooks only. No Redux, Zustand, Jotai. |

### Folder structure (required)

```text
src/
├── app/                         # Next.js App Router pages + API Routes
│   ├── api/newsletter/
│   │   ├── fetch-news/route.ts
│   │   └── summarize/route.ts
│   ├── pdf-tools/page.tsx
│   ├── image-tools/page.tsx
│   └── ai-newsletter/page.tsx
├── components/                  # Shared UI components
├── features/
│   ├── pdf-tools/               # components/ hooks/ lib/ types.ts index.ts
│   ├── image-tools/
│   └── ai-newsletter/
├── lib/                         # Shared utilities (file-validation, download, result helpers)
├── services/                    # External API wrappers (ai/gemini.ts, news/news-client.ts)
├── prompts/                     # AI prompt templates
└── types/                       # Shared TypeScript types
```

### Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files (non-component) | `kebab-case` | `merge-pdf.ts` |
| React components | `PascalCase.tsx` | `PdfUploader.tsx` |
| Variables / functions | `camelCase` | `mergePdfFiles()` |
| TypeScript types | `PascalCase` | `PDFFile`, `Article` |

### Newsletter API — standard response shape

```ts
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, code: 400 | 429 | 500 }
```

Only use error codes: `400` (client can fix) · `429` (rate limit, retry later) · `500` (unexpected server error).

### Key data types (do not redefine)

```ts
FileProcessingStatus = "idle" | "validating" | "ready" | "processing" | "done" | "error"
CompressLevel = "low" | "medium" | "high"
NewsletterTone = "neutral" | "professional" | "casual"
NewsletterOutputFormat = "markdown" | "text"
NewsSource = "hacker-news" | "reddit" | "free-news-api" | "url"
```

---

## Routing Rules (load for detailed reference)

### Writing or reviewing code
→ Read `docs/PROJECT-RULES.md` for naming, component, state, validation, error handling, and testing rules.

### Making architectural decisions
→ Read `docs/ARCHITECTURE.md` for layer boundaries, rendering strategy per module, and data flow diagrams.

### Working with data, APIs, or storage
→ Read `docs/data/API-CONTRACTS.md` for exact endpoint contracts and `docs/data/DATA-SCHEMA.md` for all type definitions.

### Writing any UI — components, layouts, styles
→ Read `docs/ui/ui-conventions.md` for the color palette, typography, theme tokens, and component patterns (upload zone, tabs, buttons, result card).

---

## How to Apply

1. Check the **Quick Reference** above — apply those rules immediately.
2. For the specific task type, load the relevant doc listed in Routing Rules.
3. Generate code strictly matching the conventions there.
4. For tasks spanning multiple areas, load all relevant docs.

---

## Do Not

- Invent conventions not in the project rules.
- Propose architecture that contradicts `docs/ARCHITECTURE.md`.
- Use data shapes or API patterns not defined in `docs/data/`.
- Add database, auth, or server-side file storage (not in v1).
- Call Gemini from a Client Component.
- Let feature modules import from each other.
