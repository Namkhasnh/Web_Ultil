# PRD.md — Product Requirements

## 1. Purpose

This document defines the product scope for **WebUtil**.

The goal is to clearly describe what features will be built in version 1, what is intentionally excluded, and how users interact with the system.

This document helps developers and AI coding assistants avoid adding features outside the planned MVP scope.

---

## 2. Product Overview

**WebUtil** is a web application that provides simple browser-based utilities for common file and content workflows.

The project focuses on three independent modules:

* **PDF Tools**: help users process PDF files quickly
* **Image Tools**: help users resize, convert, and compress images
* **AI Newsletter**: help users collect news and generate summarized newsletters using AI

The target users are:

* Students and office workers who need quick file utilities
* Content creators who need lightweight image/PDF processing
* Developers or marketers who want to generate newsletter drafts from collected news
* New team members and AI coding assistants working on this project

WebUtil is designed as a single Next.js application with no backend server, no database, and no user authentication in v1.

---

## 3. MVP Scope

Version 1 focuses only on essential features that can run inside a single Next.js application using browser capabilities and free external APIs.

### 3.1 PDF Tools Module

The PDF Tools module provides basic PDF file processing features.

MVP features:

* **Merge PDF**

  * User uploads multiple PDF files
  * System combines them into one PDF file
  * User downloads the merged PDF

* **Split PDF**

  * User uploads one PDF file
  * User selects page ranges or specific pages
  * System creates a new PDF based on the selected pages
  * User downloads the result

* **Compress PDF**

  * User uploads one PDF file
  * System reduces PDF file size where possible
  * User downloads the compressed PDF

* **Remove Watermark**

  * User uploads one PDF file
  * System attempts to remove simple visible watermarks where technically possible
  * User downloads the processed PDF
  * This feature is best-effort and may not work for all PDFs

---

### 3.2 Image Tools Module

The Image Tools module provides basic image processing features.

MVP features:

* **Resize Image**

  * User uploads one or more image files
  * User enters target width, height, or percentage scale
  * System generates resized image files
  * User downloads the result

* **Convert Image**

  * User uploads one or more image files
  * User selects output format, for example PNG, JPEG, or WebP
  * System converts images to the selected format
  * User downloads the converted images

* **Compress Image**

  * User uploads one or more image files
  * User selects compression level or uses the default setting
  * System reduces image file size
  * User downloads the compressed images

---

### 3.3 AI Newsletter Module

The AI Newsletter module helps users collect news from public sources such as Hacker News, Reddit, or user-provided URLs, then use AI to summarize the collected content into a readable newsletter draft.

The goal is to let users stay updated without manually visiting multiple websites or reading many separate articles.

MVP features:

#### Collect News

- User enters keywords, topics, or source URLs
- System collects relevant news from supported public sources, such as Hacker News, Reddit, or free external APIs
- System displays a list of collected articles or posts with basic information:
  - Title
  - Source
  - URL
  - Published date or collected date
  - Short excerpt, if available

#### Summarize News with AI

- User selects collected articles or posts
- System extracts available content, metadata, or short descriptions from selected items
- System sends the extracted content to Gemini API
- Gemini generates concise summaries for each selected item

#### Generate Newsletter Draft

- System combines selected AI summaries into a newsletter format
- Newsletter output includes:
  - Title
  - Short introduction
  - Grouped article summaries
  - Key takeaways
  - Closing section
- User can review and copy the generated newsletter content

#### Export Newsletter

- User can copy the generated newsletter
- Optional MVP export format: plain text or Markdown download


---

## 4. Out of Scope for v1

The following features must not be implemented in version 1.

* **No authentication**
  * No login; No signup; No user profile
  * No role-based access control

* **No database**

  * No persistent user data
  * No saved processing history
  * No saved newsletter archive

* **No server-side file storage**

  * Uploaded files must not be stored permanently on a server
  * Files should be processed in the browser where possible
  * Temporary processing data must be cleared after the session

* **No cloud sharing**

  * No public file links
  * No shareable newsletter links
  * No team workspace
  * No integration with Google Drive, Dropbox, OneDrive, or similar services

* **No payment features**

  * No subscription plan
  * No usage-based billing
  * No premium feature gating

* **No advanced editor**

  * No full PDF editor
  * No Photoshop-like image editor
  * No drag-and-drop newsletter builder

* **No multi-user collaboration**

  * No comments
  * No shared drafts
  * No real-time collaboration

---

## 5. Main User Flow

The main flow for PDF and Image tools follows the same pattern.

```text
Upload → Process → Download
```

