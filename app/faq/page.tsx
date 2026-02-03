"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { Footer } from "@/components/Shared/Footer";
import { useLocale } from "@/lib/hooks/useLocale";

export default function FAQPage() {
  const locale = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const content = {
    en: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about REDACTED",
      backHome: "← Back to home",
      faqs: [
        {
          q: "What is REDACTED?",
          a: "REDACTED is a real-time multiplayer mystery investigation game. Think of it as a digital escape room combined with a Nordic noir crime story. You and your friends work together to examine evidence, solve puzzles, and uncover the truth behind each case."
        },
        {
          q: "How many players can play?",
          a: "Each session supports 2-8 players. One person acts as the host (the one who purchases the case), and they can invite friends to join their investigation using a simple code."
        },
        {
          q: "Do all players need to pay?",
          a: "No! Only the host needs to purchase the case. Once purchased, the host can invite friends to join for free. The case stays in the host's library forever and can be replayed."
        },
        {
          q: "How long does a case take to complete?",
          a: "Cases vary from 45 minutes to 5 hours depending on difficulty. Each case listing shows the estimated duration. You can also save progress and continue later."
        },
        {
          q: "Do I need to install anything?",
          a: "No! REDACTED runs entirely in your web browser. Works on desktop, tablet, and mobile devices. No downloads or apps required."
        },
        {
          q: "Can we play if we're in different locations?",
          a: "Absolutely! REDACTED is designed for both in-person and remote play. Everyone connects through their browser, and all progress syncs in real-time. We recommend using a video call alongside the game for the best experience."
        },
        {
          q: "What happens if we get stuck?",
          a: "Each case includes a built-in hint system. You can request hints for any puzzle without affecting your final score. We design our cases to be challenging but fair."
        },
        {
          q: "Can we replay a case?",
          a: "Yes, purchased cases stay in your library forever. However, the mystery won't be as surprising the second time! Many groups enjoy introducing new friends to cases they've already solved."
        },
        {
          q: "What languages are available?",
          a: "REDACTED is fully available in English and Norwegian. You can switch languages at any time using the language selector."
        },
        {
          q: "How do I contact support?",
          a: "If you have questions or run into issues, please email us at support@redacted.game. We typically respond within 24 hours."
        },
      ],
    },
    no: {
      title: "Ofte stilte spørsmål",
      subtitle: "Alt du trenger å vite om REDACTED",
      backHome: "← Tilbake til forsiden",
      faqs: [
        {
          q: "Hva er REDACTED?",
          a: "REDACTED er et sanntids flerbrukerspill med mysterier. Tenk på det som et digitalt escape room kombinert med en nordisk krimfortelling. Du og vennene dine samarbeider for å undersøke bevis, løse gåter og avdekke sannheten bak hver sak."
        },
        {
          q: "Hvor mange spillere kan delta?",
          a: "Hver økt støtter 2-8 spillere. Én person er vert (den som kjøper saken), og kan invitere venner til å bli med i etterforskningen ved hjelp av en enkel kode."
        },
        {
          q: "Må alle spillere betale?",
          a: "Nei! Bare verten trenger å kjøpe saken. Når den er kjøpt, kan verten invitere venner til å bli med gratis. Saken forblir i vertens bibliotek for alltid og kan spilles på nytt."
        },
        {
          q: "Hvor lang tid tar en sak å fullføre?",
          a: "Saker varierer fra 45 minutter til 5 timer avhengig av vanskelighetsgrad. Hver saksliste viser estimert varighet. Du kan også lagre fremgangen og fortsette senere."
        },
        {
          q: "Må jeg installere noe?",
          a: "Nei! REDACTED kjører helt i nettleseren din. Fungerer på datamaskin, nettbrett og mobile enheter. Ingen nedlastinger eller apper kreves."
        },
        {
          q: "Kan vi spille hvis vi er på forskjellige steder?",
          a: "Absolutt! REDACTED er designet for både fysisk og fjernspill. Alle kobler til via nettleseren, og all fremgang synkroniseres i sanntid. Vi anbefaler å bruke en videosamtale ved siden av spillet for best opplevelse."
        },
        {
          q: "Hva skjer hvis vi står fast?",
          a: "Hver sak inkluderer et innebygd hintsystem. Du kan be om hint til enhver gåte uten at det påvirker sluttpoengene dine. Vi designer sakene våre for å være utfordrende, men rettferdige."
        },
        {
          q: "Kan vi spille en sak på nytt?",
          a: "Ja, kjøpte saker forblir i biblioteket ditt for alltid. Men mysteriet vil ikke være like overraskende andre gang! Mange grupper liker å introdusere nye venner for saker de allerede har løst."
        },
        {
          q: "Hvilke språk er tilgjengelige?",
          a: "REDACTED er fullt tilgjengelig på engelsk og norsk. Du kan bytte språk når som helst ved hjelp av språkvelgeren."
        },
        {
          q: "Hvordan kontakter jeg support?",
          a: "Hvis du har spørsmål eller støter på problemer, send oss en e-post til support@redacted.game. Vi svarer vanligvis innen 24 timer."
        },
      ],
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
        <p className="text-[var(--color-gold)] text-lg mb-12">{t.subtitle}</p>

        <div className="space-y-4">
          {t.faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-white/10 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition"
              >
                <span className="font-medium text-white pr-4">{faq.q}</span>
                <span className={`text-[var(--color-gold)] text-xl transition-transform ${openIndex === index ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-[var(--color-muted)] leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-[var(--color-muted)] mb-6">
            {locale === "no" 
              ? "Fant du ikke det du lette etter?" 
              : "Didn't find what you were looking for?"
            }
          </p>
          <Link 
            href="/contact" 
            className="inline-block px-6 py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition"
          >
            {locale === "no" ? "Kontakt oss" : "Contact us"} →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
