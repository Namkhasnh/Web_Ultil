# ARCHITECTURE.md — Technical Architecture

## 1. Purpose

This document describes the high-level technical architecture of **WebUtil**.

It helps developers and AI coding assistants understand the intended structure and avoid changes that break the architecture.

This document describes architecture only. Product scope and detailed features are defined in `@docs/PRD.md`.

---

## 2. Architecture Overview

The app contains three independent feature modules:

```text
WebUtil
├── PDF Tools
├── Image Tools
└── AI Newsletter
```

Architecture rules:

* Single Next.js app
* No separate backend service in v1
* No database in v1
* No authentication in v1
* No server-side file storage
* Feature modules must not depend on each other
* Shared code must live in shared folders only
* Module-specific logic must stay inside its feature folder

---

## 3. Tech Stack

| Layer        | Technology   | Purpose                                     |
| ------------ | ------------ | ------------------------------------------- |
| Framework    | Next.js 16   | App Router, Server Component, API Routes    |
| UI Library   | React 19     | Component-based UI                          |
| Language     | TypeScript   | Type safety and maintainability             |
| Styling      | Tailwind CSS | Utility-first styling                       |
| Bundler      | Turbopack    | Fast local development                      |
| AI Provider  | Gemini API   | AI newsletter summarization                 |
| Backend      | None         | Only Next.js API Routes where required      |
| Database     | None         | No persistent data in v1                    |
| Auth         | None         | Public tools without login                  |
| File Storage | None         | Files are not stored server-side            |

---

## 4. Rendering Strategy

WebUtil uses different rendering strategies depending on module requirements.

### 4.1 PDF Tools

Rendering strategy: **100% client-side**

Reason:

* User PDF files should stay in the browser
* No server upload or server storage is needed
* Output files can be generated as `Blob` objects and downloaded locally

Flow:

```text
Browser Upload → Client-side PDF Processing → Blob/File Output → Browser Download
```

Allowed:

* Client Components
* Browser APIs: `File`, `Blob`, `URL.createObjectURL`
* Browser-compatible PDF libraries
* Web Workers for heavy processing if needed

Not allowed:

* Uploading PDFs to the server for processing
* Saving PDF files on the server
* Adding database persistence for PDF jobs

### 4.2 Image Tools

Rendering strategy: **100% client-side**

Reason:

* Image resize, convert, and compression can run in the browser
* User image files should not leave the device
* No backend is needed for MVP image operations

Flow:

```text
Browser Upload → Client-side Image Processing → Blob/File Output → Browser Download
```

Allowed:

* Client Components
* Canvas API
* ImageBitmap API
* Browser-compatible image libraries
* Web Workers for large images if needed

Not allowed:

* Uploading images to the server for processing
* Saving images on the server
* Adding database persistence for image jobs

### 4.3 AI Newsletter

Rendering strategy: **server-side through Next.js API Routes**

Reason:

* Gemini API key must not be exposed to the browser
* External API calls should be wrapped behind internal API Routes
* Prompt building and AI provider logic should stay outside UI components

Flow:

```text
Client Input
→ Next.js API Route
→ External News APIs / Public Sources
→ Next.js API Route
→ Gemini API
→ Response to Client
→ Copy or Download Newsletter
```

Allowed:

* Client Components for forms and result display
* API Routes for external API calls
* Server-side Gemini API calls
* Environment variables for secrets
* Service functions for AI and news integrations

Not allowed:

* Calling Gemini API directly from the browser
* Exposing API keys in client-side code
* Persisting newsletter drafts in a database
* Adding user accounts or saved history in v1

---

## 5. Feature-Based Code Organization

The project should use **feature-based organization**.

Each feature module owns its own UI, hooks, utilities, types, and business logic.

Principles:

* Group code by feature first
* Keep module-specific code inside `src/features/<feature-name>`
* Keep shared UI in `src/components`
* Keep shared utilities in `src/lib`
* Keep shared types in `src/types`
* Keep API integration wrappers in `src/services`
* Keep AI prompts outside React components

Example:

```text
src/features/pdf-tools/
├── components/
├── hooks/
├── lib/
├── types.ts
└── index.ts
```

---

## 6. Data Flow

### 6.1 PDF Tools Data Flow

PDF Tools run fully in the browser.

```text
User
→ Upload PDF file(s)
→ Validate file type and size in browser
→ Process PDF in client-side feature logic
→ Create output Blob/File
→ Show result state
→ Download processed PDF
```

Architecture notes:

* Files are read using browser APIs
* Processing state stays in React state or feature hooks
* Output file is generated locally
* No file is sent to a server
* No result is stored permanently

Example:

```text
Upload files → mergePdf(files) → merged.pdf Blob → download
```

### 6.2 Image Tools Data Flow

Image Tools run fully in the browser.

