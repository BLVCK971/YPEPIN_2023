import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import Main from "./components/Main";

// Prérendu au build (scripts/prerender.mjs) : le HTML complet du site est
// injecté dans dist/index.html pour les moteurs de recherche et les aperçus
// de liens, puis React l'hydrate côté navigateur.
export function render() {
  return renderToString(
    <StrictMode>
      <Main />
    </StrictMode>
  );
}
