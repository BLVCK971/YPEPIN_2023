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

## SEO

- `npm run build` prérend le HTML complet (`src/entry-server.tsx` + `scripts/prerender.mjs`) dans
  `dist/index.html` et `dist/en/index.html` (métadonnées anglaises et hreflang générées par le script), puis React l'hydrate : les composants doivent rester rendables côté serveur
  (pas d'accès à `window`/`document` pendant le rendu, uniquement dans les effets).
- Métadonnées (title, description, Open Graph, JSON-LD schema.org) dans `index.html` ;
  `public/sitemap.xml` (mettre à jour `lastmod`), `public/robots.txt`, `public/og-image.jpg`.
- Un seul `<h1>` (le nom) ; les sections utilisent `<h2>`, les entreprises `<h3>`, les missions `<h4>`.

## Vérifications avant push

```bash
npm run build   # tsc --noEmit + vite build
```
