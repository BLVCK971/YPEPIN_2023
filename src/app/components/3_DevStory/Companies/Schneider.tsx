import DeviceIntegration from "../Projects/DeviceIntegration";
import "./Schneider.tsx.css"

export default function Schneider() {
  return (
    <div className=" SchneiderBox sm:grid-cols-12 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit  lg:w-auto  lg:rounded-xl lg:border bg-gray-200 lg:p-4 p-4  mb-5">
      <div className="grid grid-cols-4">
        <h1 className="mb-3 text-6xl font-bold col-span-3">
          Avisto / Schneider Electric
        </h1>
        <div className="text-5xl font-semibold col-span-1">
          06/2023 - Aujourd&apos;hui
        </div>

        <div className="text-lg col-span-4">Postes occupés : </div>
        <div className="text-lg col-span-4"> - Ingénieur Logiciel C#</div>
        <div className="text-lg col-span-4"> - Scrum Master</div>


        <DeviceIntegration />
      </div>
    </div>
  );
}
