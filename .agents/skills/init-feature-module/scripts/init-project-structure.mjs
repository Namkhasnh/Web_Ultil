#!/usr/bin/env node
// Scaffolds WebUtil's full base folder structure (placeholders only, no logic).
// Cross-platform: pure Node.js fs/path, no shell required.
// Safe to re-run: never overwrites a file that already exists.
//
// Usage: node init-project-structure.mjs [project-root]

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");

if (!fs.existsSync(path.join(root, "package.json"))) {
  console.warn(
    `Warning: no package.json found in '${root}'. Are you sure this is the project root?`,
  );
}

function mkdirp(relPath) {
  fs.mkdirSync(path.join(root, relPath), { recursive: true });
}

const createdFiles = [];

function writeIfMissing(relPath, content) {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  if (fs.existsSync(full)) {
    console.log(`skipped  ${relPath} (already exists)`);
    return;
  }
  fs.writeFileSync(full, content);
  createdFiles.push(relPath);
  console.log(`created  ${relPath}`);
}

function gitkeep(relPath) {
  mkdirp(relPath);
  const keep = path.join(relPath, ".gitkeep");
  if (!fs.existsSync(path.join(root, keep))) {
    fs.writeFileSync(path.join(root, keep), "");
  }
}

console.log("== app router ==");
const routeFiles = [
  "src/app/api/newsletter/fetch-news/route.ts",
  "src/app/api/newsletter/summarize/route.ts",
];
for (const f of routeFiles) {
  writeIfMissing(
    f,
    `// TODO: implement — see API-CONTRACTS.md for this route\nexport {};\n`,
  );
}

const pageFiles = [
  "src/app/pdf-tools/page.tsx",
  "src/app/image-tools/page.tsx",
  "src/app/ai-newsletter/page.tsx",
];
for (const f of pageFiles) {
  writeIfMissing(f, `// TODO: implement — see PRD.md for this page\nexport {};\n`);
}

console.log("== shared folders ==");
gitkeep("src/components/common");
gitkeep("src/components/ui");
gitkeep("src/__tests__");

const sharedFiles = [
  "src/lib/download.ts",
  "src/lib/file-validation.ts",
  "src/lib/result.ts",
  "src/services/ai/gemini.ts",
  "src/services/news/news-client.ts",
  "src/prompts/newsletter.ts",
  "src/types/index.ts",
];
for (const f of sharedFiles) {
  writeIfMissing(f, "export {};\n");
}

console.log("== test scaffolding (PROJECT-RULES.md §14) ==");
const testFiles = [
  "src/__tests__/file-validation.test.ts",
  "src/__tests__/api-response.test.ts",
  "src/__tests__/newsletter-validation.test.ts",
];
for (const f of testFiles) {
  writeIfMissing(
    f,
    `import { describe, it } from "vitest";\n\n// TODO: add real assertions — see PROJECT-RULES.md §14 for recommended targets\ndescribe.todo("${path.basename(f, ".test.ts")}");\n`,
  );
}

console.log("== feature modules ==");
const modules = ["pdf-tools", "image-tools", "ai-newsletter"];
for (const mod of modules) {
  const base = `src/features/${mod}`;
  gitkeep(`${base}/components`);
  gitkeep(`${base}/hooks`);
  gitkeep(`${base}/lib`);
  writeIfMissing(`${base}/types.ts`, "export {};\n");
  writeIfMissing(`${base}/index.ts`, "export {};\n");
}

console.log("");
console.log(`Done. Base structure created/verified under ${path.join(root, "src")}`);
console.log("Everything created is an empty placeholder — no business logic was added.");
console.log("");
console.log(
  "CREATED_TS_FILES_JSON=" +
    JSON.stringify(createdFiles.filter((f) => /\.(ts|tsx)$/.test(f))),
);
