"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { Footer } from "@/components/Shared/Footer";
import { useLocale } from "@/lib/hooks/useLocale";

export default function PrivacyPage() {
  const locale = useLocale();

  const content = {
    en: {
      title: "Privacy Policy",
      subtitle: "Last updated: January 2025",
      backHome: "← Back to home",
      sections: [
        {
          title: "Introduction",
          content: "REDACTED (\"we\", \"our\", or \"us\") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our mystery investigation game."
        },
        {
          title: "Information We Collect",
          content: "We collect information you provide directly to us, including:",
          list: [
            "Email address (for authentication and account management)",
            "Display name (for in-game identification)",
            "Payment information (processed securely by Stripe)",
            "Game progress and session data",
            "Communications you send to us"
          ]
        },
        {
          title: "How We Use Your Information",
          content: "We use the information we collect to:",
          list: [
            "Provide, maintain, and improve our services",
            "Process transactions and send related information",
            "Send you technical notices and support messages",
            "Respond to your comments and questions",
            "Analyze usage patterns to improve user experience"
          ]
        },
        {
          title: "Data Storage and Security",
          content: "Your data is stored securely using industry-standard encryption. We use Supabase for our database infrastructure, which provides enterprise-grade security. Payment processing is handled by Stripe, a PCI-compliant payment processor. We never store your complete payment card details."
        },
        {
          title: "Data Sharing",
          content: "We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:",
          list: [
            "With service providers who assist in our operations (Supabase, Stripe)",
            "To comply with legal obligations",
            "To protect our rights and prevent fraud",
            "With your consent"
          ]
        },
        {
          title: "Cookies",
          content: "We use essential cookies to maintain your session and preferences (such as language selection). These cookies are necessary for the service to function properly. We do not use advertising or tracking cookies."
        },
        {
          title: "Your Rights",
          content: "Under GDPR and Norwegian data protection laws, you have the right to:",
          list: [
            "Access your personal data",
            "Correct inaccurate data",
            "Request deletion of your data",
            "Object to processing of your data",
            "Data portability",
            "Withdraw consent at any time"
          ]
        },
        {
          title: "Data Retention",
          content: "We retain your personal data for as long as your account is active or as needed to provide you services. If you request account deletion, we will delete your data within 30 days, except where we are required to retain it for legal purposes."
        },
        {
          title: "Children's Privacy",
          content: "REDACTED is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately."
        },
        {
          title: "Changes to This Policy",
          content: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the \"Last updated\" date."
        },
        {
          title: "Contact Us",
          content: "If you have questions about this privacy policy or wish to exercise your rights, please contact us at: support@redacted.game"
        },
      ],
    },
    no: {
      title: "Personvernerklæring",
      subtitle: "Sist oppdatert: Januar 2025",
      backHome: "← Tilbake til forsiden",
      sections: [
        {
          title: "Introduksjon",
          content: "REDACTED (\"vi\", \"vår\" eller \"oss\") respekterer ditt personvern og er forpliktet til å beskytte dine personopplysninger. Denne personvernerklæringen forklarer hvordan vi samler inn, bruker og beskytter informasjonen din når du bruker vårt mysterieetterforsningsspill."
        },
        {
          title: "Informasjon vi samler inn",
          content: "Vi samler inn informasjon du gir oss direkte, inkludert:",
          list: [
            "E-postadresse (for autentisering og kontoadministrasjon)",
            "Visningsnavn (for identifikasjon i spillet)",
            "Betalingsinformasjon (behandlet sikkert av Stripe)",
            "Spillfremgang og øktdata",
            "Kommunikasjon du sender til oss"
          ]
        },
        {
          title: "Hvordan vi bruker informasjonen din",
          content: "Vi bruker informasjonen vi samler inn til å:",
          list: [
            "Tilby, vedlikeholde og forbedre våre tjenester",
            "Behandle transaksjoner og sende relatert informasjon",
            "Sende deg tekniske meldinger og støttemeldinger",
            "Svare på dine kommentarer og spørsmål",
            "Analysere bruksmønstre for å forbedre brukeropplevelsen"
          ]
        },
        {
          title: "Datalagring og sikkerhet",
          content: "Dataene dine lagres sikkert med bransjestandardkryptering. Vi bruker Supabase for vår databaseinfrastruktur, som tilbyr sikkerhet på bedriftsnivå. Betalingsbehandling håndteres av Stripe, en PCI-kompatibel betalingsbehandler. Vi lagrer aldri dine fullstendige betalingskortdetaljer."
        },
        {
          title: "Deling av data",
          content: "Vi selger, handler eller leier ikke ut personopplysningene dine til tredjeparter. Vi kan dele informasjonen din kun under følgende omstendigheter:",
          list: [
            "Med tjenesteleverandører som bistår i vår drift (Supabase, Stripe)",
            "For å overholde juridiske forpliktelser",
            "For å beskytte våre rettigheter og forhindre svindel",
            "Med ditt samtykke"
          ]
        },
        {
          title: "Informasjonskapsler",
          content: "Vi bruker nødvendige informasjonskapsler for å opprettholde økten din og preferansene dine (som språkvalg). Disse informasjonskapslene er nødvendige for at tjenesten skal fungere riktig. Vi bruker ikke reklame- eller sporingskapsler."
        },
        {
          title: "Dine rettigheter",
          content: "I henhold til GDPR og norske personvernlover har du rett til å:",
          list: [
            "Få tilgang til dine personopplysninger",
            "Rette unøyaktige data",
            "Be om sletting av dataene dine",
            "Protestere mot behandling av dataene dine",
            "Dataportabilitet",
            "Trekke tilbake samtykke når som helst"
          ]
        },
        {
          title: "Oppbevaring av data",
          content: "Vi beholder personopplysningene dine så lenge kontoen din er aktiv eller så lenge det er nødvendig for å tilby deg tjenester. Hvis du ber om sletting av kontoen, vil vi slette dataene dine innen 30 dager, unntatt der vi er pålagt å beholde dem av juridiske årsaker."
        },
        {
          title: "Barns personvern",
          content: "REDACTED er ikke beregnet for barn under 13 år. Vi samler ikke bevisst inn personopplysninger fra barn under 13 år. Hvis du mener vi har samlet inn informasjon fra et barn under 13 år, vennligst kontakt oss umiddelbart."
        },
        {
          title: "Endringer i denne erklæringen",
          content: "Vi kan oppdatere denne personvernerklæringen fra tid til annen. Vi vil varsle deg om eventuelle endringer ved å legge ut den nye personvernerklæringen på denne siden og oppdatere \"Sist oppdatert\"-datoen."
        },
        {
          title: "Kontakt oss",
          content: "Hvis du har spørsmål om denne personvernerklæringen eller ønsker å utøve dine rettigheter, vennligst kontakt oss på: support@redacted.game"
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
        <p className="text-[var(--color-muted)] text-sm mb-12">{t.subtitle}</p>

        <div className="space-y-10">
          {t.sections.map((section, index) => (
            <section key={index}>
              <h2 className="font-serif text-xl text-white mb-4">{section.title}</h2>
              <p className="text-[var(--color-muted)] leading-relaxed mb-4">
                {section.content}
              </p>
              {section.list && (
                <ul className="space-y-2 ml-4">
                  {section.list.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[var(--color-muted)]">
                      <span className="text-[var(--color-gold)] mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
