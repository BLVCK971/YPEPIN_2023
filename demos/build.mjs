// Build des démos interactives : reprend le front d'un projet client tel quel
// (dépôt voisin, jamais modifié) et y injecte la fausse API de
// demos/<nom>/mock.ts. Résultat dans public/demos/<nom>/, commité : la CI
// d'ypepin n'a pas accès aux dépôts clients, d'où un build manuel, hors de
// `npm run build`.
//
//   npm run demos                 # toutes les démos
//   npm run demos -- arc-gr       # une seule
//
// Trois sortes de fronts :
// - "vite" : application React compilée avec SA version de Vite et de React ;
// - "static" : interface HTML/JS servie telle quelle par le backend, copiée,
//   la fausse API étant compilée à part (Vite d'ypepin) et chargée avant elle ;
// - "expo" : application Expo Router exportée pour le web par SON Expo, depuis
//   une copie temporaire du dépôt (app.json y est adapté à la démo), la fausse
//   API étant chargée avant le bundle comme pour "static".
//
// Emplacement des dépôts : dossiers voisins par défaut, ou variable <NOM>_DIR
// (ARC_GR_DIR, MATHEVA_DIR, HELLBOY_DIR, AIVOCAT_DIR, WONDO_DIR) pointant sur la racine du dépôt.
// Fichiers statiques propres à une démo (exemples téléchargeables, images...) :
// demos/<nom>/public/, copiés à la racine de la démo.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const repo = (envVar, fallback) => process.env[envVar] ?? path.resolve(root, "..", fallback);

const DEMOS = {
  "arc-gr": { kind: "vite", dir: repo("ARC_GR_DIR", "ARC_GR"), router: "browser" },
  matheva: { kind: "vite", dir: repo("MATHEVA_DIR", "Matheva"), router: "browser" },
  // Monorepo : le front est dans apps/web, routage par hash (pas de basename).
  hellboy: { kind: "vite", dir: path.join(repo("HELLBOY_DIR", "HellBoy"), "apps/web"), router: "hash", alias: { "@": "src" } },
  aivocat: { kind: "static", dir: path.join(repo("AIVOCAT_DIR", "avocat-local-ai"), "app/ui") },
  // App mobile Expo (version web) ; backend, back-office et docs restent hors de la copie.
  wondo: { kind: "expo", dir: repo("WONDO_DIR", "DojoApp"), exclude: ["backend", "dashboard", "deploy", "docs", "tools"] },
};

const [, , cmd, ...rest] = process.argv;

