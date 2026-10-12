# WebUtil

WebUtil is a web app concept for everyday file and content tasks. It brings PDF utilities, image tools, and AI-assisted news summaries together in one place.

## What WebUtil is designed to do

### PDF tools

- Merge multiple PDF files into one.
- Split a PDF by selected pages or page ranges.
- Compress a PDF where possible.
- Attempt to remove simple visible watermarks. Results depend on how the PDF was created.

### Image tools

- Resize images by dimensions or scale.
- Convert images to formats such as PNG, JPEG, and WebP.
- Compress images with adjustable compression.

### AI newsletter

- Collect news from supported public sources or user-provided URLs.
- Select articles and generate concise AI summaries.
- Combine summaries into a newsletter draft.

## Current project status

The current build contains the WebUtil landing page, which introduces these three tool areas. The PDF, image, and newsletter tools are planned capabilities; their application pages and processing workflows are not yet implemented.

## Privacy goals

- PDF and image processing is intended to happen in the browser, so files do not need to be uploaded for those tasks.
- Newsletter summarization is intended to use a server-side API route to call Gemini. Never expose the Gemini API key in client-side code.
- WebUtil does not currently provide accounts, a database, or persistent file storage.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Vitest and React Testing Library

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quality checks

```bash
npm test
npm run lint
npm run build
```
