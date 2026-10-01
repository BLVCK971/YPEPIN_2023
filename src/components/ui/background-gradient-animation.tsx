import { cn } from "./utils/cn";
import { CSSProperties, useEffect, useRef } from "react";

// Fond animé fixe, affiché derrière toute la page (pas seulement le hero).
// Les couleurs sont au format "R, G, B" car elles sont injectées dans rgba(...).
export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(0, 0, 0)",
  gradientBackgroundEnd = "rgb(0, 0, 0)",
  firstColor = "9, 38, 53",
  secondColor = "3, 6, 55",
  thirdColor = "60, 7, 83",
  fourthColor = "114, 4, 85",
  fifthColor = "145, 10, 103",
  pointerColor = "88, 28, 135",
  size = "80%",
  blendingValue = "hard-light",
  interactive = true,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  interactive?: boolean;
}) => {
  const interactiveRef = useRef<HTMLDivElement>(null);

  // Le blob interactif suit la souris avec un lissage, via requestAnimationFrame
  // (et non un setState à chaque mouvement, qui re-rendait tout le composant).
  useEffect(() => {
    if (!interactive) return;
    let curX = window.innerWidth / 2;
    let curY = window.innerHeight / 2;
    let tgX = curX;
    let tgY = curY;
    let frame = 0;

    const onMove = (e: MouseEvent) => {
      tgX = e.clientX;
      tgY = e.clientY;
    };
    const tick = () => {
      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      if (interactiveRef.current) {
        interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      }
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [interactive]);

  // Safari gère mal le filtre SVG "goo" combiné au blur : simple flou à la place.
  const isSafari =
    typeof navigator !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const vars = {
    "--gradient-background-start": gradientBackgroundStart,
    "--gradient-background-end": gradientBackgroundEnd,
    "--first-color": firstColor,
    "--second-color": secondColor,
    "--third-color": thirdColor,
    "--fourth-color": fourthColor,
    "--fifth-color": fifthColor,
    "--pointer-color": pointerColor,
    "--size": size,
    "--blending-value": blendingValue,
  } as CSSProperties;

  const blob =
    "absolute [mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)] motion-reduce:animate-none";

  return (
    <div
      aria-hidden="true"
      style={vars}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]"
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div
        className={cn(
          "gradients-container h-full w-full",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
        )}
      >
        <div
          className={cn(
            blob,
            "[background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat]",
            "[transform-origin:center_center] animate-first opacity-100"
          )}
        />
        <div
          className={cn(
            blob,
            "[background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]",
            "[transform-origin:calc(50%-400px)] animate-second opacity-100"
          )}
        />
        <div
          className={cn(
            blob,
            "[background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]",
            "[transform-origin:calc(50%+400px)] animate-third opacity-100"
          )}
        />
        <div
          className={cn(
            blob,
            "[background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]",
            "[transform-origin:calc(50%-200px)] animate-fourth opacity-70"
          )}
        />
        <div
          className={cn(
            blob,
            "[background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]",
            "[transform-origin:calc(50%-800px)_calc(50%+800px)] animate-fifth opacity-100"
          )}
        />
        {interactive && (
          <div
            ref={interactiveRef}
            className="absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat] [mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2 opacity-70"
          />
        )}
      </div>
    </div>
  );
};
