import WebDemo from "./UI/WebDemo";
import "./UI/ui.css";
import hackdiv from '/public/portofolio/hackdiv.png'
import pricing from '/public/portofolio/pricing.png'
import duo from '/public/portofolio/Duo.png'
import glassmorphism from '/public/portofolio/glassmorphism.png'
import split from '/public/portofolio/split.png'
import universe from '/public/portofolio/Universe.png'
import gravity from '/public/portofolio/gravity.png'
import paw from '/public/portofolio/paw.png'
import transition from '/public/portofolio/transition.png'
import Demo from "./UI/Demo";
import { CollapsibleSection } from "./UI/CollapsibleSection";

export default function Web() {
  return (
    <CollapsibleSection title="Web User Interfaces" className="UIBox">
      <div className="grid lg:grid-cols-4">
        <Demo
          title="HackDiv"
          image={hackdiv}
          href="/Web/HackDiv/index.html"
          desc="Effet Hacking plein écran"
          technos={["css", "js"]}
          classe="UIBox"
        />

        <Demo
          title="Animation Prix CSS"
          image={pricing}
          href="/Web/PricingPureCSS/index.html"
          desc="Carte de prix avec effet 3D"
          technos={["css"]}
          classe="UIBox"
        />

        <Demo
          title="Duo"
          image={duo}
          href="/Web/Duo/index.html"
          desc="Effet visuel d'un élément Three.js"
          technos={["css", "js"]}
          classe="UIBox"
        />

        <Demo
          title="Glassmorphism Login Form"
          image={glassmorphism}
          href="/Web/Glassmorphism Login/index.html"
          desc="Effet glassmorphisme avec blocs volant"
          technos={["css"]}
          classe="UIBox"
        />

        <Demo
          title="Split 3D Carousel"
          image={split}
          href="/Web/Split3D Carousel/index.html"
          desc="Animation 3D Carousel qui se coupent"
          technos={["css", "js"]}
          classe="UIBox"
        />

        <Demo
          title="Universe"
          image={universe}
          href="/Web/Universe/index.html"
          desc="Effet 3D Etoiles et d'accélération"
          technos={["css", "js", "threejs"]}
          classe="UIBox"
        />

        <Demo
          title="Gravity Points"
          image={gravity}
          href="/Web/Gravity Points/index.html"
          desc="Interaction avec des points de gravités"
          technos={["css", "js", "dat.gui"]}
          classe="UIBox"
        />

        <Demo
          title="Paw Clap Button"
          image={paw}
          href="/Web/PawClapButton/index.html"
          desc="Animation bouton j'aime"
          technos={["css", "js", "sass"]}
          classe="UIBox"
        />

        <Demo
          title="3ImgTransition"
          image={transition}
          href="/Web/3ImgTransition/index.html"
          desc="Transition controlable 3D entre 2 images"
          technos={["css", "js", "threejs"]}
          classe="UIBox"
        />
      </div>
    </CollapsibleSection>
  );
}
