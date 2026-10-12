# API-CONTRACTS.md — API Contracts

## 1. Purpose

This document defines the contract between frontend components and server-side API Routes in **WebUtil**.

It helps developers and AI coding assistants know:

* Which modules can call API Routes
* Which modules must stay fully client-side
* Exact Newsletter request and response shapes
* Standard success and error responses

Do not change endpoint names, request fields, or response shapes without updating this file and related frontend code.

---


## 2. Newsletter API Routes

The AI Newsletter module has exactly two endpoints in v1.

```text
POST /api/newsletter/fetch-news
POST /api/newsletter/summarize
```

Recommended route structure:

```text
src/app/api/newsletter/
├── fetch-news/
│   └── route.ts
└── summarize/
    └── route.ts
```

Endpoint rules:

* Accept `POST` only.
* Validate request body before processing.
* Keep route handlers thin.
* Move provider-specific logic to `src/services`.
* Return only the standard response format.
* Never expose API keys, stack traces, or raw provider secrets.

---

## 3. Standard Response Format

### 3.1 Success Response

```ts
export type ApiSuccess<T> = {
  success: true;
  data: T;
};
```

Example:

```json
{
  "success": true,
  "data": {
    "articles": []
  }
}
```

---

### 3.2 Error Response

```ts
export type ApiError = {
  success: false;
  error: string;
  code: 400 | 429 | 500;
};
```

Example:

```json
{
  "success": false,
  "error": "Query is required.",
  "code": 400
}
```

---

### 3.3 Shared Type

```ts
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      code: 400 | 429 | 500;
    };
```

Frontend usage:

```ts
const result = (await response.json()) as ApiResponse<FetchNewsResponse>;

if (!result.success) {
  throw new Error(result.error);
}

return result.data;
```

## 4. Error Codes

Only these error codes are allowed in v1.

| Code | Meaning | Common Cases |
| ---- | ------- | ------------ |
| 400 | Bad Request | Missing query, invalid URL, empty article list, invalid body |
| 429 | Too Many Requests | External API rate limit, Gemini rate limit, app throttling |
| 500 | Internal Server Error | Unexpected server error, external API failure, Gemini failure |

Rules:

* Use `400` when the client can fix the request.
* Use `429` when the user should retry later.
* Use `500` for unexpected server-side failures.
* Keep error messages short and actionable.

## 5. Endpoint: POST /api/newsletter/fetch-news

### 5.1 Purpose

Collect news articles from supported public sources based on a topic, keyword, or source URL.

This endpoint only returns normalized article data. It does not summarize content.

---

### 5.2 Request Body

```ts
export type FetchNewsRequest = {
  query: string;
  sources?: NewsSource[];
  limit?: number;
};

export type NewsSource = "hacker-news" | "reddit" | "free-news-api" | "url";
```

Field rules:

| Field | Required | Rules |
| ----- | -------- | ----- |
| `query` | Yes | Topic, keyword, or URL. Must not be empty |
| `sources` | No | Defaults to supported public sources |
| `limit` | No | Defaults to a safe server-side value |

Example request:

```json
{
  "query": "AI tools for developers",
  "sources": ["hacker-news", "reddit"],
  "limit": 10
}
```

---

### 5.3 Success Response

```ts
export type FetchNewsResponse = {
  articles: Article[];
};
```

Example response:

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "hn-123456",
        "title": "New AI coding tool released",
        "source": "Hacker News",
        "url": "https://example.com/article",
        "publishedAt": "2026-06-18T08:30:00.000Z",
        "excerpt": "A short description of the article..."
      }
    ]
  }
}
```

### 5.4 Error Examples

```json
{
  "success": false,
  "error": "Query is required.",
  "code": 400
}
```

```json
{
  "success": false,
  "error": "News source rate limit reached. Please try again later.",
  "code": 429
}
```

```json
{
  "success": false,
  "error": "Failed to fetch news.",
  "code": 500
}
```

## 6. Endpoint: POST /api/newsletter/summarize

### 6.1 Purpose

Generate an AI-powered newsletter draft from selected articles.

This endpoint calls Gemini API server-side. The browser must never call Gemini directly.

---

### 6.2 Request Body

```ts
export type SummarizeNewsletterRequest = {
  articles: Article[];
  tone?: NewsletterTone;
  outputFormat?: NewsletterOutputFormat;
};

export type NewsletterTone = "neutral" | "professional" | "casual";
export type NewsletterOutputFormat = "markdown" | "text";
```

Field rules:

| Field | Required | Rules |
| ----- | -------- | ----- |
| `articles` | Yes | Must contain at least 1 selected article |
| `tone` | No | Defaults to `neutral` |
| `outputFormat` | No | Defaults to `markdown` |

Example request:

```json
{
  "articles": [
    {
      "id": "hn-123456",
      "title": "New AI coding tool released",
      "source": "Hacker News",
      "url": "https://example.com/article",
      "publishedAt": "2026-06-18T08:30:00.000Z",
      "excerpt": "A short description of the article..."
    }
  ],
  "tone": "professional",
  "outputFormat": "markdown"
}
```

---

### 6.3 Success Response

```ts
export type SummarizeNewsletterResponse = {
  newsletter: NewsletterResult;
};
```

Example response:

```json
{
  "success": true,
  "data": {
    "newsletter": {
      "title": "AI Developer Tools Weekly",
      "introduction": "This issue highlights recent updates in AI-assisted development.",
      "sections": [
        {
          "heading": "Developer Tools",
          "items": [
            {
              "title": "New AI coding tool released",
              "summary": "A concise AI-generated summary.",
              "sourceUrl": "https://example.com/article"
            }
          ]
        }
      ],
      "keyTakeaways": ["AI coding tools continue to improve developer workflows."],
      "closing": "Use these updates as a starting point for deeper research.",
      "format": "markdown",
      "generatedAt": "2026-06-18T09:00:00.000Z"
    }
  }
}
```

### 6.4 Error Examples

```json
{
  "success": false,
  "error": "At least one article is required.",
  "code": 400
}
```

```json
{
  "success": false,
  "error": "AI rate limit reached. Please try again later.",
  "code": 429
}
```

```json
{
  "success": false,
  "error": "Failed to summarize newsletter.",
  "code": 500
}
```

## 7. Frontend API Client Rules

Recommended location:

```text
src/features/ai-newsletter/lib/api.ts
```

Example:

```ts
export async function fetchNews(
  payload: FetchNewsRequest,
): Promise<FetchNewsResponse> {
  const response = await fetch("/api/newsletter/fetch-news", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as ApiResponse<FetchNewsResponse>;

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}
```

Rules:

* Keep API client functions outside React components.
* Use typed request and response objects.
* Handle `success: false` before reading `data`.
* Show user-friendly errors in UI components.

## 8. Server Route Rules

Route handlers must:

* Parse and validate JSON body.
* Return `400` for invalid input.
* Return `429` for rate limit failures.
* Return `500` for unexpected failures.
* Return the standard response format only.
* Never return stack traces, secrets, or raw provider errors.
* Never store request or response data permanently.

Example helper:

```ts
export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function fail(error: string, code: 400 | 429 | 500): ApiResponse<never> {
  return { success: false, error, code };
}
```
