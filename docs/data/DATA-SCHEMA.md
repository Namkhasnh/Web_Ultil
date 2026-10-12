# DATA-SCHEMA.md — Data Schema

## 1. Shared Types

```ts
export type ISODateString = string;

export type ApiErrorCode = 400 | 429 | 500;

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      code: ApiErrorCode;
    };

export type FileProcessingStatus =
  | "idle"
  | "validating"
  | "ready"
  | "processing"
  | "done"
  | "error";

export type CompressLevel = "low" | "medium" | "high";
```

---

## 2. PDF Tools Types

### 2.1 PDFFile

```ts
export type PDFOperation = "merge" | "split" | "compress" | "remove-watermark";

export type PDFFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: "application/pdf";
  pageCount?: number;
  status: FileProcessingStatus;
  error?: string;
};
```

Example:

```ts
const pdfFile: PDFFile = {
  id: "pdf-001",
  file,
  name: "report.pdf",
  size: file.size,
  type: "application/pdf",
  pageCount: 12,
  status: "ready",
};
```

### 2.2 PDF Options and Result

```ts
export type PDFSplitOptions = {
  ranges: string;
};

export type PDFCompressOptions = {
  level: CompressLevel;
};

export type PDFRemoveWatermarkOptions = {
  mode: "basic";
};

export type PDFProcessResult = {
  operation: PDFOperation;
  outputFileName: string;
  outputBlob: Blob;
  originalSize: number;
  outputSize: number;
  createdAt: ISODateString;
};
```

Rules:

* `ranges` stores user input such as `"1-3,5,8-10"`.
* `remove-watermark` is best-effort only.
* `outputBlob` is temporary and must not be sent to an API Route.
* Use `URL.createObjectURL(outputBlob)` for downloads.

---

## 3. Image Tools Types

### 3.1 ImageFile

```ts
export type ImageOperation = "resize" | "convert" | "compress";

export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp";

export type ImageOutputFormat = "png" | "jpeg" | "webp";

export type ImageFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  type: ImageMimeType;
  width?: number;
  height?: number;
  previewUrl?: string;
  status: FileProcessingStatus;
  error?: string;
};
```

Example:

```ts
const imageFile: ImageFile = {
  id: "image-001",
  file,
  name: "banner.png",
  size: file.size,
  type: "image/png",
  width: 1200,
  height: 628,
  previewUrl: URL.createObjectURL(file),
  status: "ready",
};
```

### 3.2 Image Options and Result

```ts
export type ImageResizeOptions = {
  width?: number;
  height?: number;
  scalePercent?: number;
  maintainAspectRatio: boolean;
};

export type ImageConvertOptions = {
  outputFormat: ImageOutputFormat;
  quality?: number;
};

export type ImageCompressOptions = {
  quality: number;
  level: CompressLevel;
};

export type ImageProcessResult = {
  operation: ImageOperation;
  outputFileName: string;
  outputBlob: Blob;
  outputFormat: ImageOutputFormat;
  originalSize: number;
  outputSize: number;
  width?: number;
  height?: number;
  createdAt: ISODateString;
};
```

Rules:

* `quality` should be a number from `0` to `1`.
* Use `maintainAspectRatio: true` by default.
* `outputBlob` is temporary and must not be persisted.
* Image processing must stay client-side.

---

## 4. AI Newsletter Types

### 4.1 Article

```ts
export type NewsSource = "hacker-news" | "reddit" | "free-news-api" | "url";

export type Article = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt?: ISODateString;
  collectedAt?: ISODateString;
  author?: string;
  excerpt?: string;
  content?: string;
  selected?: boolean;
};
```

Example:

```ts
const article: Article = {
  id: "hn-123456",
  title: "New AI coding tool released",
  source: "Hacker News",
  url: "https://example.com/article",
  publishedAt: "2026-06-18T08:30:00.000Z",
  excerpt: "A short description of the article...",
  selected: true,
};
```

Rules:

* `id` must be stable within the current session.
* `url` must be a valid article or post URL.
* `content` should contain only necessary text for summarization.
* Do not store full article archives in the app.

---

### 4.2 NewsletterResult

