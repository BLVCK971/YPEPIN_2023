import BusinessZone from "../Projects/BusinessZone";
import Image from "next/image";
import Ul from "../Projects/Ul";
import Li from "../Projects/Li";
import {
  faCode,
  faNetworkWired,
  faCodeBranch,
  faTerminal,
} from "@fortawesome/free-solid-svg-icons";
import { faDocker } from "@fortawesome/free-brands-svg-icons";
import "./Digitom.tsx.css";

export default function Digitom() {
  return (
    <div className=" DigitomBox sm:grid-cols-12  pb-6 pt-8 backdrop-blur-2xl  dark:border-neutral-800 lg:w-auto  lg:rounded-xl lg:border  lg:p-4 p-4  mb-5">
      <div className="grid grid-cols-4">
        <h1 className="mb-3 text-6xl font-bold col-span-3">
          Digitom
          <div className="text-4xl font-semibold">10/2018 - 06/2023</div>
          <div className="text-lg font-semibold">
            <Ul>
              <div className="mt-5">Postes occupés : </div>
              <Li icon={faCode}>Ingénieur Logiciel C# & Python</Li>
              <Li icon={faNetworkWired}>Analyste & Formateur BI</Li>
              <Li icon={faCodeBranch}>Intégrateur Odoo</Li>
              <Li icon={faDocker}>Ingénieur DevOps</Li>
            </Ul>
          </div>
        </h1>

        <Image unoptimized
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
