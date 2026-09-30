#!/bin/bash
# Build local puis copie des fichiers statiques sur le Raspberry Pi.
# Plus aucun Node.js ni service systemd côté serveur : nginx sert dist/ directement.
set -euo pipefail

HOST="yopi@192.168.1.21"
TARGET="/var/www/ypepin.com"

npm ci
npm run build
rsync -avz --delete dist/ "$HOST:$TARGET/"
