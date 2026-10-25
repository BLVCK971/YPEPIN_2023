// Prérendu statique : injecte le HTML de l'application dans dist/index.html
// (français) et dist/en/index.html (anglais, métadonnées traduites).
// Lancé par `npm run build` après le build client et le build SSR (dist-ssr/).
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

// Remplacement strict : échoue si le texte attendu a changé dans index.html
const remplacer = (html, avant, apres) => {
  if (!html.includes(avant)) throw new Error(`Texte introuvable dans index.html : ${avant}`);
  return html.split(avant).join(apres);
};

// Textes du <head> : titre ~60 caractères, description ~155 (au-delà, Google tronque)
const TITRE_FR = "Yoel PEPIN | Développeur freelance C# .NET &amp; Python, Guadeloupe";
const TITRE_EN = "Yoel PEPIN | Freelance C# .NET &amp; Python software engineer";
const DESCRIPTION_FR =
  "Ingénieur logiciel et Tech Lead freelance (ICEKERA) en Guadeloupe, en France et à distance : applications web et mobiles, API .NET et Python, IA, data, cloud.";
const DESCRIPTION_EN =
  "FullStack software engineer and freelance Tech Lead (ICEKERA) in Guadeloupe, France and remotely: web and mobile apps, .NET and Python APIs, AI, data and cloud.";
const OG_DESCRIPTION_FR =
  "Applications web et mobiles, API .NET et Python, IA locale, data et cloud : projets, parcours et CV de Yoel PEPIN, ingénieur logiciel et Tech Lead freelance (ICEKERA).";
const OG_DESCRIPTION_EN =
  "Web and mobile apps, .NET and Python APIs, local AI, data and cloud: projects, experience and CV of Yoel PEPIN, freelance software engineer and Tech Lead (ICEKERA).";
const texteJson = (html) => html.replaceAll("&amp;", "&");

// Données structurées : mêmes entités (@id) que la page française, textes traduits
const jsonLdEn = (html) => {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("JSON-LD introuvable dans index.html");
  const data = JSON.parse(m[1]);
  const noeud = (type) => {
    const n = data["@graph"].find((x) => x["@type"] === type);
    if (!n) throw new Error(`Nœud JSON-LD ${type} introuvable`);
    return n;
  };

  const person = noeud("Person");
  person.jobTitle = "FullStack C# / Python software engineer";
  person.description =
    "FullStack software engineer (C# / Python) with a strong focus on architecture, data and cloud. Tech Lead, certified SAFe Scrum Master, freelance under the ICEKERA brand.";
  const diplomes = {
    "Master MIAGE, spécialisation Data Science": "Master's degree in MIAGE, Data Science specialisation",
    "Licence MIAGE": "Bachelor's degree in MIAGE",
    "CS50x et CS50AI": "CS50x and CS50AI",
  };
  for (const c of person.hasCredential) c.name = diplomes[c.name] ?? c.name;
  person.knowsAbout = person.knowsAbout.map((k) => (k === "Intelligence artificielle" ? "Artificial intelligence" : k));
  person.award = ["Hack my Flat hackathon (IAD), 1st place, 2022"];

  const org = noeud("Organization");
  org.description = "Yoel PEPIN's freelance business: custom software development and IT consulting.";
  org.hasOfferCatalog.name = "ICEKERA services";
  const offres = [
    ["Custom development", "Websites, CRMs, client portals and business applications, from design to production."],
    ["Local and confidential AI", "AI assistants (RAG, local LLMs) that work on your documents without any data leaving your premises."],
    ["IT audit, migration and security", "Taking back control of an information system: data, servers, business software and access."],
    ["Automation and data", "Data collection bots, ETL, large-scale processing and Power BI reports."],
    ["Part-time Tech Lead and architect", "Product framing, architecture, code review and Agile facilitation."],
  ];
  if (offres.length !== org.hasOfferCatalog.itemListElement.length) throw new Error("Offres JSON-LD : traduction EN incomplète");
  org.hasOfferCatalog.itemListElement.forEach((o, i) => {
    o.itemOffered.name = offres[i][0];
    o.itemOffered.description = offres[i][1];
  });

  const page = noeud("ProfilePage");
  page["@id"] = "https://ypepin.com/en/#profilepage";
  page.url = "https://ypepin.com/en/";
  page.name = texteJson(TITRE_EN);
  page.inLanguage = "en-US";
  page.primaryImageOfPage.url = "https://ypepin.com/og-image-en.jpg";

  return html.replace(m[1], () => `\n${JSON.stringify(data, null, 2)}\n    `);
};

