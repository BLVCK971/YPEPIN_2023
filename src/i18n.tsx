import { createContext, useContext } from "react";

// Langue de la page : "/" en français, "/en/" en anglais. Chaque page est
// prérendue au build dans sa langue (scripts/prerender.mjs), puis hydratée.
export type Lang = "fr" | "en";

const LangContext = createContext<Lang>("fr");

export const LangProvider = LangContext.Provider;

export const useLang = () => useContext(LangContext);

// Choisit le texte de la langue courante : const t = useT(); t("Profil", "Profile")
export const useT = () => {
  const lang = useLang();
  return <T,>(fr: T, en: T): T => (lang === "en" ? en : fr);
};

export const ACCUEIL: Record<Lang, string> = { fr: "/", en: "/en/" };
