import { FaEnvelope, FaFilePdf, FaGithub, FaLinkedin, FaPhone } from "react-icons/fa";
import { CV_PDF } from "../1_Home/CvButtons";

const liens = [
  { href: "mailto:yoelpepin97@gmail.com", label: "yoelpepin97@gmail.com", Icone: FaEnvelope },
  { href: "tel:+33675263861", label: "06 75 26 38 61", Icone: FaPhone },
  { href: "https://www.linkedin.com/in/ypepin/", label: "LinkedIn", Icone: FaLinkedin, externe: true },
  { href: "https://github.com/BLVCK971", label: "GitHub", Icone: FaGithub, externe: true },
];

const nav = [
  { href: "#Profil", label: "Profil" },
  { href: "#Parcours", label: "Parcours" },
  { href: "#Formation", label: "Formation" },
  { href: "#Portfolio", label: "Portfolio" },
];

export default function ContactSection() {
  return (
    <footer id="Contact" className="flex flex-col items-center gap-8 px-2 pt-16 pb-10">
      <h2 className="text-5xl md:text-8xl font-semibold text-center">Contact</h2>
      <div className="w-full max-w-4xl rounded-xl border border-neutral-800 bg-neutral-500/20 backdrop-blur-lg p-6 md:p-10 flex flex-col items-center gap-6 text-center">
        <p className="text-xl md:text-2xl font-semibold">Un projet, une mission ? Parlons-en.</p>
        <p className="text-base md:text-lg opacity-90 max-w-2xl">
          Ingénieur logiciel FullStack C# / Python et Tech Lead, j'interviens en freelance sous la
          marque ICEKERA (EI Yoel PEPIN) : développement sur mesure, architecture, data, IA et
          conseil IT.
        </p>
        <ul className="flex flex-wrap justify-center gap-3">
          {liens.map(({ href, label, Icone, externe }) => (
            <li key={href}>
              <a
                href={href}
                {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-white/10 shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105"
              >
                <Icone className="text-xl" aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={CV_PDF}
          download
          className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-full shadow-lg bg-gradient-to-tr from-pink-500 to-yellow-500 transition-transform duration-300 hover:scale-105"
        >
          <FaFilePdf className="text-xl" aria-hidden="true" />
          Télécharger mon CV (PDF)
        </a>
      </div>
      <nav aria-label="Plan du site" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-80">
        {nav.map((l) => (
          <a key={l.href} href={l.href} className="hover:underline">
            {l.label}
          </a>
        ))}
      </nav>
      <p className="text-sm opacity-60">© Yoel PEPIN · ICEKERA (EI Yoel PEPIN)</p>
    </footer>
  );
}
