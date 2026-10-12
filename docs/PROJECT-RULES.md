# PROJECT-RULES.md — Project Rules

## 1. Core Project Rules

WebUtil must follow these core rules:

* The app is a single **Next.js** application.
* The architecture is a **monolith** with independent feature modules.
* There is no separate backend service in v1.
* There is no database in v1.
* There is no authentication in v1.
* There is no server-side file storage in v1.
* PDF and Image files must be processed client-side.
* Gemini API must only be called server-side through API Routes.
* Feature modules must not depend on each other.
* New features must not be added unless they are documented first.

---

## 2. Architecture Rules

The project must stay as one Next.js app.

Rules:

* Keep the app as a monolith.
* Organize code by feature.
* Keep shared utilities in shared folders only.
* Keep module-specific logic inside the module folder.
* Do not create a separate backend service.
* Do not introduce a database.
* Do not introduce authentication.
* Do not introduce server-side file storage.

Required high-level structure:

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── services/
├── prompts/
├── types/
└── __tests__/
```

Feature folders should follow this pattern:

```text
src/features/<feature-name>/
├── components/
├── hooks/
├── lib/
├── types.ts
└── index.ts
```

Example:

```text
src/features/pdf-tools/
├── components/
│   └── PdfUploader.tsx
├── hooks/
│   └── usePdfProcessor.ts
├── lib/
│   └── merge-pdf.ts
├── types.ts
└── index.ts
```

---

## 3. Module Boundary Rules

Each module must be independent.

Rules:

* PDF Tools must not import from Image Tools.
* Image Tools must not import from PDF Tools.
* AI Newsletter must not import from PDF Tools or Image Tools.
* Shared UI components must live in `src/components`.
* Shared helper functions must live in `src/lib`.
* Shared TypeScript types must live in `src/types`.
* External API wrappers must live in `src/services`.
* AI prompts must live in `src/prompts`.

Allowed import example:

```ts
import { validateFileSize } from "@/lib/file-validation";
import { Button } from "@/components/ui/button";
```

Not allowed:

```ts
import { resizeImage } from "@/features/image-tools/lib/resize-image";
// inside pdf-tools module
```

---

## 4. Client-Side File Processing Rules

PDF Tools and Image Tools must run fully in the browser.

Allowed:

* Browser `File`
* Browser `Blob`
* `URL.createObjectURL`
* Canvas API
* ImageBitmap API
* Browser-compatible PDF libraries
* Web Workers for heavy processing if needed

Not allowed:

* Uploading PDF files to API Routes
* Uploading image files to API Routes
* Saving uploaded files on the server
* Saving processed output files on the server
* Serializing `File` or `Blob` into JSON
* Storing file blobs in `localStorage`

Correct flow:

```text
Upload → Validate in Browser → Process in Browser → Create Blob → Download
```

Incorrect flow:

```text
Upload → API Route → Server Processing → Server Storage → Download
```

---

## 5. AI Newsletter Server Rules

AI Newsletter is the only module allowed to use API Routes in v1.

Allowed endpoints:

```text
POST /api/newsletter/fetch-news
POST /api/newsletter/summarize
```

Rules:

* API Routes must accept `POST` only.
* API Routes must validate request body.
* API Routes must return the standard response format.
* API Routes must not expose secrets.
* API Routes must not return stack traces.
* API Routes must not persist newsletter history.
* Gemini API must only be called from server-side code.
* Provider-specific logic must live in `src/services`.
* Prompt templates must live in `src/prompts`.

Do not call Gemini from Client Components.

Correct:

```ts
const apiKey = process.env.GEMINI_API_KEY;
```

Incorrect:

```ts
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
```

---

## 6. API Response Rules

All Newsletter API responses must use the standard format.

Success response:

```ts
{
  success: true,
  data: T
}
```

Error response:

```ts
{
  success: false,
  error: string,
  code: 400 | 429 | 500
}
```

Allowed error codes:

| Code | Meaning                        |
| ---- | ------------------------------ |
| 400  | Invalid client request         |
| 429  | Rate limit or throttling       |
| 500  | Unexpected server-side failure |

Rules:

* Use `400` when the user can fix the request.
* Use `429` when the user should retry later.
* Use `500` for unexpected server or provider errors.
* Keep error messages short and actionable.
* Never expose raw provider errors to the browser.
* Never expose stack traces.

Example:

```ts
return Response.json(
  {
    success: false,
    error: "At least one article is required.",
    code: 400,
  },
  { status: 400 },
);
```

---

## 7. TypeScript Rules

TypeScript must be used consistently.

Rules:

* Avoid `any`.
* Prefer explicit types for public functions.
* Use shared types from `src/types` or feature `types.ts`.
* Do not duplicate the same type across modules.
* Keep request and response types aligned with `API-CONTRACTS.md`.
* Keep file and newsletter data types aligned with `DATA-SCHEMA.md`.

Allowed:

```ts
type CompressLevel = "low" | "medium" | "high";
```

Avoid:

```ts
type CompressLevel = string;
```

Function example:

```ts
export async function fetchNews(
  payload: FetchNewsRequest,
): Promise<FetchNewsResponse> {
  // implementation
}
```

Avoid:

```ts
export async function fetchNews(payload: any): Promise<any> {
  // implementation
}
```

---

## 8. React Component Rules

Use React components for UI only.

Rules:

* Keep heavy business logic outside components.
* Keep file processing logic in feature `lib`.
* Keep reusable logic in hooks.
* Keep API calls outside UI components when possible.
* Use clear loading, success, and error states.
* Keep components small and readable.
* Prefer composition over large all-in-one components.

Recommended pattern:

```text
components/
├── PdfUploader.tsx
├── PdfOptionsForm.tsx
├── PdfResult.tsx
└── PdfErrorMessage.tsx
```

Good component responsibility:

```text
PdfUploader.tsx
→ handles upload UI only
```

Bad component responsibility:

```text
PdfUploader.tsx
→ upload UI + PDF merge + API calls + download logic + error mapping
```

---

## 9. State Management Rules

Use simple state management for v1.

Allowed:

* React `useState`
* React `useReducer`
* Custom hooks
* URL state for simple filters if useful
* `localStorage` only for user preferences

Not allowed in v1 unless documented first:

* Redux
* Zustand
* Jotai
* MobX
* Server-side sessions
* Database-backed state
* Saved user history

Use `localStorage` only for preferences:

* PDF compress level
* Image output format
* Image quality
* Image compress level
* Newsletter tone
* Newsletter output format

Do not store:

* Uploaded files
* Processed files
* File blobs
* Object URLs
* API keys
* Full article archives
* Newsletter history

---

## 10. File Lifecycle Rules

Files must be temporary.

Required lifecycle:

```text
User selects file
→ App stores File object in memory
→ App validates file
→ App processes file locally
→ App creates output Blob
→ User downloads result
→ App clears temporary state
```

Rules:

* Clear file state when users remove files.
* Revoke preview URLs when no longer needed.
* Revoke download URLs after use when possible.
* Do not persist files.
* Do not log file contents.
* Do not send PDF/Image files to API Routes.

Example cleanup:

```ts
URL.revokeObjectURL(previewUrl);
```

---


## 11. Styling Rules

Use Tailwind CSS for styling.

Rules:

* Prefer utility classes.
* Keep styling consistent across modules.
* Use shared UI components for repeated patterns.
* Keep pages responsive.
* Use clear spacing, readable typography, and accessible contrast.
* Avoid one-off complex CSS unless needed.

Allowed:

```tsx
<button className="rounded-md px-4 py-2 text-sm font-medium">
  Download
