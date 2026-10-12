---
name: explain-code
description: >-
  Explains a concept, a piece of code, or how a feature/workflow works inside the
  WebUtil project (PDF Tools, Image Tools, AI Newsletter) — NOT for writing or modifying
  code. Use this whenever the user asks to explain, walk through, clarify, or help
  understand something — phrases like "giải thích", "explain this", "concept này là gì",
  "hiểu sao về", "workflow này hoạt động thế nào", "code này làm gì", "tại sao lại làm
  vậy", "how does X work", "what is the flow for X" — or when the user pastes a code
  block or file and asks what it does. Always trigger this skill before answering — it
  requires asking the user once whether they want the explanation in Tiếng Việt or
  English before writing the actual explanation.
---

# Explain Code

## What this skill is for

This skill is for **explaining**, not for **building**. If the user wants new code
written or existing code changed, that's a normal coding task — don't route it through
this skill. This skill is for when the goal is understanding: a concept ("thế nào là
client-side processing trong project này?"), a piece of code someone is reading, or a
cross-module workflow ("luồng AI Newsletter chạy từ đầu đến cuối như thế nào?").

WebUtil has five docs that define how the system is supposed to work:
`PROJECT-RULES.md`, `ARCHITECTURE.md`, `PRD.md`, `API-CONTRACTS.md`, `DATA-SCHEMA.md`.
A good explanation in this project almost always means connecting the code/concept back
to *why* the docs say to do it that way — not just describing what the code does in
isolation.

## Step 1 — Always ask language preference first, before writing any explanation

This is a hard requirement, not optional. Before producing the actual explanation, ask
the user once whether they want it in Vietnamese or English. Use a single short question
rather than a wall of text — `ask_user_input_v0` is a good fit here since it's a single
pick-one question:

> Question: "Bạn muốn mình giải thích bằng Tiếng Việt hay English?"
> Options: ["Tiếng Việt", "English"]

Exceptions — skip asking and proceed directly if:
- The user already explicitly stated a language preference earlier in this conversation
  (e.g. they said "giải thích bằng tiếng Anh giúp mình" or "explain in Vietnamese please").
  Reuse that preference for the rest of the conversation without asking again.
- The user's request is itself a clear, unambiguous instruction that already implies the
  answer format isn't a back-and-forth (rare for this skill, but e.g. "explain this in
  both languages" — then just do both, no need to ask).

Don't try to infer language purely from "what language did they type the question in" —
someone may type in Vietnamese but want the English technical explanation (or vice versa,
common when the explanation needs to go into English documentation/comments). Asking
directly avoids guessing wrong on a multi-paragraph answer.

## Step 2 — Identify what's actually being explained

Figure out which of these the request is, since it changes how you structure the answer:

1. **A concept** — e.g. "client-side processing là gì", "tại sao module không được import
   lẫn nhau", "ApiResponse<T> dùng để làm gì". Anchor the explanation in the relevant doc
   section(s) (`view` the doc files in `@docs` if you haven't already loaded them
   this conversation) and use the project's own examples rather than generic textbook
   examples when one exists.

2. **A piece of code** — the user pasted a snippet or pointed at a file. Read the actual
   code (don't explain from memory/assumption if a file path was given — `view` it first).
   Walk through it in the order execution actually happens, not necessarily top-to-bottom
   in the file.

3. **A workflow / feature flow** — e.g. "luồng Merge PDF từ upload đến download",
   "AI Newsletter flow hoạt động sao". Trace the full path across files/layers (UI →
   feature `lib` → API Route → service, as relevant) using `ARCHITECTURE.md` §6
   (Data Flow) and `API-CONTRACTS.md` as the source of truth for what *should* happen,
   then check actual code to confirm what *does* happen — call out clearly if they
   diverge.

If it's ambiguous which of the three this is, a quick clarifying question is fine
(combine it with the language question in the same `ask_user_input_v0` call if both are
needed, to keep it to one round-trip).

## Step 3 — Decide if a diagram helps

For workflow/flow explanations spanning multiple steps or files, a visual sequence often
communicates faster than prose alone — follow the normal visual-output decision process
(if the user used words like "diagram", "vẽ sơ đồ", "show me the flow", or the workflow
has enough steps that prose would require constant re-reading, use the Visualizer for an
inline diagram; otherwise plain text/code walkthrough is enough). Don't force a diagram
into every explanation — a single-concept or single-function explanation usually doesn't
need one.

## Step 4 — Write the explanation

Structure depends on what's being explained, but in general:

**For a concept:**
- One or two sentence plain-language definition first.
- Why it matters *in this project specifically* (cite the doc rule, not just abstract
  theory).
- A short concrete example from the codebase if one exists.

**For a code snippet/file:**
- One-sentence summary of what it's for.
- Walk through the logic in execution order, explaining the *why* behind non-obvious
  choices (e.g. why a particular hook exists, why a type is shaped a certain way) rather
  than re-narrating each line in English/Vietnamese.
- Note any place the code touches a project rule (e.g. "this stays client-side because
  PROJECT-RULES.md §4 forbids uploading PDFs to the server").

**For a workflow:**
- High-level path first (one line, arrow-style, like the docs already do:
  `Upload → Validate → Process → Download`).
- Then expand each step with the actual responsible file/function.
- Call out module boundaries explicitly when the flow crosses them (it shouldn't, for
  PDF/Image Tools — if it does, that's worth flagging as a possible rule violation rather
  than explaining it as if it were intentional).

Keep explanations conversational and scoped to what was asked — don't dump the entire
doc back at the user. If something is genuinely undocumented or unclear in the project
docs, say so plainly instead of inventing an explanation.

## Step 5 — Offer follow-up, don't over-deliver

End by inviting a deeper dive into any part rather than preemptively explaining every
adjacent concept. If the explanation revealed something that looks like it violates
`PROJECT-RULES.md` or `ARCHITECTURE.md` (e.g. a module importing across boundaries, a
file ending up in the wrong folder), mention it — that's valuable signal even though it
wasn't explicitly asked for.