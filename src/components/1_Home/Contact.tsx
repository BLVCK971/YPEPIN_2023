import { FaEnvelope, FaGithub, FaLinkedin, FaPhone } from "react-icons/fa";

const bouton =
  "flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-sm font-medium transition-all duration-300 bg-black/40 sm:bg-white/10 rounded-lg backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 group";

export default function Contact() {
  return (
    <nav
      aria-label="Contact"
      className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 flex flex-row gap-2 sm:gap-4"
    >
      <a href="tel:+33675263861" className={`${bouton} hover:bg-emerald-500/20`} aria-label="Téléphone : 06 75 26 38 61">
        <FaPhone className="text-xl group-hover:text-emerald-500" aria-hidden="true" />
        <span className="hidden lg:inline group-hover:text-emerald-500">06 75 26 38 61</span>
      </a>

      <a href="mailto:yoelpepin97@gmail.com" className={`${bouton} hover:bg-blue-500/20`} aria-label="Email : yoelpepin97@gmail.com">
        <FaEnvelope className="text-xl group-hover:text-blue-500" aria-hidden="true" />
        <span className="hidden lg:inline group-hover:text-blue-500">yoelpepin97@gmail.com</span>
      </a>

      <a
        href="https://github.com/BLVCK971"
        target="_blank"
        rel="noopener noreferrer"
        className={`${bouton} hover:bg-white/20`}
        aria-label="GitHub"
      >
        <FaGithub className="text-xl" aria-hidden="true" />
        <span className="hidden lg:inline">GitHub</span>
      </a>

      <a
        href="https://www.linkedin.com/in/ypepin/"
        target="_blank"
        rel="noopener noreferrer"
        className={`${bouton} hover:bg-[#0077b5]/20`}
        aria-label="LinkedIn"
      >
        <FaLinkedin className="text-xl group-hover:text-[#0077b5]" aria-hidden="true" />
        <span className="hidden lg:inline group-hover:text-[#0077b5]">LinkedIn</span>
      </a>
    </nav>
  );
}
