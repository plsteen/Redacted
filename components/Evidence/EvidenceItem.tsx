'use client';

import { useState } from 'react';
import TranscriptModal from './TranscriptModal';

interface EvidenceItemProps {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'image';
  description: string;
  transcript?: string;
  has_transcript: boolean;
  locale: string;
}

const typeIcons: Record<string, string> = {
  document: '📄',
  video: '🎬',
  audio: '🎙️',
  image: '🖼️',
};

export default function EvidenceItem({
  title,
  type,
  description,
  transcript,
  has_transcript,
  locale,
}: EvidenceItemProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  const lesLabel = locale === 'no' ? 'Les' : 'Read';

  return (
    <>
      <div className="border border-[#e8b84d]/20 rounded-lg p-3 bg-[#14161a]/50 hover:bg-[#14161a]/80 hover:border-[#e8b84d]/50 transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{typeIcons[type]}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#e8b84d] text-sm truncate">{title}</h3>
            </div>
          </div>
          
          {/* Action Button - Moved to top right */}
          {has_transcript && transcript && (
            <button
              onClick={() => setShowTranscript(true)}
              className="shrink-0 px-3 py-1 bg-[#e8b84d] text-[#0a0b0e] font-bold text-xs rounded hover:bg-[#f5c96a] transition-all duration-200"
            >
              {lesLabel}
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[#b8b8b8] line-clamp-2">{description}</p>
      </div>

      {/* Transcript Modal */}
      {showTranscript && transcript && (
        <TranscriptModal
          title={title}
          transcript={transcript}
          onClose={() => setShowTranscript(false)}
          locale={locale}
        />
      )}
    </>
  );
}
