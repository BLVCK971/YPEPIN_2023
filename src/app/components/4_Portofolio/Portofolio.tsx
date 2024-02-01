import HackDiv from "./UI/HackDiv";
import PricingPureCSS from "./UI/PricingPureCSS";
import "./UI/ui.css";
export default function Portofolio() {
  return (
    <div className="p-24 ">
      <h1 className="UIBox text-6xl font-semibold flex justify-center pb-6 pt-8  bg-gradient-to-b from-zinc-200  backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit   rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5">
        Web User Interfaces
      </h1>
      <div className="grid lg:grid-cols-4">
        <HackDiv />
        <PricingPureCSS />
      </div>
    </div>
  );
}
