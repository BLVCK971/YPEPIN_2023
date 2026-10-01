import { FaEnvelope, FaFilePdf, FaGithub, FaLinkedin, FaPhone } from "react-icons/fa";
import { useCv } from "../1_Home/CvButtons";
import SectionTitle from "../ui/SectionTitle";
import Reveal from "../ui/Reveal";
import { useLang, useT } from "../../i18n";
import { SECTIONS } from "../0_Nav/NavBar";

const liens = [
  { href: "mailto:yoelpepin97@gmail.com", label: "yoelpepin97@gmail.com", Icone: FaEnvelope },
  { href: "tel:+33675263861", label: "06 75 26 38 61", en: "+33 6 75 26 38 61", Icone: FaPhone },
  { href: "https://www.linkedin.com/in/ypepin/", label: "LinkedIn", Icone: FaLinkedin, externe: true },
  { href: "https://github.com/BLVCK971", label: "GitHub", Icone: FaGithub, externe: true },
];

const nav = SECTIONS.filter((s) => s.id !== "Contact");

export default function ContactSection() {
  const lang = useLang();
  const t = useT();
  const cv = useCv();
  return (
    <footer id="Contact" className="flex flex-col items-center gap-8 px-4 pt-20 md:pt-28 pb-10">
      <SectionTitle etiquette="Contact" titre={t("Travaillons ensemble", "Let's work together")} />
      <Reveal className="w-full max-w-6xl px-4">
      <div className="w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 md:p-10 flex flex-col items-center gap-6 text-center">
        <p className="text-xl md:text-2xl font-semibold">{t("Un projet, une mission ? Parlons-en.", "A project, a mission? Let's talk.")}</p>
        <p className="text-base md:text-lg opacity-90 max-w-2xl">
          {t(
            "Ingénieur logiciel FullStack C# / Python et Tech Lead, j'interviens en freelance sous la marque ICEKERA (EI Yoel PEPIN) : développement sur mesure, architecture, data, IA et conseil IT.",
            "FullStack C# / Python software engineer and Tech Lead, I work as a freelancer under the ICEKERA brand (EI Yoel PEPIN): custom development, architecture, data, AI and IT consulting."
          )}
        </p>
        <ul className="flex flex-wrap justify-center gap-3">
          {liens.map(({ href, label, en, Icone, externe }) => (
            <li key={href}>
              <a
                href={href}
                {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-2 px-4 py-2 font-medium rounded-full border border-white/15 bg-white/5 transition-colors duration-300 hover:bg-white/15"
              >
                <Icone className="text-xl" aria-hidden="true" />
                {lang === "en" ? en ?? label : label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={cv.pdf}
          download
          className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-cyan-500 transition-transform duration-300 hover:scale-105"
        >
          <FaFilePdf className="text-xl" aria-hidden="true" />
          {t("Télécharger mon CV (PDF)", "Download my CV (PDF)")}
        </a>
      </div>
      </Reveal>
      <nav aria-label={t("Plan du site", "Site map")} className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-80">
        {nav.map((l) => (
          <a key={l.id} href={`#${l.id}`} className="hover:underline">
            {t(l.label, l.en)}
          </a>
        ))}
      </nav>
      <p className="text-sm opacity-60">© Yoel PEPIN · ICEKERA (EI Yoel PEPIN)</p>
    </footer>
  );
}
