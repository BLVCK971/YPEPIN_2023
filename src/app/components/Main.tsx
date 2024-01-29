import Contact from "./1_Home/Contact";
import Title from "./1_Home/Title";
import Poste from "./1_Home/Poste";
import BaseNav from "./1_Home/BaseNav"
import DevStory from "./3_DevStory/DevStory";
import Portofolio from "./4_Portofolio/Portofolio";

export default function Main() {
  return (
    <main >
      <section id="Home" className="flex min-h-screen flex-col items-center justify-between p-24">
        <Contact />
        <Title />
        <Poste />
        <BaseNav />
      </section>
      <section id="DevStory" className="flex min-h-screen flex-col items-center">
        <h1 className="mb-3 text-9xl font-semibold">Dev Story</h1>
        <DevStory/>
      </section>
      <section id="Portofolio" className="flex min-h-screen flex-col items-center">
        <h1 className="mb-3 text-9xl font-semibold">Portofolio</h1>
        <Portofolio/>
      </section>

      
    </main>
  );
}
