import { useEffect, useState } from "react";
import { FaBars, FaFilePdf, FaGithub, FaLinkedin, FaTimes } from "react-icons/fa";
import { CV_PDF } from "../1_Home/CvButtons";
import { cn } from "../ui/utils/cn";
import { ACCUEIL, useLang, useT } from "../../i18n";

export const SECTIONS = [
  { id: "Profil", label: "Profil", en: "Profile" },
  { id: "Parcours", label: "Parcours", en: "Experience" },
  { id: "Formation", label: "Formation", en: "Education" },
  { id: "Projets", label: "Projets", en: "Projects" },
  { id: "Services", label: "Services", en: "Services" },
  { id: "Contact", label: "Contact", en: "Contact" },
];

// Barre de navigation fixe : transparente en haut de page, floutée au défilement,
// section courante mise en avant (scrollspy).
export default function NavBar() {
  const [defile, setDefile] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      // Une section est "courante" quand elle traverse le tiers haut de l'écran
      { rootMargin: "-30% 0px -65% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  const lien = (id: string) =>
    cn(
      "relative px-3 py-2 text-sm font-medium transition-colors",
      active === id ? "text-white" : "text-neutral-400 hover:text-white"
    );

  return (
    <nav
      aria-label={t("Navigation principale", "Main navigation")}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        defile || menuOuvert
          ? "bg-black/60 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="font-semibold tracking-tight text-lg" aria-label={t("Retour en haut", "Back to top")}>
          Y<span className="text-cyan-300">P</span>
        </a>

        <ul className="hidden md:flex items-center gap-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className={lien(s.id)}>
                {t(s.label, s.en)}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-transform duration-300 origin-left",
                    active === s.id ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Bascule de langue : lien vers l'autre version prérendue */}
          <a
            href={ACCUEIL[lang === "en" ? "fr" : "en"]}
            hrefLang={lang === "en" ? "fr" : "en"}
            lang={lang === "en" ? "fr" : "en"}
            className="flex items-center rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold tracking-wider text-neutral-300 transition-colors hover:border-white/40 hover:text-white"
            aria-label={lang === "en" ? "Version française" : "English version"}
          >
            {lang === "en" ? "FR" : "EN"}
          </a>
          <a
            href="https://www.linkedin.com/in/ypepin/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="text-xl" aria-hidden="true" />
          </a>
          <a
            href="https://github.com/BLVCK971"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-2 text-neutral-400 hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <FaGithub className="text-xl" aria-hidden="true" />
          </a>
          <a
            href={CV_PDF}
            download
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white/20"
          >
            <FaFilePdf aria-hidden="true" />
            CV
          </a>
          <button
            type="button"
            className="md:hidden p-2 text-neutral-300"
            aria-label={menuOuvert ? t("Fermer le menu", "Close menu") : t("Ouvrir le menu", "Open menu")}
            aria-expanded={menuOuvert}
            onClick={() => setMenuOuvert((o) => !o)}
          >
            {menuOuvert ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {menuOuvert && (
        <ul className="md:hidden flex flex-col px-4 pb-4">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={() => setMenuOuvert(false)}
                className={cn("block py-3 border-b border-white/5", active === s.id ? "text-white" : "text-neutral-300")}
              >
                {t(s.label, s.en)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
