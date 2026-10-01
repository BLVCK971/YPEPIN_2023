import { ElementType, ReactNode, useEffect, useRef } from "react";
import { cn } from "./utils/cn";

// Fait apparaître son contenu en fondu au défilement.
// Rendu serveur : le contenu est visible (SEO, sans JavaScript). Côté client,
// seuls les éléments encore sous la ligne de flottaison sont masqués puis révélés.
export default function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.classList.add("reveal-hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.style.transitionDelay = `${delay}ms`;
        el.classList.remove("reveal-hidden");
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}
