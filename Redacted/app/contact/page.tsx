"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/Shared/LanguageSwitcher";
import { Footer } from "@/components/Shared/Footer";
import { useLocale } from "@/lib/hooks/useLocale";

export default function ContactPage() {
  const locale = useLocale();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const content = {
    en: {
      title: "Contact Us",
      subtitle: "We'd love to hear from you",
      backHome: "← Back to home",
      intro: "Have questions, feedback, or need help with a case? We're here to help. Fill out the form below or reach out directly via email.",
      nameLabel: "Your name",
      namePlaceholder: "Enter your name",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      subjectLabel: "Subject",
      subjectPlaceholder: "What's this about?",
      messageLabel: "Message",
      messagePlaceholder: "Tell us how we can help...",
      submitButton: "Send message",
      successTitle: "Message sent!",
      successMessage: "Thank you for reaching out. We'll get back to you within 24 hours.",
      sendAnother: "Send another message",
      directContact: "Or reach us directly",
      emailDirect: "support@redacted.game",
      responseTime: "We typically respond within 24 hours",
      subjects: [
        "General inquiry",
        "Technical support",
        "Billing question",
        "Partnership inquiry",
        "Press & media",
        "Other"
      ],
    },
    no: {
      title: "Kontakt oss",
      subtitle: "Vi vil gjerne høre fra deg",
      backHome: "← Tilbake til forsiden",
      intro: "Har du spørsmål, tilbakemeldinger eller trenger hjelp med en sak? Vi er her for å hjelpe. Fyll ut skjemaet nedenfor eller ta kontakt direkte via e-post.",
      nameLabel: "Ditt navn",
      namePlaceholder: "Skriv inn navnet ditt",
      emailLabel: "E-postadresse",
      emailPlaceholder: "deg@eksempel.no",
      subjectLabel: "Emne",
      subjectPlaceholder: "Hva gjelder dette?",
      messageLabel: "Melding",
      messagePlaceholder: "Fortell oss hvordan vi kan hjelpe...",
      submitButton: "Send melding",
      successTitle: "Melding sendt!",
      successMessage: "Takk for at du tok kontakt. Vi svarer deg innen 24 timer.",
      sendAnother: "Send en ny melding",
      directContact: "Eller kontakt oss direkte",
      emailDirect: "support@redacted.game",
      responseTime: "Vi svarer vanligvis innen 24 timer",
      subjects: [
        "Generell henvendelse",
        "Teknisk support",
        "Faktureringsspørsmål",
        "Samarbeidsforespørsel",
        "Presse og media",
        "Annet"
      ],
    },
  };

  const t = content[locale];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send this to an API
    // For now, we'll just show a success message
    setSubmitted(true);
    setFormState({ name: "", email: "", subject: "", message: "" });
  };

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

        <p className="text-[var(--color-muted)] mb-12 leading-relaxed">
          {t.intro}
        </p>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="md:col-span-2">
            {submitted ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="font-serif text-2xl text-white mb-2">{t.successTitle}</h2>
                <p className="text-[var(--color-muted)] mb-6">{t.successMessage}</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[var(--color-gold)] hover:text-white transition"
                >
                  {t.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm text-[var(--color-muted)] mb-2">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder={t.namePlaceholder}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-gold)] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-muted)] mb-2">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder={t.emailPlaceholder}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-gold)] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-muted)] mb-2">
                    {t.subjectLabel}
                  </label>
                  <select
                    required
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)] transition appearance-none"
                  >
                    <option value="" className="bg-[#1a1a1a]">{t.subjectPlaceholder}</option>
                    {t.subjects.map((subject) => (
                      <option key={subject} value={subject} className="bg-[#1a1a1a]">
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[var(--color-muted)] mb-2">
                    {t.messageLabel}
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder={t.messagePlaceholder}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-gold)] transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-[var(--color-gold)] text-black rounded-lg font-semibold hover:bg-[var(--color-gold)]/90 transition"
                >
                  {t.submitButton}
                </button>
              </form>
            )}
          </div>

          {/* Direct Contact Info */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-medium text-white mb-4">{t.directContact}</h3>
              <a
                href="mailto:support@redacted.game"
                className="text-[var(--color-gold)] hover:text-white transition block mb-2"
              >
                {t.emailDirect}
              </a>
              <p className="text-sm text-[var(--color-muted)]">
                {t.responseTime}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-medium text-white mb-4">
                {locale === "no" ? "Vanlige spørsmål" : "Common questions"}
              </h3>
              <p className="text-sm text-[var(--color-muted)] mb-4">
                {locale === "no" 
                  ? "Finn svar på de vanligste spørsmålene våre."
                  : "Find answers to our most common questions."
                }
              </p>
              <Link
                href="/faq"
                className="text-[var(--color-gold)] hover:text-white transition text-sm"
              >
                {locale === "no" ? "Se FAQ →" : "View FAQ →"}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