if (cmd === "--one") {
  await buildOne(rest[0]);
} else {
  const names = cmd ? [cmd, ...rest] : Object.keys(DEMOS);
  for (const name of names) {
    if (!DEMOS[name]) throw new Error(`Démo inconnue : ${name} (connues : ${Object.keys(DEMOS).join(", ")})`);
    // Un processus par démo : chaque build tourne depuis le dossier du client
    // (Tailwind résout ses `content` par rapport au répertoire courant).
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--one", name], {
      cwd: DEMOS[name].dir,
      stdio: "inherit",
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}

async function buildOne(name) {
  const demo = DEMOS[name];
  const base = `/demos/${name}`;
  const mockPath = path.join(root, "demos", name, "mock.ts").replaceAll("\\", "/");
  const outDir = path.join(root, "public/demos", name);

  if (demo.kind === "vite") await buildVite(name, demo, base, mockPath, outDir);
  else if (demo.kind === "expo") await buildExpo(name, demo, base, mockPath, outDir);
  else await buildStatic(name, demo, base, mockPath, outDir);

  const extra = path.join(root, "demos", name, "public");
  if (existsSync(extra)) cpSync(extra, outDir, { recursive: true });
  // Fichiers SEO du client : inutiles (et trompeurs) dans la démo.
  for (const f of ["robots.txt", "sitemap.xml"]) rmSync(path.join(outDir, f), { force: true });
  console.log(`✓ démo ${name} → public/demos/${name}/`);
}

// Import ESM d'un paquet installé, cherché dans les node_modules en remontant
// depuis `fromDir` (dépôt pnpm, ou workspaces npm dont les paquets sont hissés).
async function importFrom(fromDir, pkg) {
  for (let dir = fromDir; ; dir = path.dirname(dir)) {
    const pkgDir = path.join(dir, "node_modules", pkg);
    if (existsSync(path.join(pkgDir, "package.json"))) {
      const meta = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
      const exp = typeof meta.exports === "string" ? meta.exports : meta.exports?.["."];
      const entry =
        typeof exp === "string" ? exp : (exp?.import?.default ?? exp?.import ?? exp?.default ?? meta.module ?? meta.main);
      return import(pathToFileURL(path.join(pkgDir, entry)).href);
    }
    if (path.dirname(dir) === dir) throw new Error(`${pkg} introuvable depuis ${fromDir}`);
  }
}

function marquerDemo(html) {
  return html
    .replace(/\s*<link rel="canonical"[^>]*>/, "")
    .replace(/<title>/, "<title>Démo · ")
    .replace("<head>", '<head>\n    <meta name="robots" content="noindex, nofollow" />');
}

async function buildVite(name, demo, base, mockPath, outDir) {
  const clientDir = demo.dir;
  const srcDir = path.join(clientDir, "src").replaceAll("\\", "/");
  if (!existsSync(`${srcDir}/main.tsx`)) throw new Error(`Front introuvable : ${clientDir}`);

  // Vite et plugin-react du projet client (versions qu'il utilise en prod).
  const vite = await importFrom(clientDir, "vite");
  const react = (await importFrom(clientDir, "@vitejs/plugin-react")).default;

  const replaceStrict = (code, from, to, where) => {
    if (!code.includes(from)) throw new Error(`[démo ${name}] « ${from} » introuvable dans ${where}`);
    return code.split(from).join(to);
  };

  const demoPlugin = {
    name: "ypepin-demo",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0].replaceAll("\\", "/");
      if (!file.startsWith(srcDir) || !/\.(tsx|ts|jsx|js)$/.test(file)) return null;
      let out = code;
      if (file === `${srcDir}/main.tsx`) {
        // La fausse API doit être installée avant le premier module de l'app.
        out = `import ${JSON.stringify(mockPath)};\n` + out;
        if (demo.router === "browser") {
          out = replaceStrict(out, "<BrowserRouter>", `<BrowserRouter basename="${base}">`, "main.tsx");
        }
      }
      // Liens <a href="/..."> hors routeur : on les garde dans la démo.
      out = out.replace(/href=(["'`])\/(?!\/)/g, `href=$1${base}/`);
      return out === code ? null : { code: out, map: null };
    },
    transformIndexHtml: marquerDemo,
  };

  const alias = Object.fromEntries(
    Object.entries(demo.alias ?? {}).map(([k, v]) => [k, path.join(clientDir, v).replaceAll("\\", "/")]),
  );

  await vite.build({
    root: clientDir,
    configFile: false,
    base: `${base}/`,
    logLevel: "warn",
    plugins: [react(), demoPlugin],
    resolve: { alias },
    build: { outDir, emptyOutDir: true, sourcemap: false },
  });
}

async function buildStatic(name, demo, base, mockPath, outDir) {
  const uiDir = demo.dir;
  if (!existsSync(path.join(uiDir, "index.html"))) throw new Error(`Interface introuvable : ${uiDir}`);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(uiDir)) cpSync(path.join(uiDir, f), path.join(outDir, f), { recursive: true });

  // L'interface est servie par le backend sous /static/ : chemins relatifs à la démo,
  // et fausse API chargée (script classique, donc dans l'ordre) avant le premier script.
  let html = readFileSync(path.join(outDir, "index.html"), "utf8");
  html = html.replaceAll('"/static/', `"${base}/`);
  writeFileSync(path.join(outDir, "index.html"), marquerDemo(injecterMock(html, name, base, "index.html")));
  await compilerMock(mockPath, outDir);
}

// Fausse API chargée (script classique, donc exécuté dans l'ordre) avant le
// premier script de l'interface.
function injecterMock(html, name, base, where) {
  const firstScript = html.search(/<script\s+src=/);
  if (firstScript < 0) throw new Error(`[démo ${name}] aucun <script src> dans ${where}`);
  return html.slice(0, firstScript) + `<script src="${base}/demo-mock.js"></script>\n` + html.slice(firstScript);
}

// Fausse API compilée en un seul script IIFE (demo-mock.js) avec le Vite d'ypepin.
async function compilerMock(mockPath, outDir) {
  const vite = await importFrom(root, "vite");
  await vite.build({
    root,
    configFile: false,
    logLevel: "warn",
    publicDir: false,
    build: {
      outDir,
      emptyOutDir: false,
      sourcemap: false,
      lib: { entry: mockPath, formats: ["iife"], name: "DemoMock", fileName: () => "demo-mock.js" },
    },
  });
}

async function buildExpo(name, demo, base, mockPath, outDir) {
  const clientDir = demo.dir;
  const cli = path.join(clientDir, "node_modules/expo/bin/cli");
  if (!existsSync(path.join(clientDir, "app.json")) || !existsSync(cli)) {
    throw new Error(`Projet Expo introuvable, ou dépendances non installées : ${clientDir}`);
  }

  // Expo lit app.json à la racine du projet, que la démo doit adapter : on
  // travaille donc sur une copie, hors des dépôts, le dépôt client n'étant
  // jamais modifié.
  const work = path.join(os.tmpdir(), `ypepin-demo-${name}`);
  supprimerCopie(work);
  mkdirSync(work, { recursive: true });
  try {
    // Ni dépendances ni artefacts, ni fichiers cachés (.git, .env*...) : les
    // secrets du client n'ont rien à faire dans la copie, et l'URL de l'API est
    // imposée plus bas. `exclude` écarte ce que Metro n'a pas à parcourir.
    const exclus = new Set(["node_modules", "dist", ...(demo.exclude ?? [])]);
    for (const f of readdirSync(clientDir)) {
      if (exclus.has(f) || f.startsWith(".")) continue;
      cpSync(path.join(clientDir, f), path.join(work, f), { recursive: true });
    }
    // Dépendances du client partagées par lien (jonction sous Windows : aucun droit requis).
    symlinkSync(path.join(clientDir, "node_modules"), path.join(work, "node_modules"), "junction");

    // baseUrl : l'app vit sous /demos/<nom>/. Sortie "single" : une SPA (un seul
    // index.html) servie pour toute route par le repli nginx de la démo, là où
    // "static" produirait une page par route, inconnue des routes dynamiques.
    const appJsonPath = path.join(work, "app.json");
    const appJson = JSON.parse(readFileSync(appJsonPath, "utf8"));
    appJson.expo.experiments = { ...appJson.expo.experiments, baseUrl: base };
    appJson.expo.web = { ...appJson.expo.web, output: "single" };
    writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

    // API relative : même origine que la page, donc servie par la fausse API.
    // --clear : le cache de Metro garde des transformations qui figent des chemins
    // et des variables EXPO_PUBLIC_* (le dossier des routes, l'URL de l'API) ;
    // repris d'un autre build, il produirait une app sans écrans.
    const r = spawnSync(process.execPath, [cli, "export", "--platform", "web", "--output-dir", "dist", "--clear"], {
      cwd: work,
      stdio: "inherit",
      env: { ...process.env, EXPO_PUBLIC_API_URL: "/api", EXPO_NO_TELEMETRY: "1", CI: "1" },
    });
    if (r.status !== 0) throw new Error(`[démo ${name}] échec de « expo export »`);

    rmSync(outDir, { recursive: true, force: true });
    cpSync(path.join(work, "dist"), outDir, { recursive: true });
  } finally {
    supprimerCopie(work);
  }

  rangerAssetsExternes(name, base, outDir);
  // Manifeste d'EAS Update : sans usage pour une démo web.
  rmSync(path.join(outDir, "metadata.json"), { force: true });
  for (const f of readdirSync(outDir).filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(path.join(outDir, f), "utf8");
    writeFileSync(path.join(outDir, f), marquerDemo(injecterMock(html, name, base, f)));
  }
  await compilerMock(mockPath, outDir);
}

// Supprime la copie de travail. Le lien node_modules est retiré d'abord, et
// seul : un effacement récursif qui le suivrait viderait les dépendances du client.
function supprimerCopie(work) {
  if (!existsSync(work)) return;
  const lien = path.join(work, "node_modules");
  try {
    if (lstatSync(lien).isSymbolicLink()) {
      try {
        unlinkSync(lien);
      } catch {
        rmdirSync(lien); // jonction Windows
      }
    }
  } catch {
    // pas de lien : copie interrompue avant sa création
  }
  if (existsSync(lien)) throw new Error(`Lien ${lien} impossible à retirer : copie laissée en place`);
  rmSync(work, { recursive: true, force: true });
}

// Metro nomme les images situées hors du projet (celles des paquets, puisque
// node_modules est un lien) d'après leur chemin relatif, « ../ » devenant « _ » :
// assets/_______DOSSIER/Client/node_modules/... Ces URL exposeraient
// l'arborescence de la machine de build : on les range sous assets/vendor/.
function rangerAssetsExternes(name, base, outDir) {
  const assets = path.join(outDir, "assets");
  if (!existsSync(assets)) return;
  const trouves = [];
  const chercher = (rel) => {
    for (const e of readdirSync(path.join(assets, rel), { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (e.name === "node_modules") trouves.push(`${rel}/node_modules`);
      else chercher(`${rel}/${e.name}`);
    }
  };
  for (const e of readdirSync(assets, { withFileTypes: true })) {
    if (e.isDirectory() && e.name.startsWith("_")) chercher(e.name);
  }
  if (trouves.length === 0) return;

  const vendor = path.join(assets, "vendor");
  for (const rel of trouves) {
    if (existsSync(vendor)) {
      cpSync(path.join(assets, rel), vendor, { recursive: true });
    } else {
      renameSync(path.join(assets, rel), vendor);
    }
    rmSync(path.join(assets, rel.split("/")[0]), { recursive: true, force: true });
  }

  const fichiersJs = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? fichiersJs(path.join(dir, e.name)) : e.name.endsWith(".js") ? [path.join(dir, e.name)] : [],
    );
  for (const js of fichiersJs(outDir)) {
    let code = readFileSync(js, "utf8");
    const avant = code;
    for (const rel of trouves) code = code.split(`${base}/assets/${rel}/`).join(`${base}/assets/vendor/`);
    for (const rel of trouves) {
      if (code.includes(rel)) throw new Error(`[démo ${name}] chemin d'asset non réécrit dans ${js} : ${rel}`);
    }
    if (code !== avant) writeFileSync(js, code);
  }
}