```ts
export type NewsletterTone = "neutral" | "professional" | "casual";

export type NewsletterOutputFormat = "markdown" | "text";

export type NewsletterResult = {
  title: string;
  introduction: string;
  sections: NewsletterSection[];
  keyTakeaways: string[];
  closing: string;
  format: NewsletterOutputFormat;
  generatedAt: ISODateString;
};

export type NewsletterSection = {
  heading: string;
  items: NewsletterItem[];
};

export type NewsletterItem = {
  title: string;
  summary: string;
  sourceUrl: string;
};
```

Example:

```ts
const newsletter: NewsletterResult = {
  title: "AI Developer Tools Weekly",
  introduction: "This issue highlights recent updates in AI-assisted development.",
  sections: [
    {
      heading: "Developer Tools",
      items: [
        {
          title: "New AI coding tool released",
          summary: "A concise AI-generated summary.",
          sourceUrl: "https://example.com/article",
        },
      ],
    },
  ],
  keyTakeaways: ["AI coding tools continue to improve developer workflows."],
  closing: "Use these updates as a starting point for deeper research.",
  format: "markdown",
  generatedAt: "2026-06-18T09:00:00.000Z",
};
```

Rules:

* Store result in React state only.
* Allow copy or download as Markdown/Text.
* Do not persist generated newsletters in a database.
* Do not save newsletter history in `localStorage`.

---

## 5. Newsletter API Data Shapes

```ts
export type FetchNewsRequest = {
  query: string;
  sources?: NewsSource[];
  limit?: number;
};

export type FetchNewsResponse = {
  articles: Article[];
};

export type SummarizeNewsletterRequest = {
  articles: Article[];
  tone?: NewsletterTone;
  outputFormat?: NewsletterOutputFormat;
};

export type SummarizeNewsletterResponse = {
  newsletter: NewsletterResult;
};
```

Rules:

* `query` is required for fetching news.
* `articles` must not be empty for summarization.
* API responses must use `ApiResponse<T>`.
* Request validation must happen in API Routes.

---

## 6. User Preferences in localStorage

`localStorage` is used only for user preferences.

Allowed preferences:

* PDF compress level
* Image output format
* Image quality
* Image compress level
* Newsletter tone
* Newsletter output format

Not allowed:

* Uploaded PDF files
* Uploaded image files
* Processed output files
* File blobs or object URLs
* Full article archives
* Generated newsletter history
* API keys or secrets

### 7.1 Preference Type

```ts
export type UserPreferences = {
  pdf?: PDFPreferences;
  image?: ImagePreferences;
  newsletter?: NewsletterPreferences;
};

export type PDFPreferences = {
  compressLevel: CompressLevel;
};

export type ImagePreferences = {
  outputFormat: ImageOutputFormat;
  quality: number;
  compressLevel: CompressLevel;
};

export type NewsletterPreferences = {
  tone: NewsletterTone;
  outputFormat: NewsletterOutputFormat;
};

export const USER_PREFERENCES_STORAGE_KEY = "webutil:user-preferences";
```

Example:

```json
{
  "pdf": {
    "compressLevel": "medium"
  },
  "image": {
    "outputFormat": "webp",
    "quality": 0.8,
    "compressLevel": "medium"
  },
  "newsletter": {
    "tone": "professional",
    "outputFormat": "markdown"
  }
}
```

---

## 8. File Lifecycle

PDF and image files follow this lifecycle:

```text
User selects file
→ Browser creates File object
→ App validates file
→ App processes file in browser
→ App creates Blob result
→ User downloads result
→ App clears temporary state
```

Rules:

* Keep uploaded files in memory only.
* Keep output blobs in memory only.
* Clear file state when users remove files.
* Revoke preview and download object URLs when possible.
* Never serialize `File` or `Blob` into JSON.

---

## 11. Type Location Rules

Recommended locations:

```text
src/types/index.ts
src/features/pdf-tools/types.ts
src/features/image-tools/types.ts
src/features/ai-newsletter/types.ts
```

Rules:

* Shared primitive types can live in `src/types/index.ts`.
* Module-specific types should live inside the feature folder.
* Do not duplicate the same type in multiple modules.
* Re-export feature types through each feature `index.ts` when useful.
* Keep API request and response types close to the Newsletter feature or shared API client.