```text
User
→ Upload image file(s)
→ Validate file type and size in browser
→ Process image in client-side feature logic
→ Create output Blob/File
→ Show result state
→ Download processed image(s)
```

Architecture notes:

* Files are read using browser APIs
* Image processing can use Canvas or browser-compatible libraries
* Output files are generated locally
* No image is sent to a server
* No result is stored permanently

Example:

```text
Upload image.png → convertImage(file, "webp") → image.webp Blob → download
```

### 6.3 AI Newsletter Data Flow

AI Newsletter uses browser UI plus server-side API Routes.

```text
User
→ Enter topic, keyword, or source URL
→ Client sends request to internal API Route
→ API Route collects news from public sources or free APIs
→ Client displays collected articles
→ User selects articles
→ Client sends selected article data to internal API Route
→ API Route builds prompt
→ API Route calls Gemini API
→ Gemini returns summary
→ API Route returns newsletter content
→ Client displays result
→ User copies or downloads Markdown/Text
```

Architecture notes:

* Gemini API is called only from server-side code
* API keys are stored in environment variables
* Prompt templates are stored outside React components
* Newsletter results are returned to the client but not persisted
* API Routes act as a thin server-side boundary, not a full backend service

Example:

```text
Input topic → /api/newsletter/collect → articles → /api/newsletter/generate → newsletter.md
```

---

## 7. API Route Architecture

API Routes are used only when server-side execution is required.

Current server-side needs:

* Hide Gemini API key
* Wrap external news API calls if needed
* Normalize third-party responses before returning to the client

Recommended structure:

```text
src/app/api/
└── newsletter/
    ├── collect/route.ts
    └── generate/route.ts
```

API Route rules:

* Validate request body before processing
* Return short and predictable error responses
* Never return secrets to the client
* Never store uploaded files or newsletter drafts
* Keep route handlers thin
* Move provider-specific logic to `src/services`

Example response shape:

```ts
type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};
```

---

## 8. Environment Variables

Required for server-side AI integration:

```text
GEMINI_API_KEY=your_api_key_here
```

Rules:

* Do not prefix secrets with `NEXT_PUBLIC_`
* Do not read secret environment variables inside Client Components
* Document required variables in setup docs

Correct:

```ts
const apiKey = process.env.GEMINI_API_KEY;
```

Incorrect:

```ts
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
```

---

## 9. Folder Structure

The current project starts from a standard Next.js structure.

Target architecture structure:

```text
webutil/
├── docs
├── public
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── newsletter/
│   │   │       ├── collect/route.ts
│   │   │       └── generate/route.ts
│   │   ├── pdf-tools/
│   │   │   └── page.tsx
│   │   ├── image-tools/
│   │   │   └── page.tsx
│   │   ├── ai-newsletter/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── common/
│   │   └── ui/
│   ├── features/
│   │   ├── pdf-tools/
│   │   ├── image-tools/
│   │   └── ai-newsletter/
│   ├── lib/
│   │   ├── download.ts
│   │   ├── file-validation.ts
│   │   └── result.ts
│   ├── services/
│   │   ├── ai/
│   │   │   └── gemini.ts
│   │   └── news/
│   │       └── news-client.ts
│   ├── prompts/
│   │   └── newsletter.ts
│   ├── types/
│   │   └── index.ts
│   └── __tests__/
├── next.config.ts
├── package.json
├── tsconfig.json
└── vitest.config.mts
```

Feature folder detail:

```text
src/features/<feature-name>/
├── components/
├── hooks/
├── lib/
├── types.ts
└── index.ts
```

---

## 10. Client and Server Component Rules

Use Client Components for:

* File upload UI
* Drag-and-drop UI
* Browser file processing
* Tool configuration forms
* Progress, success, and error states
* Download and copy buttons

Use server-side code for:

* API Routes
* Gemini API calls
* External news API calls when needed
* Request validation
* Response normalization

Server code must not:

* Store files permanently
* Create user sessions
* Add database writes
* Expose secrets to the client

---

## 11. Performance Strategy

PDF and Image Tools:

* Process small and medium files directly in the browser
* Show loading state during processing
* Avoid blocking the UI for heavy work
* Use Web Workers later if processing becomes slow
* Release object URLs after download when possible

AI Newsletter:

* Avoid unnecessary external API calls
* Send only necessary article content to Gemini
* Limit selected articles per generation if needed
* Keep prompts concise and predictable
* Return normalized API responses

---

## 12. Architecture Constraints

Developers and AI coding assistants must follow these constraints:

* Do not add authentication in v1
* Do not add a database in v1
* Do not add server-side file storage in v1
* Do not upload PDF or image files to the server for processing
* Do not call Gemini API from the browser
* Do not mix feature logic across modules
* Do not place module-specific business logic in shared folders
* Do not implement features outside `@docs/PRD.md`
* Do not add new architecture patterns without updating this document


