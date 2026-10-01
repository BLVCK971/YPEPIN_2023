import { FaFilePdf, FaFileWord } from "react-icons/fa";

export const CV_PDF = "/cv/CV_Yoel_PEPIN.pdf";
export const CV_DOCX = "/cv/CV_Yoel_PEPIN.docx";

export default function CvButtons() {
  return (
    <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mt-10">
      <a
        href={CV_PDF}
        download
        className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-full shadow-lg shadow-violet-900/40 bg-gradient-to-r from-violet-600 to-cyan-500 transition-transform duration-300 hover:scale-105"
      >
        <FaFilePdf className="text-xl" aria-hidden="true" />
        Télécharger mon CV (PDF)
      </a>
      <a
        href={CV_DOCX}
        download
        className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-full border border-white/15 bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/15"
      >
        <FaFileWord className="text-lg" aria-hidden="true" />
        Version Word
      </a>
      <a
        href="#Contact"
        className="px-4 py-3 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
      >
        Me contacter →
      </a>
    </div>
  );
}
