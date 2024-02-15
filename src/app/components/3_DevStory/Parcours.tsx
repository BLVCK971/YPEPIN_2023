import Company from "./components/Company";
import Image from "next/image";
import DeviceIntegration from "./Projects/DeviceIntegration";
import { DigitomPostes, SchneiderPostes } from "./data/data";
import BusinessZone from "./Projects/BusinessZone";
import "./components/Company.css";
import avisto from 'public/logos/avisto.png'
import schneider from 'public/logos/SCHNEIDER.png'
import digitom from 'public/logos/DIGITOM.png'


export default function Parcours() {
  return (
    <div className="md:p-24 p-2">
      <Company
        Id="Schneider"
        nom={"Avisto / Schneider Electric"}
        dates={"06/2023 - Aujourd'hui"}
        companyPostes={SchneiderPostes}
        companyLogos={[avisto,schneider]}
      >
        <DeviceIntegration />
      </Company>

      <Company
        Id="Digitom"
        nom={"Digitom"}
        dates={"10/2018 - 06/2023"}
        companyPostes={DigitomPostes}
        companyLogos={[digitom]}
      >
        <BusinessZone />
      </Company>
    </div>
  );
}
