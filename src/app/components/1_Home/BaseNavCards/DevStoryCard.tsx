export default function DevStoryCard() {
  return (
    <a
      href="#DevStory"
      className="group relative box inline-block rounded-lg border border-transparent  transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 overflow-hidden"
      rel="noopener noreferrer"
    >
      <video
        autoPlay
        muted
        loop
        className="video hidden  group-hover:block -z-10 absolute object-cover w-full h-full "
      >
        <source src="Dev.mp4" type="video/mp4" />
      </video>
      <div className=" px-5 py-4">
        <h2 className={`mb-3 text-2xl font-semibold`}>
          Dev Story{" "}
          <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
            -&gt;
          </span>
        </h2>
        <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
          Conception, Architecture,
          <br />
          C# , Python, JavaScript
        </p>
      </div>
    </a>
  );
}
