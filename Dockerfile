# --- Build stage ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Serve stage -----------------------------------------------------------
# Image finale minimale : nginx sert uniquement le build statique, pas de Node.
# Le TLS/routing par domaine est géré par Traefik en amont, pas ici.
FROM nginx:1.30-alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
