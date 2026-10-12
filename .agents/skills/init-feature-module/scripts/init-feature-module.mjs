#!/usr/bin/env node
// Scaffolds one feature module under src/features/<module-name>/ (placeholders only).
// Cross-platform: pure Node.js fs/path, no shell required.
// Safe to re-run: never overwrites a file that already exists.
//
// Usage: node init-feature-module.mjs <module-name-kebab-case> [project-root]

import fs from "node:fs";
import path from "node:path";

const moduleName = process.argv[2];
const root = path.resolve(process.argv[3] || ".");

if (!moduleName) {
  console.error(
    "Usage: node init-feature-module.mjs <module-name-kebab-case> [project-root]",
  );
  process.exit(1);
}

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(moduleName)) {
  console.error(
    `Error: '${moduleName}' is not kebab-case. Expected something like 'video-tools'.`,
  );
  process.exit(1);
}

const base = `src/features/${moduleName}`;
const baseFull = path.join(root, base);

if (fs.existsSync(baseFull) && fs.readdirSync(baseFull).length > 0) {
  console.warn(
    `Note: ${base} already exists and is non-empty. Will only fill in missing pieces.`,
  );
}

function gitkeep(relPath) {
  const full = path.join(root, relPath);
  fs.mkdirSync(full, { recursive: true });
  const keep = path.join(full, ".gitkeep");
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, "");
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

gitkeep(`${base}/components`);
gitkeep(`${base}/hooks`);
gitkeep(`${base}/lib`);
writeIfMissing(`${base}/types.ts`, "export {};\n");
writeIfMissing(`${base}/index.ts`, "export {};\n");

console.log("");
console.log(`Created feature module skeleton at ${base}`);
console.log(
  "Reminder: this module must not import from other feature modules (see PROJECT-RULES.md §3 — Module Boundary Rules).",
);
console.log("");
console.log(
  "CREATED_TS_FILES_JSON=" +
    JSON.stringify(createdFiles.filter((f) => /\.(ts|tsx)$/.test(f))),
);
