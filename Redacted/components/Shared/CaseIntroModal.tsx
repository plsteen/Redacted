'use client';

interface CaseIntroModalProps {
  title: string;
  location: string;
  date: string;
  backstory: string;
  onStart: () => void;
  locale: string;
}

export default function CaseIntroModal({
  title,
  location,
  date,
  backstory,
  onStart,
  locale,
}: CaseIntroModalProps) {
  const startLabel = locale === 'no' ? 'Start etterforskning' : 'Begin Investigation';
  const briefingLabel = locale === 'no' ? 'Casebriefing' : 'Case Briefing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-11/12 max-w-3xl max-h-[90vh] overflow-auto bg-gradient-to-b from-[#0a0b0e] to-[#14161a] border-2 border-[#e8b84d] rounded-lg shadow-2xl">
        {/* Header with geometric decoration */}
        <div className="relative p-8 border-b border-[#e8b84d]/30">
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#e8b84d]/20" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#e8b84d]/20" />
          
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[#e8b84d] font-semibold">
              {briefingLabel}
            </p>
            <h1 className="font-serif text-4xl text-white mb-2">{title}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-[#b8b8b8]">
              <span>📍 {location}</span>
              <span>•</span>
              <span>📅 {date}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Backstory */}
          <div className="space-y-4">
            <div className="prose prose-invert max-w-none">
              {backstory.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-[#d0d0d0] leading-relaxed text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#e8b84d]/30 to-transparent" />

          {/* Mission */}
          <div className="bg-[#14161a]/50 border border-[#e8b84d]/20 rounded-lg p-6">
            <p className="text-xs uppercase tracking-widest text-[#e8b84d] mb-3 font-semibold">
              {locale === 'no' ? 'Ditt oppdrag' : 'Your Mission'}
            </p>
            <p className="text-sm text-[#d0d0d0] leading-relaxed">
              {locale === 'no'
                ? 'Analyser bevisene, løs oppgavene, og avdekk sannheten. Hver riktig løsning åpner nye ledetråder og bringer deg nærmere å identifisere gjerningsmannen.'
                : 'Analyze the evidence, solve the tasks, and uncover the truth. Each correct solution unlocks new clues and brings you closer to identifying the culprit.'}
            </p>
          </div>
        </div>

        {/* Footer with action button */}
        <div className="relative p-8 border-t border-[#e8b84d]/30">
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#e8b84d]/20" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#e8b84d]/20" />
          
          <button
            onClick={onStart}
            className="w-full px-6 py-4 bg-[#e8b84d] text-[#0a0b0e] font-bold text-lg rounded hover:bg-[#f5c96a] transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#e8b84d]/30"
          >
            {startLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
