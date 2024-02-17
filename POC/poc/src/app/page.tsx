import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import {
  faCode,
  faNetworkWired,
  faCodeBranch,
  faMobileScreen,
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import { faDocker } from "@fortawesome/free-brands-svg-icons";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-full sm:before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full sm:after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <div className="p-4 grid grid-cols-5 gap-4 h-full w-full bg-purple-500 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-20 border border-neutral-800">
          <div>
            <h2 className="text-xl font-bold mb-4">BDD</h2>
            <div>SqlServer</div>
            <div>Azure SqlServer</div>
            <div>PostgreSQL</div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">ORM</h2>
            <div>Entity Framework</div>
            <div>Django</div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">BackEnd</h2>
            <div>C#</div>
            <div>Python</div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">API</h2>
            <div>ASP.NET</div>
            <div>Django</div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">FrontEnd</h2>
            <div>ASP.NET</div>
            <div>WinForms</div>
            <div>WPF</div>
            <div>MAUI</div>
            <div>Tauri</div>
            <div>React</div>
            <div>NextJS</div>
          </div>

          <div className="col-start-2">
            <h2 className="text-xl font-bold mb-4 ">Data/BI/ML</h2>
            <div>Power BI</div>
            <div>Power BI Embedded</div>
            <div>TensorFlow</div>
            <div>NEAT</div>
            <div>ETLs</div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Fonctionnel</h2>
            <div>Scrum Master</div>
            <div>Comptabilité/Odoo</div>
            <div>CDC, UMLs</div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">DevOps</h2>
            <div>Docker</div>
            <div>Azure & AWS</div>
          </div>
        </div>
      </div>
    </main>
  );
}
