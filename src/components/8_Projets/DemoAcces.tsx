import { FormEvent, useEffect, useRef, useState } from "react";
import { useT } from "../../i18n";

// Démos sur autorisation. Sans accès, « Essayer la démo » ouvre cette fenêtre :
// demande d'accès (formulaire envoyé par Web3Forms, reçu par email), ou connexion
// par email une fois l'accès accordé (`npm run demos:acces -- ajouter <email>`).
// Le cookie demo_acces porte l'empreinte de l'email ; nginx la compare à la liste
// des emails autorisés, sur le VPS (deploy/nginx.conf, scripts/demos-acces.mjs).

// Clé publique Web3Forms (web3forms.com, liée à l'email de réception, conçue pour le navigateur).
// Vide : la demande part par le client mail du visiteur (mailto prérempli).
const WEB3FORMS_KEY = "";
const EMAIL_CONTACT = "yoelpepin97@gmail.com";

const SEL = "ypepin-demos:";
const COOKIE = "demo_acces";

export const aAccesDemos = () => document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=`));

const empreinte = async (email: string) => {
  const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SEL + email));
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, "0")).join("");
};

const poserCookie = (valeur: string, maxAge: number) => {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${valeur}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

export type DemoChoisie = { nom: string; url: string; mode: "demande" | "connexion" };

type Etat = "saisie" | "envoi" | "envoye" | "refuse" | "autorise" | "erreur";

const champ =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[15px] text-white placeholder:text-neutral-500 focus:border-cyan-400/60 focus:outline-none";
const bouton =
  "rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2 font-semibold text-white transition-opacity disabled:opacity-60";

export default function DemoAcces({ demo, onClose }: { demo: DemoChoisie; onClose: () => void }) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState(demo.mode);
  const [etat, setEtat] = useState<Etat>("saisie");
  const [email, setEmail] = useState("");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const changerMode = (m: DemoChoisie["mode"]) => {
    setMode(m);
    setEtat("saisie");
  };

  const connexion = async (e: FormEvent) => {
    e.preventDefault();
    setEtat("envoi");
    poserCookie(await empreinte(email.trim().toLowerCase()), 31536000);
    const r = await fetch("/demos/verif", { cache: "no-store" }).catch(() => null);
    if (r?.status === 204) return setEtat("autorise");
    poserCookie("", 0);
    setEtat("refuse");
  };

  const demande = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("botcheck")) return;
    const sujet = `Demande d'accès démo : ${demo.nom}`;
    const corps = {
      Nom: f.get("nom"),
      Email: f.get("email"),
      Entreprise: f.get("entreprise") || "-",
      Démo: `${demo.nom} (${demo.url})`,
      Message: f.get("message") || "-",
    };
    if (!WEB3FORMS_KEY) {
      const texte = Object.entries(corps).map(([k, v]) => `${k} : ${v}`).join("\n");
      location.href = `mailto:${EMAIL_CONTACT}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(texte)}`;
      return setEtat("envoye");
    }
    setEtat("envoi");
    const r = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: sujet, from_name: "ypepin.com", replyto: corps.Email, ...corps }),
    }).catch(() => null);
    setEtat(r?.ok ? "envoye" : "erreur");
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="demo-acces-titre"
      className="w-[min(92vw,30rem)] rounded-2xl border border-white/15 bg-neutral-950 p-0 text-white shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-300">{t("Démo", "Demo")} · {demo.nom}</p>
            <h2 id="demo-acces-titre" className="mt-1 text-xl font-semibold">
              {mode === "demande" ? t("Demander l'accès", "Request access") : t("Accéder à la démo", "Open the demo")}
            </h2>
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="text-2xl leading-none text-neutral-400 hover:text-white" aria-label={t("Fermer", "Close")}>
            ×
          </button>
        </div>

        {mode === "demande" ? (
          etat === "envoye" ? (
            <p className="text-[15px] leading-relaxed text-neutral-300">
              {WEB3FORMS_KEY
                ? t(
                    "Merci, votre demande est envoyée. Vous recevrez par email le lien d'accès aux démos ; il suffira ensuite de saisir votre adresse email.",
                    "Thank you, your request has been sent. You will receive the demo link by email; you will then only need to enter your email address."
                  )
                : t(
                    "Votre messagerie s'ouvre avec la demande préremplie : envoyez-la, je vous répondrai avec le lien d'accès aux démos.",
                    "Your email app opens with the request filled in: send it and I will reply with the demo link."
                  )}
            </p>
          ) : (
            <form onSubmit={demande} className="flex flex-col gap-3">
              <p className="text-[15px] leading-relaxed text-neutral-300">
                {t(
                  "Les démos sont de vraies applications clients, avec des données fictives. Laissez vos coordonnées : je vous envoie l'accès par email.",
                  "The demos are real client applications with sample data. Leave your details and I will send you access by email."
                )}
              </p>
              <input name="nom" required autoComplete="name" placeholder={t("Nom *", "Name *")} className={champ} />
              <input name="email" type="email" required autoComplete="email" placeholder="Email *" className={champ} />
              <input name="entreprise" autoComplete="organization" placeholder={t("Entreprise", "Company")} className={champ} />
              <textarea name="message" rows={3} placeholder={t("Message (optionnel)", "Message (optional)")} className={champ} />
              <input name="botcheck" type="checkbox" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {etat === "erreur" && (
                <p className="text-sm text-red-300">
                  {t("L'envoi a échoué. Réessayez ou écrivez-moi à ", "Sending failed. Try again or email me at ")}
                  <a href={`mailto:${EMAIL_CONTACT}`} className="underline">{EMAIL_CONTACT}</a>.
                </p>
              )}
              <button type="submit" disabled={etat === "envoi"} className={`${bouton} mt-1`}>
                {etat === "envoi" ? t("Envoi…", "Sending…") : t("Envoyer la demande", "Send request")}
              </button>
            </form>
          )
        ) : etat === "autorise" ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-[15px] text-neutral-300">{t("Accès confirmé.", "Access confirmed.")}</p>
            <a href={demo.url} target="_blank" rel="noopener" onClick={() => ref.current?.close()} className={bouton}>
              {t("Ouvrir la démo", "Open the demo")} ↗
            </a>
          </div>
        ) : (
          <form onSubmit={connexion} className="flex flex-col gap-3">
            <p className="text-[15px] leading-relaxed text-neutral-300">
              {t("Saisissez l'adresse email à laquelle vous avez reçu l'accès.", "Enter the email address your access was sent to.")}
            </p>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={champ}
            />
            {etat === "refuse" && (
              <p className="text-sm text-red-300">
                {t("Cette adresse n'a pas encore accès aux démos.", "This address does not have access to the demos yet.")}
              </p>
            )}
            <button type="submit" disabled={etat === "envoi"} className={`${bouton} mt-1`}>
              {etat === "envoi" ? t("Vérification…", "Checking…") : t("Accéder", "Continue")}
            </button>
          </form>
        )}

        {etat !== "autorise" && (
          <button
            type="button"
            onClick={() => changerMode(mode === "demande" ? "connexion" : "demande")}
            className="self-start text-sm text-cyan-300 hover:text-cyan-200"
          >
            {mode === "demande"
              ? t("J'ai déjà reçu l'accès →", "I already have access →")
              : t("Pas encore d'accès ? Faire une demande →", "No access yet? Request it →")}
          </button>
        )}
      </div>
    </dialog>
  );
}
