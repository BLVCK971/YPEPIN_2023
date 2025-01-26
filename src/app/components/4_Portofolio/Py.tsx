import { Demo } from "./UI/Demo";
import "./UI/ui.css";
import ttt from '/public/portofolio/ttt.png'
import dino from '/public/portofolio/Dino.png'
import { CollapsibleSection } from "./UI/CollapsibleSection";

export default function Py() {
  return (
    <CollapsibleSection title="Python" className="PYBox">
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
    </CollapsibleSection>
  );
}
