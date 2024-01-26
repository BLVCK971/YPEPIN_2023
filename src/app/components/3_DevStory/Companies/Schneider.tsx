import DeviceIntegration from "../Projects/DeviceIntegration";
import Image from "next/image";
import "./Schneider.tsx.css";
import Ul from "../Projects/Ul";
import Li from "../Projects/Li";
import { faCode, faNetworkWired } from "@fortawesome/free-solid-svg-icons";

export default function Schneider() {
  return (
    <div className=" SchneiderBox sm:grid-cols-12 bg-gradient-to-b from-zinc-200  backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit  lg:w-auto  rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5">
      <div className="grid grid-cols-4">
        <h1 className="mb-3 text-6xl font-bold col-span-2">
          Avisto / Schneider Electric
          <div className="text-4xl font-semibold">
            06/2023 - Aujourd&apos;hui
          </div>
          <div className="text-lg font-semibold">
            <Ul>
              <div className="mt-5" >Postes occupés : </div>
              <Li icon={faNetworkWired}>Scrum Master</Li>
              <Li icon={faCode}>Ingénieur Logiciel C#</Li>
            </Ul>
          </div>
        </h1>

        <Image src="/avisto.png" width={300} height={200} alt="Avisto's logo" />
        <Image
          src="/SCHNEIDER.png"
          width={500}
          height={500}
          alt="Schneider's logo"
          className="col-span-1"
        />

        <DeviceIntegration />
      </div>
    </div>
  );
}
