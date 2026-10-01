import RolesTapes from "./RolesTapes";

export default function Poste() {
  return (
    <div className="relative z-10 mt-6 flex flex-col items-center gap-3 text-center">
      <p className="text-lg md:text-2xl font-medium text-neutral-200">
        Ingénieur logiciel FullStack <span className="text-cyan-300">C# / Python</span>
      </p>
      <RolesTapes />
      <p className="mt-2 max-w-2xl text-base md:text-lg text-neutral-400">
        Je conçois des systèmes scalables, fiables et maintenables, du desktop industriel au cloud,
        avec une forte orientation architecture, data et IA.
      </p>
    </div>
  );
}
