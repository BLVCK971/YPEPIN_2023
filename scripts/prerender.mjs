// Prérendu statique : injecte le HTML de l'application dans dist/index.html.
// Lancé par `npm run build` après le build client et le build SSR (dist-ssr/).
import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const indexPath = `${root}dist/index.html`;
const ssrDir = `${root}dist-ssr`;

const { render } = await import(pathToFileURL(`${ssrDir}/entry-server.js`).href);
const template = await readFile(indexPath, "utf8");

const marker = "<!--app-html-->";
if (!template.includes(marker)) {
  throw new Error(`Marqueur ${marker} introuvable dans dist/index.html`);
}

await writeFile(indexPath, template.replace(marker, render()));
await rm(ssrDir, { recursive: true, force: true });
console.log("Prérendu injecté dans dist/index.html");
