import Link from "next/link";
export default function Categories() {
  return (
    <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
      <Link
        href="/Dev"
        className="group relative box inline-block rounded-lg border border-transparent  transition-colors hover:border-gray-300 hover:bg-gray-100 hover:border-neutral-700 hover:bg-neutral-800/30 overflow-hidden"
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
      </Link>

      <Link
        href="/Data"
        className="group relative box inline-block rounded-lg border border-transparent  transition-colors hover:border-gray-300 hover:bg-gray-100 hover:border-neutral-700 hover:bg-neutral-800/30 overflow-hidden"
        rel="noopener noreferrer"
      >
        <video
          autoPlay
          muted
          loop
          className="video hidden  group-hover:block -z-10 absolute object-cover w-full h-full "
        >
          <source src="Data.mp4" type="video/mp4" />
        </video>
        <div className=" px-5 py-4">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            DataScience{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Business Intelligence,
            <br />
            Machine Learning
          </p>
        </div>
      </Link>

      <Link
        href="/Design"
        className="group relative box inline-block rounded-lg border border-transparent  transition-colors hover:border-gray-300 hover:bg-gray-100 hover:border-neutral-700 hover:bg-neutral-800/30 overflow-hidden"
        rel="noopener noreferrer"
      >
        <video
          autoPlay
          muted
          loop
          className="video hidden  group-hover:block -z-10 absolute object-cover w-full h-full "
        >
          <source src="Design.mp4" type="video/mp4" />
        </video>
        <div className=" px-5 py-4">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Design{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            User Interfaces,
            <br />
            User Experiences,
            <br />
            3D
          </p>
        </div>
      </Link>

      <Link
        href="/Fct"
        className="group relative box inline-block rounded-lg border border-transparent  transition-colors hover:border-gray-300 hover:bg-gray-100 hover:border-neutral-700 hover:bg-neutral-800/30 overflow-hidden"
        rel="noopener noreferrer"
      >
        <video
          autoPlay
          muted
          loop
          className="video hidden  group-hover:block -z-10 absolute object-cover w-full h-full "
        >
          <source src="Fct.mp4" type="video/mp4" />
        </video>
        <div className=" px-5 py-4">
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Fonctionnel{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Association WI-BASH
            <br />
            Télévision & Politique
            <br />
            Ventes, Comptabilité, Gestion Technico-Commerciale
          </p>
        </div>
      </Link>
    </div>
  );
}
