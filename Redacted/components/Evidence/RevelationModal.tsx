'use client';

import { useEffect, useMemo, useRef } from 'react';

interface RevelationModalProps {
  title: string;
  revelation: string;
  isCorrect: boolean;
  onClose: () => void;
  locale: string;
  taskNumber: number;
  isHost?: boolean;
  isFinal?: boolean;
  culpritName?: string;
  culpritImage?: string;
}

export default function RevelationModal({
  title,
  revelation,
  isCorrect,
  onClose,
  locale,
  taskNumber,
  isFinal = false,
  culpritName,
  culpritImage,
}: RevelationModalProps) {
  const continueLabel = locale === 'no' ? 'Videre' : 'Continue';
  const finalBadge = locale === 'no' ? 'SISTE OPPGAVE LØST!' : 'FINAL TASK SOLVED!';

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  
  // Memoize revelation content to prevent flicker
  const revelationParagraphs = useMemo(() => revelation.split('\n\n'), [revelation]);

  if (!isCorrect) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-11/12 max-w-2xl max-h-[90vh] overflow-auto bg-gradient-to-b from-[#0a0b0e] to-[#14161a] border-2 border-[#e8b84d] rounded-lg p-8 shadow-2xl">
        {/* Success Badge */}
        <div className="text-center mb-6">
          {isFinal ? (
            <div className="mx-auto mb-4 w-36 sm:w-40">
              <div className="aspect-[3/4] overflow-hidden rounded-lg border border-[#e8b84d]/60 bg-[#0b0c10] shadow-lg">
                {culpritImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={culpritImage} alt={culpritName ?? "Culprit"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl text-[#e8b84d]">◆</div>
                )}
              </div>
              {culpritName && (
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#e8b84d]">{culpritName}</p>
              )}
            </div>
          ) : (
            <div className="inline-block text-6xl mb-3">✓</div>
          )}
          <h2 className={`text-2xl font-bold mb-1 ${isFinal ? "text-[#f5c96a]" : "text-[#e8b84d]"}`}>
            {isFinal ? finalBadge : locale === 'no' ? 'Korrekt!' : 'Correct!'}
          </h2>
          <p className="text-sm text-[#b8b8b8] uppercase tracking-widest">
            {locale === 'no' ? 'Oppgave' : 'Task'} {taskNumber} {locale === 'no' ? 'løst' : 'Solved'}
          </p>
          {isFinal && (
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[#f5c96a] animate-pulse">
              {locale === 'no' ? 'Finale!' : 'Finale!'}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#e8b84d]/30 to-transparent mb-6" />

        {/* Title */}
        <h3 className="text-lg font-bold text-[#e8b84d] mb-4">{title}</h3>

        {/* Revelation Content */}
        <div className="text-[#d0d0d0] leading-relaxed mb-6 space-y-4">
          {revelationParagraphs.map((paragraph, idx) => (
            <p key={idx} className="text-sm">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#e8b84d]/30 to-transparent mb-6" />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#e8b84d] text-[#0a0b0e] font-bold rounded hover:bg-[#f5c96a] transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {continueLabel}
          </button>
        </div>

        {/* Auto-close hint */}
        {/* Removed auto-close functionality - users must manually close */}
      </div>
    </div>
  );
}
