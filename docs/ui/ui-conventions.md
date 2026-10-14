# WebUtil — Build Spec


## 1. Overview

**WebUtil** is a multi-tool productivity web app with 3 independent modules, running entirely in the browser (no backend):

1. **PDF Tools** — merge, split, compress, remove watermark
2. **Image Tools** — resize, convert, compress
3. **AI Newsletter** — pick a topic + sources → AI summarizes news into a digest

**UX principle:** finish any task in **< 3 clicks**. Files are processed locally and never uploaded to a server.

**Style:** Colorful & Playful — vibrant, modern, fun but still professional (think Notion × Linear × Framer). Each module has its own accent color.

**Tech stack:** Next.js (App Router) + TypeScript + Tailwind CSS. Tailwind utility classes only. Fully responsive (mobile + desktop). Supports **dark mode** and a **mobile hamburger nav**.

**Suggested libraries:**
- Real PDF ops: `pdf-lib` (merge/split/compress/strip annotations — client-side)
- Real image ops: native Canvas API (`canvas.toBlob`) — no library needed
- AI: call any LLM API; include a **sample-data fallback** for offline/error cases

---

## 2. Color palette (design tokens)

### Per-module accent gradients
| Module | Gradient | Used for |
|---|---|---|
| PDF | `#FF5470 → #FF9A3C` (pink→orange) | buttons, active tabs, cards |
| Image | `#3B6EF6 → #22D3EE` (blue→cyan) | buttons, active tabs, cards |
| Newsletter | `#8B5CF6 → #EC4899` (purple→pink) | buttons, active tabs, cards |
| Brand/logo | `#7C3AED → #EC4899` | logo "W", badges |

### Surface / text tokens (light → dark)
| Token | Light | Dark |
|---|---|---|
| `bg` (page background) | `#FBFBFE` | `#0C0D15` |
| `surface` (cards) | `#FFFFFF` | `#15161F` |
| `surface2` (secondary fills, slider track) | `#F4F4F8` | `#1E202C` |
| `text` (primary text) | `#0F1222` | `#F3F4FA` |
| `soft` (secondary text) | `#4B5160` | `#B7BCCB` |
| `mute` (muted text) | `#9098A6` | `#8A91A2` |
| `border` | `#ECECF3` | `#262838` |
| `input border` | `#E7E9F0` | `#2E3142` |

> Implement with CSS variables + a `data-theme="dark"` attribute on the root, or Tailwind `dark:` mode. Persist the choice in `localStorage`.

### Hero background (light)
Layered radial mesh gradient:
```
radial-gradient(1100px 480px at 16% -10%, #EDE6FF, transparent 60%),
radial-gradient(950px 480px at 94% 6%, #FFE6F0, transparent 58%),
radial-gradient(900px 600px at 60% 130%, #E0F2FF, transparent 55%),
#FBFBFE
```
Dark: swap to `#2A1E4A`, `#3A1730`, `#10243A` over a `#0C0D15` base.

---

## 3. Typography

- **Headings:** `Plus Jakarta Sans` (weight 700–800), letter-spacing ~ `-0.02em`/`-0.03em`
- **Body:** `Inter` (weight 400–600)
- Hero H1: `clamp(38px, 6vw, 64px)`
- Sub-page H1: `clamp(30px, 5vw, 40px)`
- Body: 15–16px; secondary text 12.5–14px
- Hero heading has one gradient-text line (`#9061F0 → #EC4899 → #FF9A3C` via `background-clip:text`)

---

## 4. Shared components

### Navbar (sticky top, blurred background)
- Left: "W" logo (9px rounded square, brand gradient) + **WebUtil** wordmark (Plus Jakarta Sans 800)
- Right (desktop): theme toggle (🌙/☀️) · links **PDF Tools** / **Image Tools** / **AI Newsletter** (the active page's link is tinted with that module's accent) · black **Open app** button
- Mobile (< 760px): show only the theme toggle + a **hamburger (☰)** button. Tapping it opens a full-width vertical menu (sticky under the navbar), each link prefixed with an emoji.

### Tool selector tabs
Pills, 13px radius. Active: `surface` background, accent text + border, subtle accent-colored box-shadow. Inactive: `border` outline, `mute` text.

### Upload zone (drag & drop)
- **Dashed** border, large radius, big emoji icon + "Drag & drop … here" + "or **browse**".
- On drag-over: switch border to the accent color + a faint accent-tinted fill.
- Click to open the file picker (hidden file input). Include a "**+ add sample**" button to quickly drop in test files.
- File list: each item = small card (thumbnail/icon + name + meta like size/pages/dimensions + ✕ remove button).

### Primary button (CTA)
12–14px radius, bold white text, module accent gradient fill, soft shadow. When no file is present: ~0.6 opacity and the label changes to a hint ("+ Add sample…").

### Progress bar
`surface2` rounded track, accent gradient fill, shows % with a smooth transition.

### Result (done state)
Green-tinted card (`rgba(22,163,74,.1)`), ✓ icon, a "Done" line, a result-file card + 2 buttons: **⬇ Download** (accent gradient) and **Again** (`surface2` background). `popIn` animation on appear.

---

## 5. Pages

