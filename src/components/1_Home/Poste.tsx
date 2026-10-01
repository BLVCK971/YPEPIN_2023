import RolesTapes from "./RolesTapes";
import { useT } from "../../i18n";

export default function Poste() {
  const t = useT();
  return (
    <div className="relative z-10 mt-6 flex flex-col items-center gap-3 text-center">
      <p className="text-lg md:text-2xl font-medium text-neutral-200">
        {t("Ingénieur logiciel FullStack", "FullStack software engineer")} <span className="text-cyan-300">C# / Python</span>
      </p>
      <RolesTapes />
      <p className="mt-2 max-w-2xl text-base md:text-lg text-neutral-400">
        {t(
          "Je conçois des systèmes scalables, fiables et maintenables, du desktop industriel au cloud, avec une forte orientation architecture, data et IA.",
          "I design scalable, reliable and maintainable systems, from industrial desktop software to the cloud, with a strong focus on architecture, data and AI."
        )}
      </p>
    </div>
  );
}
