import "./Boxes.css";
export default function Title() {
  return (
    <div className="relative flex place-items-center before:absolute before:h-[300px]  before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
      <h1 className="mb-3 text-9xl font-semibold">Yoel PEPIN</h1>
      <div className="floatbox">
        <div id="first" className="square" ></div>
        <div className="square" id="second"></div>
        <div className="square" id="third"></div>
        <div className="square" id="fourth"></div>
        <div className="square" id="fifth"></div>
      </div>

      {/* <video
        autoPlay
        muted
        loop
        className="video  group-hover:block -z-10 fixed top-0 left-0 right-0 bottom-0"
      >
        <source src="Design.mp4" type="video/mp4" />
      </video> */}
      {/* <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        /> */}
    </div>
  );
}