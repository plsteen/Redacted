"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { Footer } from "@/components/Shared/Footer";
import { useLocale } from "@/lib/hooks/useLocale";

export default function TermsPage() {
  const locale = useLocale();

  const content = {
    en: {
      title: "Terms of Service",
      subtitle: "Last updated: January 2025",
      backHome: "← Back to home",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: "By accessing or using REDACTED (\"the Service\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service."
        },
        {
          title: "2. Description of Service",
          content: "REDACTED is an online multiplayer mystery investigation game. The Service allows users to purchase and play interactive mystery cases, collaborate with other players in real-time, and access related content and features."
        },
        {
          title: "3. User Accounts",
          content: "To access certain features of the Service, you may need to create an account. You are responsible for:",
          list: [
            "Maintaining the confidentiality of your account credentials",
            "All activities that occur under your account",
            "Notifying us immediately of any unauthorized use",
            "Providing accurate and complete information"
          ]
        },
        {
          title: "4. Purchases and Payments",
          content: "When you purchase a case through our Service:",
          list: [
            "All payments are processed securely through Stripe",
            "Prices are displayed in Norwegian Kroner (NOK) and include VAT",
            "Purchases grant you a non-exclusive, non-transferable license to access the content",
            "Purchased cases remain in your library indefinitely",
            "Due to the digital nature of our products, refunds are handled on a case-by-case basis"
          ]
        },
        {
          title: "5. Acceptable Use",
          content: "You agree not to:",
          list: [
            "Share, redistribute, or resell purchased content",
            "Attempt to access, probe, or modify restricted areas of the Service",
            "Use the Service for any illegal purpose",
            "Interfere with or disrupt the Service or servers",
            "Impersonate others or provide false information",
            "Upload malicious code or content",
            "Harass, abuse, or harm other users"
          ]
        },
        {
          title: "6. Intellectual Property",
          content: "All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are the exclusive property of REDACTED and are protected by international copyright, trademark, and other intellectual property laws."
        },
        {
          title: "7. User Content",
          content: "When you submit feedback, suggestions, or other content to us, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and modify such content for the purpose of improving our Service."
        },
        {
          title: "8. Multiplayer Features",
          content: "The Service includes real-time multiplayer functionality. When participating in multiplayer sessions:",
          list: [
            "You are responsible for your interactions with other players",
            "The host of a session is responsible for managing access",
            "We reserve the right to monitor sessions for violations of these terms",
            "We may terminate sessions that violate our policies"
          ]
        },
        {
          title: "9. Service Availability",
          content: "We strive to maintain continuous availability of the Service, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control."
        },
        {
          title: "10. Disclaimers",
          content: "THE SERVICE IS PROVIDED \"AS IS\" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT."
        },
        {
          title: "11. Limitation of Liability",
          content: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, REDACTED SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES."
        },
        {
          title: "12. Indemnification",
          content: "You agree to indemnify and hold harmless REDACTED and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms."
        },
        {
          title: "13. Governing Law",
          content: "These Terms shall be governed by and construed in accordance with the laws of Norway. Any disputes arising from these Terms shall be resolved in the courts of Norway."
        },
        {
          title: "14. Changes to Terms",
          content: "We reserve the right to modify these Terms at any time. We will notify users of significant changes by posting a notice on the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms."
        },
        {
          title: "15. Contact",
          content: "If you have questions about these Terms of Service, please contact us at: support@redacted.game"
        },
      ],
    },
    no: {
      title: "Vilkår for bruk",
      subtitle: "Sist oppdatert: Januar 2025",
      backHome: "← Tilbake til forsiden",
      sections: [
        {
          title: "1. Aksept av vilkår",
          content: "Ved å få tilgang til eller bruke REDACTED (\"Tjenesten\") godtar du å være bundet av disse vilkårene for bruk. Hvis du ikke godtar disse vilkårene, vennligst ikke bruk Tjenesten."
        },
        {
          title: "2. Beskrivelse av Tjenesten",
          content: "REDACTED er et online flerspiller mysterieetterforsningsspill. Tjenesten lar brukere kjøpe og spille interaktive mysteriesaker, samarbeide med andre spillere i sanntid og få tilgang til relatert innhold og funksjoner."
        },
        {
          title: "3. Brukerkontoer",
          content: "For å få tilgang til visse funksjoner i Tjenesten kan det hende du må opprette en konto. Du er ansvarlig for:",
          list: [
            "Å opprettholde konfidensialiteten til kontoinformasjonen din",
            "Alle aktiviteter som skjer under kontoen din",
            "Å varsle oss umiddelbart om uautorisert bruk",
            "Å gi nøyaktig og fullstendig informasjon"
          ]
        },
        {
          title: "4. Kjøp og betalinger",
          content: "Når du kjøper en sak gjennom vår Tjeneste:",
          list: [
            "Alle betalinger behandles sikkert gjennom Stripe",
            "Priser vises i norske kroner (NOK) og inkluderer MVA",
            "Kjøp gir deg en ikke-eksklusiv, ikke-overførbar lisens til å få tilgang til innholdet",
            "Kjøpte saker forblir i biblioteket ditt på ubestemt tid",
            "På grunn av den digitale naturen til produktene våre håndteres refusjoner fra sak til sak"
          ]
        },
        {
          title: "5. Akseptabel bruk",
          content: "Du samtykker i å ikke:",
          list: [
            "Dele, redistribuere eller videreselge kjøpt innhold",
            "Forsøke å få tilgang til, sondere eller endre begrensede områder av Tjenesten",
            "Bruke Tjenesten til ulovlige formål",
            "Forstyrre eller ødelegge Tjenesten eller serverne",
            "Utgi deg for andre eller gi falsk informasjon",
            "Laste opp skadelig kode eller innhold",
            "Trakassere, misbruke eller skade andre brukere"
          ]
        },
        {
          title: "6. Immaterielle rettigheter",
          content: "Alt innhold, funksjoner og funksjonalitet i Tjenesten, inkludert men ikke begrenset til tekst, grafikk, logoer, ikoner, bilder, lydklipp og programvare, er REDACTED sin eksklusive eiendom og er beskyttet av internasjonale opphavsretts-, varemerke- og andre immaterielle rettigheter."
        },
        {
          title: "7. Brukerinnhold",
          content: "Når du sender inn tilbakemeldinger, forslag eller annet innhold til oss, gir du oss en verdensomspennende, ikke-eksklusiv, royalty-fri lisens til å bruke, reprodusere og modifisere slikt innhold for å forbedre Tjenesten vår."
        },
        {
          title: "8. Flerspillerfunksjoner",
          content: "Tjenesten inkluderer sanntids flerspillerfunksjonalitet. Når du deltar i flerspillerøkter:",
          list: [
            "Du er ansvarlig for dine interaksjoner med andre spillere",
            "Verten for en økt er ansvarlig for å administrere tilgang",
            "Vi forbeholder oss retten til å overvåke økter for brudd på disse vilkårene",
            "Vi kan avslutte økter som bryter våre retningslinjer"
          ]
        },
        {
          title: "9. Tjenestens tilgjengelighet",
          content: "Vi streber etter å opprettholde kontinuerlig tilgjengelighet av Tjenesten, men vi garanterer ikke uavbrutt tilgang. Tjenesten kan være midlertidig utilgjengelig på grunn av vedlikehold, oppdateringer eller omstendigheter utenfor vår kontroll."
        },
        {
          title: "10. Ansvarsfraskrivelser",
          content: "TJENESTEN LEVERES \"SOM DEN ER\" UTEN GARANTIER AV NOE SLAG, VERKEN UTTRYKTE ELLER UNDERFORSTÅTTE. VI FRASKRIVER OSS ALLE GARANTIER, INKLUDERT UNDERFORSTÅTTE GARANTIER OM SALGBARHET, EGNETHET FOR ET BESTEMT FORMÅL OG IKKE-KRENKELSE."
        },
        {
          title: "11. Ansvarsbegrensning",
          content: "I DEN GRAD LOVEN TILLATER, SKAL REDACTED IKKE VÆRE ANSVARLIG FOR NOEN INDIREKTE, TILFELDIGE, SPESIELLE, FØLGESKADER ELLER STRAFFESKADER, INKLUDERT TAP AV FORTJENESTE, DATA ELLER ANDRE IMMATERIELLE TAP."
        },
        {
          title: "12. Skadesløsholdelse",
          content: "Du samtykker i å holde REDACTED og dets ledere, direktører, ansatte og agenter skadesløse fra alle krav, skader, tap eller utgifter som oppstår fra din bruk av Tjenesten eller brudd på disse Vilkårene."
        },
        {
          title: "13. Gjeldende lov",
          content: "Disse Vilkårene skal styres av og tolkes i samsvar med lovene i Norge. Eventuelle tvister som oppstår fra disse Vilkårene skal løses i norske domstoler."
        },
        {
          title: "14. Endringer i vilkårene",
          content: "Vi forbeholder oss retten til å endre disse Vilkårene når som helst. Vi vil varsle brukere om vesentlige endringer ved å legge ut en melding på Tjenesten. Din fortsatte bruk av Tjenesten etter slike endringer utgjør aksept av de oppdaterte Vilkårene."
        },
        {
          title: "15. Kontakt",
          content: "Hvis du har spørsmål om disse vilkårene for bruk, vennligst kontakt oss på: support@redacted.game"
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
