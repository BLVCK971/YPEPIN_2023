import Link from "next/link";
import "./DevStyle.css";
import Poste from "../components/Dev/Poste";
import Projet from "../components/Dev/Projet";
import CV from "./CV.json"


export default function Dev() {
  return (
    <main className="flex min-h-screen flex-col  p-24">
        <Link href="/" className="group animate-bounce z-10 w-full  lg:flex" style={{ viewTransitionName: "Dev" }}>
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            <span className="text-2xl font-semibold` inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ">
              &lt;-
            </span>
          </p>
        </Link>

      <video
        autoPlay
        muted
        loop
        className="video  group-hover:block -z-10 fixed top-0 left-0 right-0 bottom-0"
      >
        <source src="Design.mp4" type="video/mp4" />
      </video>
      {CV.CV.map((poste, index) => (
      <Poste
        key={index}
        entreprise={poste.entreprise}
        poste={poste.poste}
        date={poste.date}>
          {poste.Projets.map((projet, projetindex) => (
          <Projet
          key={projetindex} 
          nom={projet.nom} 
          desc={projet.desc} 
          duree={projet.duree} 
          texte={projet.taches} 
          envtech={projet.envtech}          
          />
          ))}
      </Poste>
      ))}
    </main>
  );
}
