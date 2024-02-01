import BusinessZone from "../Projects/BusinessZone";
import Image from "next/image";
import Ul from "../Projects/Ul";
import Li from "../Projects/Li";
import {
  faCode,
  faNetworkWired,
  faCodeBranch,
} from "@fortawesome/free-solid-svg-icons";
import { faDocker } from "@fortawesome/free-brands-svg-icons";
import "./Digitom.tsx.css";

export default function Digitom() {
  return (
    <div className=" DigitomBox sm:grid-cols-12 bg-gradient-to-b from-zinc-200  backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit  lg:w-auto  rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5">
      <div className="grid grid-cols-4">
        <h1 className="text-xl font-bold col-span-3">
          Digitom
          <div className="text-lg font-semibold">10/2018 - 06/2023</div>
          <div className="mt-5 text-base font-semibold">
            <Ul>
              <div className="mt-2">Postes occupés : </div>
              <Li icon={faCode}>Ingénieur Logiciel C# & Python</Li>
              <Li icon={faNetworkWired}>Analyste & Formateur BI</Li>
              <Li icon={faCodeBranch}>Intégrateur Odoo</Li>
              <Li icon={faDocker}>Ingénieur DevOps</Li>
            </Ul>
          </div>
        </h1>

        <Image
          unoptimized
          src="/DIGITOM.png"
          width={800}
          height={800}
          alt="Digitom's logo"
          className="col-span-1"
        />

        <BusinessZone />
      </div>
    </div>
  );
}