</button>
```

Avoid:

```tsx
<button style={{ padding: 12, borderRadius: 8 }}>
  Download
</button>
```

---

## 12. Error Handling Rules

Every tool must show clear error messages.

Common error cases:

* Unsupported file type
* File too large
* Empty input
* Invalid page range
* Processing failed
* External API failed
* Gemini API failed
* Rate limit reached
* Browser feature unsupported

Rules:

* Show user-friendly messages.
* Keep messages short.
* Explain what the user can do next.
* Do not show stack traces.
* Do not show raw provider errors.
* Log only safe technical details during development.

Good message:

```text
This file type is not supported. Please upload a PDF file.
```

Bad message:

```text
TypeError: Cannot read properties of undefined
```

---

## 13. Validation Rules

Validate inputs before processing.

PDF validation:

* File must be PDF.
* File size must be within supported limits.
* Split page ranges must be valid.
* At least two files are required for merge.

Image validation:

* File must be PNG, JPEG, or WebP.
* Width and height must be positive numbers.
* Quality must be between `0` and `1`.
* Output format must be supported.

Newsletter validation:

* Query must not be empty.
* Article list must not be empty before summarization.
* URL input must be valid when source type is URL.
* Tone must match allowed values.
* Output format must match allowed values.

---

## 14. Testing Rules

Testing should focus on critical business logic.

Recommended test targets:

* File validation helpers
* PDF option parsing
* Image resize/convert option validation
* API response helpers
* Newsletter request validation
* Prompt-building functions
* Utility functions in `src/lib`

Recommended structure:

```text
src/__tests__/
├── file-validation.test.ts
├── api-response.test.ts
└── newsletter-validation.test.ts
```

Rules:

* Test pure functions first.
* Avoid testing implementation details.
* Mock external APIs.
* Do not call Gemini API in automated tests.
* Do not require real uploaded files unless needed.
* Use small fixture files only when necessary.

---

## 15. Performance Rules

PDF and Image Tools:

* Avoid blocking the UI for long tasks.
* Show loading or progress states.
* Use Web Workers later if processing becomes slow.
* Release object URLs after use.
* Avoid unnecessary file reads.
* Avoid storing duplicate large blobs in state.

AI Newsletter:

* Avoid unnecessary API calls.
* Limit selected article content sent to Gemini.
* Keep prompts concise.
* Normalize external API responses.
* Handle rate limits gracefully.

---

## 16. Naming Rules

Use clear and consistent names.

File names:

* Use kebab-case for files.
* Use PascalCase for React components.
* Use camelCase for variables and functions.
* Use PascalCase for TypeScript types.

Examples:

```text
merge-pdf.ts
resize-image.ts
newsletter-api.ts
PdfUploader.tsx
ImageOptionsForm.tsx
NewsletterResult.tsx
```

Function examples:

```ts
mergePdfFiles()
splitPdfByRanges()
resizeImage()
fetchNews()
summarizeNewsletter()
```

Type examples:

```ts
PDFFile
ImageFile
Article
NewsletterResult
ApiResponse
```