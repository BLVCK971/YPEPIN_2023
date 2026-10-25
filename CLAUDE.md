# YPEPIN - Portfolio de Yoel PEPIN (ypepin.com)

## Workflow Git (consigne du propriétaire, seul développeur du projet)

- **Pousser directement sur `main`** : pas de branche de feature ni de pull request.
- Dès qu'une tâche est terminée **et vérifiée** (`npm run build` qui passe, rendu contrôlé),
  commit + push sur `main` sans demander de confirmation.
- Chaque push sur `main` déclenche le déploiement automatique sur le VPS
  (voir `.github/workflows/deploy.yml` et `DEPLOY.md`) : ne jamais pousser un build cassé.

## Stack

- Site 100 % statique : React 19 + TypeScript + Tailwind 3, bundlé par Vite (`dist/`).
- Aucun serveur Node.js en production (l'ancien site Next.js sur Raspberry Pi a été piraté) :
  nginx dans un conteneur Docker en lecture seule, derrière le Traefik partagé du VPS.
- Contenu du CV : `src/components/3_DevStory/data/data.tsx` (expériences et missions),
  `src/components/5_Profil/Profil.tsx` (résumé, stacks), `src/components/6_Formation/Formation.tsx`.
  Le CV de Yoel fait foi : ne pas inventer de chiffres ou de réalisations absents du CV.
- Version anglaise (`/en/`) : même composants, langue fournie par `src/i18n.tsx` (`useLang`, `useT`).
  Traductions du parcours dans `src/components/3_DevStory/data/data.en.tsx` (le build échoue si une
  tâche, un résultat ou une mission française n'y a pas son équivalent) ; textes d'interface traduits
  directement dans chaque composant. Toute modification du contenu français doit être reportée en anglais.
- CV téléchargeable : `public/cv/CV_Yoel_PEPIN.docx` (source Word) et `public/cv/CV_Yoel_PEPIN.pdf`,
  version anglaise `public/cv/CV_Yoel_PEPIN_EN.docx` / `.pdf` (proposée sur `/en/`, même mise en page).
  Le docx doit rester aligné avec le contenu du site : toute modification de `data.tsx`,
  `Profil.tsx` ou `Formation.tsx` doit être reportée dans les deux docx (FR et EN), puis les PDF régénérés
  (`soffice --headless --convert-to pdf public/cv/CV_Yoel_PEPIN.docx --outdir public/cv`, idem `_EN`).

## Démos interactives (`/demos/`)

- `public/demos/<nom>/` : vrais fronts de projets, compilés tels quels depuis les dépôts voisins
  (jamais modifiés) avec une fausse API dans le navigateur (`demos/<nom>/mock.ts`, harnais
  `demos/shared/runtime.ts`) : données fictives, aucun appel serveur. Démos : `arc-gr` (../ARC_GR),
  `matheva` (../Matheva), `hellboy` (../HellBoy/apps/web), `aivocat` (../avocat-local-ai/app/ui,
  interface HTML copiée), `wondo` (../DojoApp, export web Expo depuis une copie temporaire).
- Build manuel, hors `npm run build` (la CI n'a pas les dépôts voisins) : `npm run demos`
  (ou `npm run demos -- arc-gr`), `npm run demos:check` (types des fausses API), puis commiter
  `public/demos/`. Essai local : `node demos/serve.mjs` (http://localhost:5180/demos/arc-gr/, même
  fallback SPA que nginx). Une nouvelle démo doit aussi être ajoutée à la regex de `deploy/nginx.conf`.
- Marques des clients affichées avec leur accord ; toutes les autres données (personnes, dossiers,
  photos, pièces) doivent rester fictives. Démos en `noindex` (meta et en-tête nginx `X-Robots-Tag`).
  Ne pas les bloquer dans robots.txt : un robot bloqué ne verrait jamais le `noindex`.

## SEO

- `npm run build` prérend le HTML complet (`src/entry-server.tsx` + `scripts/prerender.mjs`) dans
  `dist/index.html` et `dist/en/index.html` (métadonnées anglaises et hreflang générées par le script), puis React l'hydrate : les composants doivent rester rendables côté serveur
  (pas d'accès à `window`/`document` pendant le rendu, uniquement dans les effets).
- Métadonnées (title, description, Open Graph, JSON-LD schema.org) dans `index.html` ;
  `public/sitemap.xml` (mettre à jour `lastmod`), `public/robots.txt`, `public/og-image.jpg`.
  Titre ~60 caractères, description ~155 (au-delà, Google tronque). Ces textes sont aussi des
  constantes de `scripts/prerender.mjs` (FR et EN, remplacements stricts) : modifier les deux, sinon
  le build échoue. À chaque mise à jour du contenu : `dateModified` du JSON-LD (ProfilePage) et
  `lastmod` du sitemap.
- `public/llms.txt` (résumé pour les moteurs IA) : à garder aligné avec le profil, les services et
  le parcours (entreprises, diplômes) quand ils changent.
- Un seul `<h1>` (le nom) ; les sections utilisent `<h2>`, les entreprises `<h3>`, les missions `<h4>`.
- Images : WebP aux dimensions d'affichage (x2), avec `width`/`height` (pas de décalage de mise en page).
- Performance (Core Web Vitals) : CSS insérée dans le HTML et police préchargée par `prerender.mjs` ;
  sections sous la ligne de flottaison en `content-visibility: auto` (`src/index.css`, hauteur estimée
  par section : toute nouvelle section de `<main>` y ajoute la sienne) ; pas de `getBoundingClientRect`
  au chargement dans ces sections (préférer `IntersectionObserver`) ; animations SVG (SMIL) mises en
  pause hors écran via `useAnimationsSvg`.
- nginx : `X-Robots-Tag: noindex` sur `/Web`, `/py` et les `.docx` (map `$robots_tag`),
  `/index.html` et `/en/index.html` redirigés en 301 vers `/` et `/en/`. La CI vérifie la config
  (`nginx -t`) avant de déployer.

## Vérifications avant push

```bash
npm run build   # tsc --noEmit + vite build
```
