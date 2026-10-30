// Gère les emails autorisés à voir les démos (/demos/), sur le VPS, hors du dépôt public.
// Page locale : `npm run demos:admin` (scripts/demos-admin.mjs). En ligne de commande :
//   npm run demos:acces -- ajouter prenom.nom@exemple.fr [arc-gr matheva]
//   npm run demos:acces -- retirer prenom.nom@exemple.fr
//   npm run demos:acces -- liste
// Chaque email devient une ligne `<SHA-256("ypepin-demos:" + email)> 1; # email | date` de
// /opt/apps/ypepin-acces/emails.map, lue par nginx (map $demo_ok de deploy/nginx.conf),
// puis nginx est rechargé. Le site calcule la même empreinte (src/components/8_Projets/DemoAcces.tsx).
// Connexion SSH : alias `ypepin` de ~/.ssh/config, ou variable YPEPIN_SSH (ex. "deploy@1.2.3.4 -p 22").
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const SEL = "ypepin-demos:";
const DOSSIER = "/opt/apps/ypepin-acces";
const F = "/d/emails.map";
export const DEMOS = { "arc-gr": "ARC-GR", matheva: "Matheva", hellboy: "HellBoy", aivocat: "Aivocat", wondo: "Wondo" };
const ssh = (process.env.YPEPIN_SSH ?? "ypepin").split(/\s+/);

export const normaliser = (email) => (email ?? "").trim().toLowerCase();

// Restreint aux caractères usuels : l'email part dans une commande shell distante.
export const valide = (email) => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);

const verifier = (email) => {
  if (!valide(email)) throw new Error(`Email invalide : ${email}`);
  return createHash("sha256").update(SEL + email).digest("hex");
};

// Le fichier est écrit via un conteneur (image du site, déjà présente) : le dossier
// peut avoir été créé par Docker (propriétaire root) au premier démarrage.
const distant = (script, recharger) => {
  const cmd =
    `mkdir -p ${DOSSIER} 2>/dev/null; docker run --rm -v ${DOSSIER}:/d ypepin:latest sh -c 'touch ${F}; ${script}'` +
    (recharger ? " && docker exec ypepin nginx -s reload" : "");
  const r = spawnSync("ssh", [...ssh, cmd], { encoding: "utf8", timeout: 60000 });
  if (r.error) throw new Error(`SSH : ${r.error.message}`);
  if (r.status !== 0) throw new Error(`SSH (${ssh.join(" ")}) : ${r.stderr.trim() || `code ${r.status}`}`);
  return r.stdout;
};

// [{ email, date }] dans l'ordre d'ajout
export const liste = () =>
  distant(`sed -n "s/.*# //p" ${F}`, false)
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [email, date = ""] = l.split(" | ");
      return { email, date };
    });

export const ajouter = (email) => {
  const e = verifier(email);
  const date = new Date().toISOString().slice(0, 10);
  distant(`grep -q ${e} ${F} || echo "${e} 1; # ${email} | ${date}" >> ${F}`, true);
};

export const retirer = (email) => {
  const e = verifier(email);
  distant(`sed -i "/^${e} /d" ${F}`, true);
};

export const message = (email, demos = []) => {
  const choisies = demos.filter((d) => d in DEMOS);
  const liens = (choisies.length ? choisies : Object.keys(DEMOS))
    .map((d) => `- ${DEMOS[d]} : https://ypepin.com/demos/${d}/`)
    .join("\n");
  return {
    sujet: "Votre accès aux démos - Yoel PEPIN",
    corps: `Bonjour,

Merci pour votre intérêt. Votre accès aux démonstrations est ouvert :
${liens}

À la première ouverture, saisissez simplement votre adresse email (${email}).
Les applications sont réelles, les données sont fictives.

Yoel PEPIN`,
  };
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [commande, brut, ...demos] = process.argv.slice(2);
  const email = normaliser(brut);
  try {
    if (commande === "liste") {
      for (const { email, date } of liste()) console.log(`${email}  ${date}`);
    } else if (commande === "ajouter" && valide(email)) {
      ajouter(email);
      const { sujet, corps } = message(email, demos);
      console.log(`Accès ajouté pour ${email}. Message à envoyer :\n\nObjet : ${sujet}\n\n${corps}`);
    } else if (commande === "retirer" && valide(email)) {
      retirer(email);
      console.log(`Accès retiré pour ${email}.`);
    } else {
      console.error("Usage : npm run demos:acces -- ajouter <email> [démos...] | retirer <email> | liste");
      process.exit(1);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