const versionAnglaise = (html) => {
  const remplacements = [
    ['<html lang="fr"', '<html lang="en"'],
    // <title>, og:title et twitter:title
    [TITRE_FR, TITRE_EN],
    [`content="${DESCRIPTION_FR}"`, `content="${DESCRIPTION_EN}"`],
    // og:description et twitter:description
    [`content="${OG_DESCRIPTION_FR}"`, `content="${OG_DESCRIPTION_EN}"`],
    ['<link rel="canonical" href="https://ypepin.com/" />', '<link rel="canonical" href="https://ypepin.com/en/" />'],
    // og:image et twitter:image : visuel en anglais
    ['content="https://ypepin.com/og-image.jpg"', 'content="https://ypepin.com/og-image-en.jpg"'],
    ['<meta property="og:locale" content="fr_FR" />', '<meta property="og:locale" content="en_US" />'],
    ['<meta property="og:locale:alternate" content="en_US" />', '<meta property="og:locale:alternate" content="fr_FR" />'],
    ['<meta property="og:url" content="https://ypepin.com/" />', '<meta property="og:url" content="https://ypepin.com/en/" />'],
    // og:image:alt et twitter:image:alt
    [
      'content="Yoel PEPIN, ingénieur logiciel FullStack C# / Python"',
      'content="Yoel PEPIN, FullStack C# / Python software engineer"',
    ],
  ];
  let en = remplacements.reduce((h, [a, b]) => remplacer(h, a, b), html);
  en = jsonLdEn(en);
  if (/[àâçéèêëîïôûù]/.test(en.split("<body>")[0].replace(/<!--[\s\S]*?-->/g, "").replaceAll("Université des Antilles", "")))
    console.warn("Attention : il reste peut-être du français dans le <head> de la version anglaise");
  return en;
};

// Performance (Core Web Vitals) : la feuille de style (~11 Ko compressée) est
// insérée dans la page au lieu d'être une requête bloquante de plus, et la
// police latine est préchargée (le titre h1 s'affiche sans changer de police).
const assets = await readdir(`${root}dist/assets`);
const optimiser = async (html) => {
  const lien = html.match(/<link rel="stylesheet" crossorigin href="\/assets\/([^"]+\.css)">/);
  if (!lien) throw new Error("Feuille de style Vite introuvable dans dist/index.html");
  const css = await readFile(`${root}dist/assets/${lien[1]}`, "utf8");
  if (css.includes("</style")) throw new Error("CSS non insérable tel quel dans <style>");
  const police = assets.find((f) => /^inter-latin-wght-normal-.+\.woff2$/.test(f));
  if (!police) throw new Error("Police Inter latine introuvable dans dist/assets");
  return remplacer(
    html,
    lien[0],
    `<link rel="preload" href="/assets/${police}" as="font" type="font/woff2" crossorigin>
    <style>${css}</style>`
  );
};

const fr = await optimiser(template);
await writeFile(indexPath, fr.replace(marker, render("fr")));
await mkdir(`${root}dist/en`, { recursive: true });
await writeFile(`${root}dist/en/index.html`, versionAnglaise(fr).replace(marker, render("en")));
await rm(ssrDir, { recursive: true, force: true });
console.log("Prérendu injecté dans dist/index.html et dist/en/index.html");
