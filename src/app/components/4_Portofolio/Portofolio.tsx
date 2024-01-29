import HackDiv from "./UI/HackDiv";
import PricingPureCSS from "./UI/PricingPureCSS";
import "./UI/ui.css";
export default function Portofolio() {
  return (
    <div className="p-24">
        <h1 className="UIBox text-6xl font-semibold pb-6 pt-8  dark:border-neutral-800 lg:w-auto  lg:rounded-xl lg:border  lg:p-4 p-4  mb-5">Web User Interfaces</h1>
    <div className="grid grid-cols-4">
    <HackDiv/>
    <PricingPureCSS/>
    </div>
    </div>
  );
}
