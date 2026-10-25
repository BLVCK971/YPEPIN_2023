import { FaFilePdf } from "react-icons/fa";
import { Lang, useLang, useT } from "../../i18n";

// CV PDF dans la langue de la page (le .docx reste la source, non proposé au téléchargement)
const CV: Record<Lang, { pdf: string }> = {
  fr: { pdf: "/cv/CV_Yoel_PEPIN.pdf" },
  en: { pdf: "/cv/CV_Yoel_PEPIN_EN.pdf" },
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
        href="#Contact"
        className="px-4 py-3 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
      >
        {t("Me contacter", "Contact me")} →
      </a>
    </div>
  );
}
