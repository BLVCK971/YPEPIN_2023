import Image from "next/image";
import Link from "next/link";

export default function PricingPureCSS() {
    return (
        <div className=" UIBox pb-6 pt-8 grid grid-rows-3  dark:border-neutral-800 lg:w-auto  lg:rounded-xl lg:border  lg:p-4 p-4  m-5">
             <h1 className="mb-3 text-2xl font-bold row-span-3">
            PricingPureCSS</h1>
              <div className="text-lg font-semibold row-span-3">Carte de présentation de prix</div>
            
    

            <Link href={"/Web/PricingPureCSS/index.html"}
            className="row-span-3"> 
            <Image unoptimized
              src="/pricing.png"
              width={800}
              height={800}
              alt="hackdiv Image"
              className="col-span-1"
            />
            </Link>
    
          </div>
      );
    }
    