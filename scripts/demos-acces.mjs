// Gère les emails autorisés à voir les démos (/demos/), sur le VPS, hors du dépôt public.
//   npm run demos:acces -- ajouter prenom.nom@exemple.fr [arc-gr matheva]
//   npm run demos:acces -- retirer prenom.nom@exemple.fr
//   npm run demos:acces -- liste
// Chaque email devient une ligne `<SHA-256("ypepin-demos:" + email)> 1; # email` de
// /opt/apps/ypepin-acces/emails.map, lue par nginx (map $demo_ok de deploy/nginx.conf),
// puis nginx est rechargé. Le site calcule la même empreinte (src/components/8_Projets/DemoAcces.tsx).
// Connexion SSH : alias `ypepin` de ~/.ssh/config, ou variable YPEPIN_SSH (ex. "deploy@1.2.3.4 -p 22").
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const SEL = "ypepin-demos:";
const DOSSIER = "/opt/apps/ypepin-acces";
const FICHIER = "emails.map";
const DEMOS = { "arc-gr": "ARC-GR", matheva: "Matheva", hellboy: "HellBoy", aivocat: "Aivocat", wondo: "Wondo" };
const ssh = (process.env.YPEPIN_SSH ?? "ypepin").split(/\s+/);

const [commande, brut, ...demos] = process.argv.slice(2);
const email = brut?.trim().toLowerCase();

// Restreint aux caractères usuels : l'email part dans une commande shell distante.
const valide = (e) => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e ?? "");

// Le fichier est écrit via un conteneur (image du site, déjà présente) : le dossier
// peut avoir été créé par Docker (propriétaire root) au premier démarrage.
const distant = (script) => {
  const cmd =
    `mkdir -p ${DOSSIER} 2>/dev/null; docker run --rm -v ${DOSSIER}:/d ypepin:latest sh -c '${script}'` +
    ` && docker exec ypepin nginx -s reload`;
  const r = spawnSync("ssh", [...ssh, cmd], { stdio: ["inherit", "pipe", "inherit"], encoding: "utf8" });
  if (r.error) throw new Error(`ssh introuvable : ${r.error.message}`);
  if (r.status !== 0) process.exit(r.status ?? 1);
  return r.stdout;
};

if (commande === "liste") {
  process.stdout.write(distant(`touch /d/${FICHIER}; sed -n "s/.*# //p" /d/${FICHIER}`));
} else if ((commande === "ajouter" || commande === "retirer") && valide(email)) {
  const empreinte = createHash("sha256").update(SEL + email).digest("hex");
  const f = `/d/${FICHIER}`;
  if (commande === "ajouter") {
    distant(`touch ${f}; grep -q ${empreinte} ${f} || echo "${empreinte} 1; # ${email}" >> ${f}`);
    const inconnues = demos.filter((d) => !(d in DEMOS));
    if (inconnues.length) console.warn(`Démos inconnues ignorées : ${inconnues.join(", ")}`);
    const choisies = demos.filter((d) => d in DEMOS);
    const liens = (choisies.length ? choisies : Object.keys(DEMOS))
      .map((d) => `- ${DEMOS[d]} : https://ypepin.com/demos/${d}/`)
      .join("\n");
    console.log(`Accès ajouté pour ${email}. Message à envoyer :\n
Bonjour,

Merci pour votre intérêt. Votre accès aux démonstrations est ouvert :
${liens}

À la première ouverture, saisissez simplement votre adresse email (${email}).
Les applications sont réelles, les données sont fictives.

Yoel PEPIN`);
  } else {
    distant(`touch ${f}; sed -i "/^${empreinte} /d" ${f}`);
    console.log(`Accès retiré pour ${email}.`);
  }
} else {
  console.error("Usage : npm run demos:acces -- ajouter <email> [démos...] | retirer <email> | liste");
  process.exit(1);
}
