import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./index.css";
//Font-Awesome
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Main from "./components/Main";
import { LangProvider } from "./i18n";
config.autoAddCss = false;

const root = document.getElementById("root")!;
// Même règle qu'au prérendu : /en/ = anglais, le reste = français
const lang = window.location.pathname.startsWith("/en") ? "en" : "fr";
const app = (
  <StrictMode>
    <LangProvider value={lang}>
      <Main />
    </LangProvider>
  </StrictMode>
);

// En production le HTML est prérendu au build : on l'hydrate.
// En dev (vite), la div est vide : rendu client classique.
if (root.firstElementChild) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
