// Vérifie deploy/nginx.conf (`nginx -t`) avec l'image nginx du Dockerfile, sur le PC.
// La CI ne teste pas cette config : une erreur ne casse pas le build de l'image mais
// empêche le conteneur de démarrer sur le VPS. À lancer (Docker Desktop démarré)
// avant de pousser une modification de deploy/nginx.conf : `npm run check:nginx`.
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dockerfile = await readFile(`${root}Dockerfile`, "utf8");
const image = dockerfile.match(/^FROM\s+(nginx:\S+)/m)?.[1];
if (!image) throw new Error("Image nginx introuvable dans le Dockerfile");

const conf = fileURLToPath(new URL("../deploy/nginx.conf", import.meta.url));
const r = spawnSync("docker", ["run", "--rm", "-v", `${conf}:/etc/nginx/conf.d/default.conf:ro`, image, "nginx", "-t"], {
  stdio: "inherit",
});
if (r.error) throw new Error(`Docker introuvable ou arrêté : ${r.error.message}`);
process.exit(r.status ?? 1);
