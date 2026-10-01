// Serveur local pour essayer les démos buildées (public/demos/), avec le même
// fallback SPA par démo que nginx en prod (deploy/nginx.conf).
//   node demos/serve.mjs          # http://localhost:5180/demos/arc-gr/
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));
const port = Number(process.env.PORT ?? 5180);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json", ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".woff2": "font/woff2" };

const isFile = (p) => stat(p).then((s) => s.isFile(), () => false);

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(publicDir, url);
  if (!file.startsWith(publicDir)) return res.writeHead(403).end();
  if (!(await isFile(file))) {
    const demo = /^\/demos\/([^/]+)\//.exec(url);
    if (await isFile(path.join(file, "index.html"))) file = path.join(file, "index.html");
    else if (demo) file = path.join(publicDir, "demos", demo[1], "index.html");
    else return res.writeHead(404).end("404");
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}).listen(port, () => console.log(`Démos sur http://localhost:${port}/demos/`));
