// Page locale pour gérer l'accès aux démos : `npm run demos:admin` ouvre http://localhost:5181.
// Ajoute / retire un email (via SSH, scripts/demos-acces.mjs) et prépare le mail à envoyer.
// Écoute uniquement en local ; chaque appel exige le jeton de la page (en-tête X-Jeton) et
// l'hôte localhost, pour qu'un autre site ouvert dans le navigateur ne puisse pas s'en servir.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { ajouter, DEMOS, liste, message, normaliser, retirer, valide } from "./demos-acces.mjs";

const PORT = 5181;
const JETON = randomBytes(24).toString("hex");
const page = (await readFile(new URL("demos-admin.html", import.meta.url), "utf8"))
  .replace("__JETON__", JETON)
  .replace("__DEMOS__", JSON.stringify(DEMOS));

const json = (res, statut, donnees) => {
  res.writeHead(statut, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(donnees));
};

const corps = async (req) => {
  let texte = "";
  for await (const morceau of req) texte += morceau;
  return JSON.parse(texte || "{}");
};

createServer(async (req, res) => {
  if (req.headers.host !== `localhost:${PORT}` && req.headers.host !== `127.0.0.1:${PORT}`) {
    res.writeHead(403).end();
    return;
  }
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'",
    });
    res.end(page);
    return;
  }
  if (!req.url.startsWith("/api/")) return json(res, 404, { erreur: "Introuvable" });
  if (req.headers["x-jeton"] !== JETON) return json(res, 403, { erreur: "Jeton invalide : rechargez la page" });
  try {
    if (req.method === "GET" && req.url === "/api/liste") return json(res, 200, liste());
    const { email: brut, demos = [] } = await corps(req);
    const email = normaliser(brut);
    if (!valide(email)) return json(res, 400, { erreur: `Email invalide : ${brut ?? ""}` });
    if (req.method === "POST" && req.url === "/api/ajouter") {
      ajouter(email);
      return json(res, 200, { email, ...message(email, demos) });
    }
    if (req.method === "POST" && req.url === "/api/retirer") {
      retirer(email);
      return json(res, 200, { email });
    }
    json(res, 404, { erreur: "Introuvable" });
  } catch (err) {
    json(res, 500, { erreur: err.message });
  }
}).listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Accès aux démos : ${url}  (Ctrl+C pour arrêter)`);
  if (!process.argv.includes("--sans-navigateur")) {
    const [cmd, args] =
      process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : [process.platform === "darwin" ? "open" : "xdg-open", [url]];
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
  }
});
