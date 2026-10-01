// Prérendu statique : injecte le HTML de l'application dans dist/index.html
// (français) et dist/en/index.html (anglais, métadonnées traduites).
// Lancé par `npm run build` après le build client et le build SSR (dist-ssr/).
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
  if (!html.includes(avant)) throw new Error(`Texte introuvable dans index.html pour la version anglaise : ${avant}`);
  return html.split(avant).join(apres);
};

const TITRE_EN = "Yoel PEPIN | FullStack C# / .NET / Python software engineer, freelance Tech Lead";
const TITRE_COURT_EN = "Yoel PEPIN | FullStack C# / Python software engineer, freelance Tech Lead";
const DESCRIPTION_EN =
  "Yoel PEPIN, FullStack C# / .NET / Python software engineer and Tech Lead, freelance (ICEKERA). Architecture, data, AI, AWS / Azure cloud, React and React Native: experience, missions, skills and CV.";
const OG_DESCRIPTION_EN =
  "Architecture, data, AI and cloud: experience, missions and CV of Yoel PEPIN, FullStack C# / .NET / Python software engineer and Tech Lead (ICEKERA freelance).";

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
  page.name = TITRE_EN;
  page.inLanguage = "en-US";

  return html.replace(m[1], () => `\n${JSON.stringify(data, null, 2)}\n    `);
};

const versionAnglaise = (html) => {
  const remplacements = [
    ['<html lang="fr"', '<html lang="en"'],
    [
      "<title>Yoel PEPIN | Ingénieur logiciel FullStack C# / .NET / Python, Tech Lead freelance</title>",
      `<title>${TITRE_EN}</title>`,
    ],
    [
      'content="Yoel PEPIN, ingénieur logiciel FullStack C# / .NET / Python et Tech Lead, freelance (ICEKERA). Architecture, data, IA, cloud AWS / Azure, React et React Native : parcours, missions, compétences et CV."',
      `content="${DESCRIPTION_EN}"`,
    ],
    ['<link rel="canonical" href="https://ypepin.com/" />', '<link rel="canonical" href="https://ypepin.com/en/" />'],
    // og:image et twitter:image : visuel en anglais
    ['content="https://ypepin.com/og-image.jpg"', 'content="https://ypepin.com/og-image-en.jpg"'],
    ['<meta property="og:locale" content="fr_FR" />', '<meta property="og:locale" content="en_US" />'],
    ['<meta property="og:locale:alternate" content="en_US" />', '<meta property="og:locale:alternate" content="fr_FR" />'],
    ['<meta property="og:url" content="https://ypepin.com/" />', '<meta property="og:url" content="https://ypepin.com/en/" />'],
    [
      'content="Yoel PEPIN | Ingénieur logiciel FullStack C# / Python, Tech Lead freelance"',
      `content="${TITRE_COURT_EN}"`,
    ],
    [
      'content="Architecture, data, IA et cloud : parcours, missions et CV de Yoel PEPIN, ingénieur logiciel FullStack C# / .NET / Python et Tech Lead (freelance ICEKERA)."',
      `content="${OG_DESCRIPTION_EN}"`,
    ],
    [
      'content="Yoel PEPIN, ingénieur logiciel FullStack C# / Python"',
      'content="Yoel PEPIN, FullStack C# / Python software engineer"',
    ],
    [
      'content="Architecture, data, IA et cloud : parcours, missions et CV de Yoel PEPIN (freelance ICEKERA)."',
      'content="Architecture, data, AI and cloud: experience, missions and CV of Yoel PEPIN (ICEKERA freelance)."',
    ],
  ];
  let en = remplacements.reduce((h, [a, b]) => remplacer(h, a, b), html);
  en = jsonLdEn(en);
  if (/[àâçéèêëîïôûù]/.test(en.split("<body>")[0].replace(/<!--[\s\S]*?-->/g, "").replaceAll("Université des Antilles", "")))
    console.warn("Attention : il reste peut-être du français dans le <head> de la version anglaise");
  return en;
};

await writeFile(indexPath, template.replace(marker, render("fr")));
await mkdir(`${root}dist/en`, { recursive: true });
await writeFile(`${root}dist/en/index.html`, versionAnglaise(template).replace(marker, render("en")));
await rm(ssrDir, { recursive: true, force: true });
console.log("Prérendu injecté dans dist/index.html et dist/en/index.html");
