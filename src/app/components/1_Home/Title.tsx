import "./Boxes.css";
export default function Title() {
  return (
    <div className="relative flex place-items-center before:absolute before:h-[300px]  before:-translate-x-1/2 before:rounded-full   before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic  after:blur-2xl after:content-['']  before:from-transparent before:to-blue-700 before:opacity-10 after:from-sky-900 after:via-[#0141ff] after:opacity-40 before:lg:h-[360px] z-4">
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
          className="relative drop-shadow-[0_0_0.3rem_#ffffff70] invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        /> */}
    </div>
  );
}
