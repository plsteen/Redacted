"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { Footer } from "@/components/Shared/Footer";
import { useLocale } from "@/lib/hooks/useLocale";

export default function AboutPage() {
  const locale = useLocale();

  const content = {
    en: {
      title: "About REDACTED",
      subtitle: "The Story Behind the Mystery",
      intro: "REDACTED is a Nordic noir investigation game where you and your friends work together to solve fictional mysteries in real-time.",
      
      section1Title: "Our Vision",
      section1Text: "We believe the best mysteries are solved together. REDACTED combines the atmosphere of Scandinavian crime fiction with the excitement of cooperative puzzle-solving. Whether you're gathered around a table or connecting from different corners of the world, our cases bring people together for unforgettable evenings of investigation and deduction.",
      
      section2Title: "How It Works",
      section2Items: [
        "One host purchases a case and invites friends to join",
        "Players collaborate in real-time, examining evidence and solving puzzles",
        "Each case takes 45 minutes to 5 hours depending on difficulty",
        "No app downloads required - everything runs in your browser",
        "Supports 2-8 players per session"
      ],
      
      section3Title: "Made in Norway",
      section3Text: "REDACTED is created by Pål Steen in Porsgrunn, Norway. Inspired by the rich tradition of Nordic noir literature and the social experience of escape rooms, we're building a new kind of mystery game for the digital age.",
      
      section4Title: "Our Cases",
      section4Text: "Each case is meticulously crafted with authentic Scandinavian settings, complex characters, and layered mysteries that reward careful observation and teamwork. From foggy harbors to remote mountain villages, our stories draw you into the dark heart of Nordic crime fiction.",
      
      backHome: "← Back to home",
    },
    no: {
      title: "Om REDACTED",
      subtitle: "Historien bak mysteriet",
      intro: "REDACTED er et nordic noir etterforskningsspill der du og vennene dine samarbeider for å løse fiktive mysterier i sanntid.",
      
      section1Title: "Vår visjon",
      section1Text: "Vi tror de beste mysteriene løses sammen. REDACTED kombinerer atmosfæren fra skandinavisk krim med spenningen ved samarbeidende gåteløsning. Enten dere er samlet rundt et bord eller kobler til fra forskjellige deler av verden, bringer sakene våre folk sammen for uforglemmelige kvelder med etterforskning og deduksjon.",
      
      section2Title: "Slik fungerer det",
      section2Items: [
        "Én vert kjøper en sak og inviterer venner til å bli med",
        "Spillere samarbeider i sanntid, undersøker bevis og løser gåter",
        "Hver sak tar 45 minutter til 5 timer avhengig av vanskelighetsgrad",
        "Ingen app-nedlastinger nødvendig - alt kjører i nettleseren din",
        "Støtter 2-8 spillere per økt"
      ],
      
      section3Title: "Laget i Norge",
      section3Text: "REDACTED er laget av Pål Steen i Porsgrunn, Norge. Inspirert av den rike tradisjonen med nordisk krim og den sosiale opplevelsen ved escape rooms, bygger vi en ny type mysterispill for den digitale tidsalderen.",
      
      section4Title: "Våre saker",
      section4Text: "Hver sak er nøye utformet med autentiske skandinaviske settinger, komplekse karakterer og lagdelte mysterier som belønner nøye observasjon og samarbeid. Fra tåkete havner til avsidesliggende fjellbygder, drar historiene våre deg inn i det mørke hjertet av nordisk krim.",
      
      backHome: "← Tilbake til forsiden",
    },
  };

  const t = content[locale];

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold text-white hover:text-[var(--color-gold)] transition">
            REDACTED
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-[var(--color-muted)] hover:text-white text-sm mb-8 inline-block transition">
          {t.backHome}
        </Link>

        <h1 className="font-serif text-4xl sm:text-5xl text-white mb-4">{t.title}</h1>
        <p className="text-[var(--color-gold)] text-lg mb-8">{t.subtitle}</p>

        <div className="prose prose-invert max-w-none space-y-12">
          <p className="text-lg text-[var(--color-muted)] leading-relaxed">
            {t.intro}
          </p>

          <section>
            <h2 className="font-serif text-2xl text-white mb-4">{t.section1Title}</h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              {t.section1Text}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-white mb-4">{t.section2Title}</h2>
            <ul className="space-y-3">
              {t.section2Items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[var(--color-muted)]">
                  <span className="text-[var(--color-gold)] mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-white mb-4">{t.section3Title}</h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              {t.section3Text}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-white mb-4">{t.section4Title}</h2>
            <p className="text-[var(--color-muted)] leading-relaxed">
              {t.section4Text}
            </p>
          </section>

          <div className="pt-8 border-t border-white/10">
            <Link 
              href="/" 
              className="inline-block px-6 py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition"
            >
              {locale === "no" ? "Utforsk sakene våre" : "Explore our cases"} →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