### 5.1 Landing (`/`)
1. **Hero** (mesh gradient background): badge "✦ Three tools, zero friction" → two-line H1 (line 2 is gradient text) → subtitle → 3 module CTA buttons (each its own gradient) → footnote "100% in-browser · Free · Files never leave your device". Three **floating chips** drift around the hero (Merge PDFs / Resize image / AI digest) with a `floaty` animation (hidden on mobile).
2. **Bento module grid** (3 columns, 18px gap): a large PDF tile (spans 2 rows) + an Image tile (spans 2 columns) + a Newsletter tile + a dark stat tile "**< 3 clicks**". Each tile links to its module. Mobile: stacked vertically.
3. **How it works**: 3 step cards (number 1/2/3 in an accent-colored round badge) — *Pick a tool → Drop your files → Download*.
4. **Footer**, minimal: logo + tagline + links Privacy / GitHub / Made with ✦.

### 5.2 PDF Tools (`/pdf`) — pink→orange accent
- Header: eyebrow "📄 PDF TOOLS" + H1 "Work with your PDFs" + a description that changes with the selected tool.
- **Tabs:** 🔗 Merge / ✂️ Split / 🗜️ Compress / 🧼 Remove Watermark.
- **Two-column layout** (desktop): left = upload + file list; right = options panel + action. Mobile: single column.
- **Per-tool options:**
  - *Merge:* combine in the order files appear in the list.
  - *Split:* a "Page range" input (e.g. `1, 3-5, 8` — comma = single pages, hyphen = ranges).
  - *Compress:* 3 radio levels — Light (JPEG 90%, longest side 3,200px) / Balanced (default, JPEG 75%, 2,200px) / Maximum (JPEG 55%, 1,400px). Never upscale. Explain that image quality may decrease while selectable text and forms are preserved. Show exact input/output bytes, bytes saved, and counts of images found/compressed/unchanged; identical sizes remain possible.
  - *Remove Watermark:* an "Auto-detect mode" box — strips the annotation/stamp layer on each page.
- **Real processing with pdf-lib:** merge = copy pages; split = extract pages by range; compress = recompress supported embedded JPEG/raw/Flate 8-bit RGB or grayscale images with browser Canvas, replace image streams at their existing references, then re-save with object streams and level-specific metadata cleanup (Light keeps metadata, Balanced removes Info, Maximum also removes document XMP). Leave masks/transparency, unsupported colors/filters, predictors, inline images, and sources over 8,192px per side or 40 megapixels unchanged. Keep original image streams when recompression is not smaller, and return the original PDF if the final output is not smaller; watermark = delete `Annots` per page. Build a Blob URL for a real download.

### 5.3 Image Tools (`/image`) — blue→cyan accent
- Header: "🖼️ IMAGE TOOLS" + H1 "Transform your images".
- **Tabs:** 📐 Resize / 🔄 Convert / 🗜️ Compress.
- **Two-column layout:** left = upload (multi) + file list + **Settings** panel; right = **Before / After preview**.
- **Per-tool settings:**
  - *Resize:* Width / Height inputs + a "**Lock aspect ratio (16:9)**" checkbox (editing one field auto-computes the other).
  - *Convert:* format picker — **PNG / JPG / WebP** (segmented).
  - *Compress:* a **Quality** slider 10–100%, track fills blue based on value.
- **Preview:** two 4:3 squares side by side (Before gray / After blue-bordered, with a "✓ Ready" badge when done).
- **Real processing with Canvas:** draw the image onto a canvas at the target size → `toBlob(mime, quality)` → Blob URL. The After meta shows real dimensions/size/% saved. Supports multiple images (download sequentially).

### 5.4 AI Newsletter (`/newsletter`) — purple→pink accent
- Centered header: "✨ AI NEWSLETTER" + H1 "Your news, summarized by AI".
- **Idle state:** a "Topic or focus" input + a row of **Sources** chips (AI / Technology / Startups / Science / Design / Business / Security / Crypto — selected chip = purple-pink gradient) + a "**✨ Generate Newsletter**" button.
- **Loading state:** circular spinner + current-step title + a 4-step checklist that ticks off one by one: *Collecting sources → Reading the latest articles → Summarizing with AI → Composing your digest* (the active step pulses).
- **Done state:** digest header (purple-pink gradient) = date + sources + title + intro; body = a list of **article cards** (icon by tag, colored tag pill, source · time, title, 1–2 sentence summary) + an "✨ AI-generated" or "◷ sample" badge. Footer: **📋 Copy** / **⬇ Download as text** / **↺ Generate another** buttons.
- **AI:** call an LLM that returns JSON `{title, intro, articles:[{tag, source, time, title, summary}] x4}`. On error/offline → use a built-in **sample digest** (4 stories across AI/Tech/Startups/Science).

---

## 6. Responsive & accessibility

- Primary mobile breakpoint: **760px**. Below it: navbar → hamburger; every 2-column grid → stacked; bento → vertical column; floating chips hidden; heading fonts scale via `clamp()`.
- Hit targets ≥ 44px. Sufficient contrast (text over gradients is always bold white).
- Keyboard-navigable: tab/enter on every button and input.
- Microinteractions: button hover, upload animation, progress bar, `popIn` for results, `floaty` for chips.

---

## 7. Acceptance ("definition of done")

- [ ] All 4 pages navigate via the navbar, with the correct active state per module color.
- [ ] Dark mode toggle, persisted to localStorage, recolors all tokens.
- [ ] Hamburger works below 760px.
- [ ] PDF merge/split/compress/watermark produce a **downloadable** file (pdf-lib).
- [ ] Image resize/convert/compress process **for real** via Canvas, with Before/After + % saved.
- [ ] Newsletter: idle → loading (4 steps) → done; has Copy/Download; sample fallback when offline.
- [ ] Every task takes ≤ 3 clicks.
