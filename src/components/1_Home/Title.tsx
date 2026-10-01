import "./Boxes.css";
export default function Title() {
  return (
    <div className="relative flex place-items-center">
      {/* Carrés de verre : simple décor, derrière le texte */}
      <div className="floatbox" aria-hidden="true">
        <div id="first" className="square"></div>
        <div className="square" id="second"></div>
        <div className="square" id="third"></div>
        <div className="square" id="fourth"></div>
        <div className="square" id="fifth"></div>
      </div>
      <h1 className="relative z-10 text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tight text-center">
        Yoel PEPIN
      </h1>
    </div>
  );
}
