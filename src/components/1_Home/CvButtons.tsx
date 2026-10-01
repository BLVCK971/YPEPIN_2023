import { FaFilePdf, FaFileWord } from "react-icons/fa";
import { Lang, useLang, useT } from "../../i18n";

// CV dans la langue de la page (version anglaise : CV_Yoel_PEPIN_EN.*)
const CV: Record<Lang, { pdf: string; docx: string }> = {
  fr: { pdf: "/cv/CV_Yoel_PEPIN.pdf", docx: "/cv/CV_Yoel_PEPIN.docx" },
  en: { pdf: "/cv/CV_Yoel_PEPIN_EN.pdf", docx: "/cv/CV_Yoel_PEPIN_EN.docx" },
};

export const useCv = () => CV[useLang()];

export default function CvButtons() {
  const t = useT();
  const cv = useCv();
  return (
    <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mt-10">
      <a
        href={cv.pdf}
        download
        className="flex items-center gap-2 px-6 py-3 font-semibold text-white rounded-full shadow-lg shadow-violet-900/40 bg-gradient-to-r from-violet-600 to-cyan-500 transition-transform duration-300 hover:scale-105"
      >
        <FaFilePdf className="text-xl" aria-hidden="true" />
        {t("Télécharger mon CV (PDF)", "Download my CV (PDF)")}
      </a>
      <a
        href={cv.docx}
        download
        className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-full border border-white/15 bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/15"
      >
        <FaFileWord className="text-lg" aria-hidden="true" />
        {t("Version Word", "Word version")}
      </a>
      <a
        href="#Contact"
        className="px-4 py-3 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
      >
        {t("Me contacter", "Contact me")} →
      </a>
    </div>
  );
}
