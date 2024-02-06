import { PYDemo } from "./UI/PYDemo";
import "./UI/ui.css";
export default function Py() {
  return (
    <div>



<h1 className="PYBox text-3xl md:text-5xl font-semibold flex justify-center pb-6 pt-8  bg-gradient-to-b from-zinc-200  backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit   rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5">
        Python
      </h1>
      <div className="grid lg:grid-cols-4">

        <PYDemo title="Tictactoe vs IA" image ="/ttt.png" href="/py/aittt/index.html" desc="MinMax">
          <span className="inline-block bg-blue-400 rounded-full px-3 py-1 text-sm font-semibold text-white mr-2 mb-2">
            #css
          </span>
          <span className="inline-block bg-yellow-400 rounded-full px-3 py-1 text-sm font-semibold text-white mr-2 mb-2">
            #js
          </span>
        </PYDemo>

    

      </div></div>
        );
    }
    