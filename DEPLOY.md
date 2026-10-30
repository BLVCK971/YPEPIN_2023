# Déploiement automatique sur le VPS (Docker + Traefik)

Même fonctionnement et même VPS que ARC-GR : le site tourne dans un conteneur Docker
(nginx servant le build statique, **aucun Node.js en production**), routé par le
**Traefik** partagé du VPS, qui gère le TLS (Let's Encrypt) et le routing par domaine.

Le workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) :

- sur toute push/PR vers `main` : `npm ci`, `npm audit`, build Vite et build de l'image Docker ;
- sur push vers `main` uniquement : `rsync` du code vers le VPS puis
  `docker compose build && docker compose up -d` via SSH (compte `deploy`, sans sudo).

Le conteneur tourne en lecture seule (`read_only`, `no-new-privileges`) et nginx
n'accepte que GET/HEAD : même en cas de faille, rien à exécuter ni à écrire.

## Configurer les secrets GitHub

Sur ce repo → **Settings → Secrets and variables → Actions** (idéalement dans un
*environment* `production`, déjà référencé par le workflow). Mêmes noms que sur ARC-GR :

| Secret           | Valeur                                                    |
|------------------|-----------------------------------------------------------|
| `VPS_HOST`       | IP du VPS (la même que ARC-GR)                            |
| `VPS_PORT`       | Port SSH du VPS (le même que ARC-GR)                      |
| `VPS_USER`       | `deploy`                                                  |
| `VPS_SSH_KEY`    | Clé privée dédiée `ypepin_deploy` (voir ci-dessous)       |
| `VPS_TARGET_DIR` | `/opt/apps/ypepin`                                        |

> Ce repo est public : l'IP et le port SSH du VPS restent dans les secrets, jamais
> dans le code.

Clé dédiée (révocable sans toucher à ARC-GR) :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ypepin_deploy -C "ypepin-deploy" -N ""
# Ajouter ~/.ssh/ypepin_deploy.pub à /home/deploy/.ssh/authorized_keys sur le VPS
```

## Accès aux démos (`/demos/`)

Les démos ne sont servies qu'aux emails autorisés. La liste est sur le VPS, hors du
dépôt (public) et de `VPS_TARGET_DIR` (le `rsync --delete` l'effacerait) :
`/opt/apps/ypepin-acces/emails.map`, monté en lecture seule dans le conteneur.

Depuis le PC, avec un alias SSH `ypepin` dans `~/.ssh/config` (ou la variable
`YPEPIN_SSH="deploy@<VPS> -p <PORT> -i ~/.ssh/ypepin_deploy"`) :

```
Host ypepin
  HostName <IP du VPS>
  Port <PORT>
  User deploy
  IdentityFile ~/.ssh/ypepin_deploy
```

Page locale (ajout, retrait, liste, mail prêt à envoyer via la messagerie ou Gmail) :

```bash
npm run demos:admin   # ouvre http://localhost:5181, Ctrl+C pour arrêter
```

Ou en ligne de commande :

```bash
npm run demos:acces -- ajouter prenom.nom@exemple.fr arc-gr matheva   # affiche le mail à envoyer
npm run demos:acces -- retirer prenom.nom@exemple.fr
npm run demos:acces -- liste
```

Le script écrit le fichier via un conteneur `ypepin:latest` (le dossier peut appartenir
à root) puis recharge nginx (`docker exec ypepin nginx -s reload`).

## DNS

Enregistrements `A` de `ypepin.com` et `www.ypepin.com` vers l'IP du VPS.
Traefik obtient le certificat Let's Encrypt tout seul dès que le DNS est propagé
(`www` redirige vers `ypepin.com`).

## Premier déploiement manuel (optionnel)

La CI crée elle-même `VPS_TARGET_DIR` au premier déploiement ; ceci ne sert que
pour déployer à la main sans passer par GitHub Actions.

```bash
ssh -p <PORT> -i ~/.ssh/ypepin_deploy deploy@<VPS> "mkdir -p /opt/apps/ypepin"
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  -e "ssh -p <PORT> -i ~/.ssh/ypepin_deploy" \
  ./ deploy@<VPS>:/opt/apps/ypepin/
ssh -p <PORT> -i ~/.ssh/ypepin_deploy deploy@<VPS> \
  "cd /opt/apps/ypepin && docker compose build && docker compose up -d"
```

## Tester en local

```bash
docker build -t ypepin .
docker run --rm -p 8080:80 ypepin   # http://localhost:8080
```
