import Link from "next/link";


export default function Dev() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <section>Salut</section>
      </div>
      <h2>
        <Link href="/">Back to home</Link>
      </h2>

      <video className=" w-auto h-32 video" autoPlay loop muted >   
      <source src="Wave.mp4"  type="video/mp4" />
      </video>
    </main>
  );
}
