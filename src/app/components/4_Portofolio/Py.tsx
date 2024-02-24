import { Demo } from "./UI/Demo";
import "./UI/ui.css";
import ttt from '/public/portofolio/ttt.png'
import dino from '/public/portofolio/Dino.png'



export default function Py() {
  return (
    <div>
      <h1 className="PYBox text-3xl md:text-5xl font-semibold flex justify-center pb-6 pt-8  bg-gradient-to-b from-zinc-200  backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit   rounded-xl border bg-gray-200 lg:p-4 p-2 pt-8 mb-5">
        Python
      </h1>
      <div className="grid lg:grid-cols-4">
        <Demo
          title="Tictactoe vs IA"
          image={ttt}
          href="/py/aittt/index.html"
          desc="Contre une IA basé sur l'algorithme MinMax"
          technos={["minmax","pygame"]}
          classe="PYBox"
        />
        <Demo
          title="Dino Google"
          image={dino}
          href="/py/dino/index.html"
          desc="Réplique du mini-jeu Dinosaure de Google"
          technos={["pygame"]}
          classe="PYBox"
        />
        
      </div>
    </div>
  );
}
