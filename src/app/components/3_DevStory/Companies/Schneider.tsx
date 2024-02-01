import DeviceIntegration from "../Projects/DeviceIntegration";
import Image from "next/image";
import "./Schneider.tsx.css";
import Ul from "../Projects/Ul";
import Li from "../Projects/Li";
import { faCode, faNetworkWired } from "@fortawesome/free-solid-svg-icons";

export default function Schneider() {
  return (
    <div className=" SchneiderBox sm:grid-cols-12 bg-gradient-to-b from-zinc-200  backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit  lg:w-auto  rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5">
      <div className="grid grid-cols-4">
        <h1 className="text-xl font-bold col-span-2">
          Avisto / Schneider Electric
          <div className="text-lg font-semibold">
            06/2023 - Aujourd&apos;hui
          </div>
          <div className="text-base font-semibold">
            <Ul>
              <div className="mt-5">Postes occupés : </div>
              <Li icon={faNetworkWired}>Scrum Master</Li>
              <Li icon={faCode}>Ingénieur Logiciel C#</Li>
            </Ul>
          </div>
        </h1>

        <Image
          unoptimized
          src="/avisto.png"
          width={200}
          height={100}
          alt="Avisto's logo"
        />
        <Image
          unoptimized
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