### 5.1 File Processing Flow

1. User opens a tool page
2. User uploads file or files
3. System validates file type and size
4. User configures processing options if needed
5. User clicks the process button
6. System processes the file
7. System shows success or error result
8. User downloads the output file

Example:

```text
Upload PDF files → Merge PDFs → Download merged.pdf
```

Example:

```text
Upload image.png → Convert to WebP → Download image.webp
```

---

### 5.2 AI Newsletter Flow

The AI Newsletter module follows a content generation flow.

```text
Input Topic / Sources → Collect News → Summarize → Generate Newsletter → Copy / Download
```

Steps:

1. User opens the AI Newsletter page
2. User enters a topic, keyword, or source URL
3. System collects relevant news articles
4. User reviews and selects articles
5. System sends selected content to Gemini API
6. Gemini returns summarized content
7. System generates a newsletter draft
8. User copies or downloads the newsletter

Example:

```text
Input topic "AI tools for developers" 
→ Collect articles 
→ Summarize with Gemini 
→ Generate newsletter 
→ Copy Markdown
```

---

## 6. Functional Requirements

### 6.1 General Requirements

* The application must be built as a single Next.js app
* Each module must be independent from other modules
* Users must be able to access tools without login
* The UI must be simple, responsive, and easy to understand
* Each tool must show loading, success, and error states
* Each tool must validate input before processing
* Each tool must provide a clear download or copy result action

---

### 6.2 File Upload Requirements

* Users can upload files using a file picker
* Drag-and-drop upload is allowed but not required for MVP
* The system must validate supported file types
* The system must show useful error messages for invalid files
* The system must avoid uploading files to a backend server unless required by an external API
* File processing should happen client-side whenever technically possible

---

### 6.3 Error Handling Requirements

The system must handle common errors clearly.

Examples:

* Unsupported file type
* File too large
* Processing failed
* External API request failed
* Gemini API error
* No news articles found
* Browser does not support required functionality

Error messages should be short and actionable.

Example:

```text
This file type is not supported. Please upload a PDF file.
```

Example:

```text
Newsletter generation failed. Please try again with fewer articles.
```

---

## 7. Non-Functional Requirements

### 7.1 Performance

* File tools should respond quickly for small and medium files
* Large files should show progress or loading states
* The app should avoid unnecessary API calls
* The app should avoid blocking the UI during long processing tasks

### 7.2 Privacy

* User files must not be stored permanently
* User files must not be shared publicly
* The app should clearly communicate when external APIs are used
* Newsletter content sent to Gemini API should be limited to necessary content only

### 7.3 Maintainability

* Each module should have its own folder structure
* Shared UI components should be reused
* Shared utility functions should be placed in common folders
* Feature logic should not be tightly coupled across modules
* AI prompts should be stored separately from UI components

### 7.4 Scalability

* New tools should be added as independent features
* Existing modules should not depend on each other
* External API clients should be wrapped in reusable service functions
* Future backend or database integration should be possible without rewriting the UI

---

## 8. Module Boundaries

WebUtil contains three independent modules.

```text
WebUtil
├── PDF Tools
├── Image Tools
└── AI Newsletter
```

Rules:

* PDF Tools must not depend on Image Tools
* Image Tools must not depend on PDF Tools
* AI Newsletter must not depend on PDF or Image Tools
* Shared code must live in common utility, component, or service folders
* Module-specific logic must stay inside the module folder

---

## 9. Success Criteria

The MVP is considered successful when:

* Users can process PDF files using merge, split, compress, and remove watermark tools
* Users can process images using resize, convert, and compress tools
* Users can generate an AI-powered newsletter draft from selected news content
* Users can complete the main flow without login
* No user files are stored permanently on a server
* The app works as a single Next.js application
* The codebase remains understandable for new developers and AI coding assistants

---

## 10. Constraints

Technical constraints:

* Frontend: Next.js with TypeScript and Tailwind CSS
* Backend: none
* Database: none
* AI provider: Gemini API
* File storage: none
* Authentication: none

Product constraints:

* MVP must stay simple
* Features must match the defined scope
* AI coding assistants must not add extra features without updating this PRD
* Any new feature must be documented before implementation

---

## 11. Future Considerations

The following features may be considered after v1, but must not be implemented in MVP unless the PRD is updated.

* User accounts
* Saved file history
* Saved newsletter history
* Cloud storage integration
* Team workspace
* Scheduled newsletter generation
* Newsletter templates
* Advanced PDF editing
* Advanced image editing
* Payment or subscription plans
* Backend API service
* Database integration
