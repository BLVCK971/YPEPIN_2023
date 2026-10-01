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

## Vérifications avant push

```bash
npm run build   # tsc --noEmit + vite build
```
