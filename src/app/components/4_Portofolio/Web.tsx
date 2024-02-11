import WebDemo from "./UI/WebDemo";
import "./UI/ui.css";

const technos = {
  css: "bg-blue-400",
  js: "bg-yellow-400",
  threejs: "bg-orange-400",
  "dat.gui": "bg-orange-400",
  sass: "bg-rose-400",
};

export default function Web() {
  return (
    <div>
      <h1 className="UIBox text-3xl md:text-5xl font-semibold flex justify-center pb-6 pt-8  lg:p-4 p-2 mb-5  bg-gradient-to-b from-zinc-200  backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit   rounded-xl border bg-gray-200">
        Web User Interfaces
      </h1>
      <div className="grid lg:grid-cols-4">
        <WebDemo
          title="HackDiv"
          image="/portofolio/hackdiv.png"
          href="/Web/HackDiv/index.html"
          desc="Effet Hacking plein écran"
          technos={["css", "js"]}
        />

        <WebDemo
          title="Animation Prix CSS"
          image="/portofolio/pricing.png"
          href="/Web/PricingPureCSS/index.html"
          desc="Carte de prix avec effet 3D"
          technos={["css"]}
        />

        <WebDemo
          title="Duo"
          image="/portofolio/Duo.png"
          href="/Web/Duo/index.html"
          desc="Effet visuel d'un élément Three.js"
          technos={["css", "js"]}
        />

        <WebDemo
          title="Glassmorphism Login Form"
          image="/portofolio/glassmorphism.png"
          href="/Web/Glassmorphism Login/index.html"
          desc="Effet glassmorphisme avec blocs volant"
          technos={["css"]}
        />

        <WebDemo
          title="Split 3D Carousel"
          image="/portofolio/split.png"
          href="/Web/Split3D Carousel/index.html"
          desc="Animation 3D Carousel qui se coupent"
          technos={["css", "js"]}
        />

        <WebDemo
          title="Universe"
          image="/portofolio/Universe.png"
          href="/Web/Universe/index.html"
          desc="Effet 3D Etoiles et d'accélération"
          technos={["css", "js", "threejs"]}
        />

        <WebDemo
          title="Gravity Points"
          image="/portofolio/gravity.png"
          href="/Web/Gravity Points/index.html"
          desc="Interaction avec des points de gravités"
          technos={["css", "js", "dat.gui"]}
        />

        <WebDemo
          title="Paw Clap Button"
          image="/portofolio/paw.png"
          href="/Web/PawClapButton/index.html"
          desc="Animation bouton j'aime"
          technos={["css", "js", "sass"]}
        />

        <WebDemo
          title="3ImgTransition"
          image="/portofolio/transition.png"
          href="/Web/3ImgTransition/index.html"
          desc="Transition controlable 3D entre 2 images"
          technos={["css", "js", "threejs"]}
        />
      </div>
    </div>
  );
}
