import { FaEnvelope, FaGithub, FaLinkedin, FaPhone } from "react-icons/fa";

export default function Contact() {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-4 sm:flex-row">
      <a
        href="tel:+33675263861"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 bg-white/10 hover:bg-emerald-500/20 rounded-lg backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 group"
        aria-label="Téléphone"
      >
        <FaPhone className="text-xl group-hover:text-emerald-500" />
        <span className="hidden sm:inline group-hover:text-emerald-500">06 75 26 38 61</span>
      </a>

      <a
        href="mailto:yoelpepin97@gmail.com"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 bg-white/10 hover:bg-blue-500/20 rounded-lg backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 group"
        aria-label="Email"
      >
        <FaEnvelope className="text-xl group-hover:text-blue-500" />
        <span className="hidden sm:inline group-hover:text-blue-500">yoelpepin97@gmail.com</span>
      </a>

      <a
        href="https://github.com/BLVCK971"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 bg-white/10 hover:bg-[#333]/20 rounded-lg backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 group"
        aria-label="GitHub"
      >
        <FaGithub className="text-xl group-hover:text-[#333]" />
        <span className="hidden sm:inline group-hover:text-[#333]">GitHub</span>
      </a>

      <a
        href="https://www.linkedin.com/in/ypepin/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 bg-white/10 hover:bg-[#0077b5]/20 rounded-lg backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 group"
        aria-label="LinkedIn"
      >
        <FaLinkedin className="text-xl group-hover:text-[#0077b5]" />
        <span className="hidden sm:inline group-hover:text-[#0077b5]">LinkedIn</span>
      </a>
    </div>
  );
}
