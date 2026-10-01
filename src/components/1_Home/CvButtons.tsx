import { FaFilePdf, FaFileWord } from "react-icons/fa";

export const CV_PDF = "/cv/CV_Yoel_PEPIN.pdf";
export const CV_DOCX = "/cv/CV_Yoel_PEPIN.docx";

export default function CvButtons() {
  return (
    <div className="z-10 flex flex-wrap items-center justify-center gap-3 my-8">
      <a
        href={CV_PDF}
        download
        className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-full shadow-lg bg-gradient-to-tr from-pink-500 to-yellow-500 transition-transform duration-300 hover:scale-105"
      >
        <FaFilePdf className="text-xl" aria-hidden="true" />
        Télécharger mon CV (PDF)
      </a>
      <a
        href={CV_DOCX}
        download
        className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-full bg-white/10 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105"
      >
        <FaFileWord className="text-lg" aria-hidden="true" />
        Version Word
      </a>
    </div>
  );
}
