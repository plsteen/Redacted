'use client';

import { useState } from 'react';

interface PlayerNameModalProps {
  locale: string;
  onSubmit: (name: string) => void;
}

export default function PlayerNameModal({ locale, onSubmit }: PlayerNameModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  const labels = {
    title: locale === 'no' ? 'Hvem er du, etterforsker?' : 'Who are you, detective?',
    subtitle:
      locale === 'no'
        ? 'Skriv inn ditt navn for å begynne etterforskningen'
        : 'Enter your name to begin the investigation',
    placeholder: locale === 'no' ? 'Ditt navn' : 'Your name',
    submit: locale === 'no' ? 'Start etterforskning' : 'Begin Investigation',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-11/12 max-w-md bg-gradient-to-b from-[#0a0b0e] to-[#14161a] border-2 border-[#e8b84d] rounded-lg p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-[#e8b84d] mb-2 text-center">{labels.title}</h2>
        <p className="text-sm text-[#888888] text-center mb-6">{labels.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={labels.placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="w-full rounded-md border border-white/10 bg-[#0b0c10] px-4 py-3 text-sm text-white outline-none focus:border-[#e8b84d] placeholder-[#666666]"
            autoFocus
          />

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full px-4 py-3 bg-[#e8b84d] text-[#0a0b0e] font-bold rounded hover:bg-[#f5c96a] transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {labels.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
