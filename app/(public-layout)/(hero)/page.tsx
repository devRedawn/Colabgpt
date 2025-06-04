import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-5 justify-center h-[70vh]">
      <h3 className="text-4xl font-bold text-center">
        ColabGpt Wir 
        machen KI so einfach und sicher wie Slack.
      </h3>
      <p className="sm:w-[75%] mx-auto text-center text-muted-foreground ">
        Unternehmen wollen KI einsetzen aber ohne Datenrisiken, komplizierte Technik oder Kontrollverlust.
        Unsere Plattform bietet ihnen ein sofort einsatzbereites, sicheres Chat-Interface für ihre eigene Azure OpenAI-Instanz.
        Sie behalten 100 % Kontrolle über ihre Daten, Rechte & Nutzung ohne etwas selbst bauen zu müssen.
      </p>
      <Link href="/register" className={buttonVariants({ size: "lg" })}>
        jetzt starten
      </Link>
    </div>
  );
}
