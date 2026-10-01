// Évalue seed() de demos/arc-gr/data.ts hors navigateur et l'écrit en JSON
// (<dossier>/seed.json), pour gen-rapports.py.
//   node demos/arc-gr/outils/gen-seed.mjs <dossier temporaire>
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = fileURLToPath(new URL("../..", import.meta.url)).replace(/[\/]$/, "");
const out = process.argv[2];
const tr = (f) => ts.transpileModule(readFileSync(f, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
writeFileSync(`${out}/runtime.mjs`, tr(`${root}/shared/runtime.ts`));
writeFileSync(`${out}/data.mjs`, tr(`${root}/arc-gr/data.ts`).replace(`"../shared/runtime"`, `"./runtime.mjs"`));
const { seed } = await import(pathToFileURL(`${out}/data.mjs`).href);
writeFileSync(`${out}/seed.json`, JSON.stringify(seed(), null, 1));
console.log("ok");
