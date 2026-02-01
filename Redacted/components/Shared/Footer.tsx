'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/hooks/useLocale';

export function Footer() {
  const locale = useLocale();

  const year = new Date().getFullYear();
  
  const links = {
    en: {
      about: 'About',
      faq: 'FAQ',
      contact: 'Contact',
      privacy: 'Privacy',
      terms: 'Terms',
      creatorLabel: 'Created by',
      location: 'Porsgrunn, Norway',
      rights: 'All rights reserved.',
    },
    no: {
      about: 'Om oss',
      faq: 'FAQ',
      contact: 'Kontakt',
      privacy: 'Personvern',
      terms: 'Vilkår',
      creatorLabel: 'Laget av',
      location: 'Porsgrunn, Norge',
      rights: 'Alle rettigheter forbeholdt.',
    },
  };

  const t = links[locale];

  return (
    <footer className="mt-16 border-t border-white/10 py-8 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
          <Link href="/about" className="text-[var(--color-muted)] hover:text-white transition">
            {t.about}
          </Link>
          <Link href="/faq" className="text-[var(--color-muted)] hover:text-white transition">
            {t.faq}
          </Link>
          <Link href="/contact" className="text-[var(--color-muted)] hover:text-white transition">
            {t.contact}
          </Link>
          <Link href="/privacy" className="text-[var(--color-muted)] hover:text-white transition">
            {t.privacy}
          </Link>
          <Link href="/terms" className="text-[var(--color-muted)] hover:text-white transition">
            {t.terms}
          </Link>
        </nav>

        {/* Creator and Copyright */}
        <div className="text-center text-xs text-[var(--color-muted)]">
          <p>
            {t.creatorLabel} <span className="font-semibold text-white">Pål Steen</span> • {t.location}
          </p>
          <p className="mt-2">© {year} Redacted. {t.rights}</p>
        </div>
      </div>
    </footer>
  );
}
