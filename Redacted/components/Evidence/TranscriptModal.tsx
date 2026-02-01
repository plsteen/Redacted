'use client';

interface TranscriptModalProps {
  title: string;
  transcript: string;
  onClose: () => void;
  locale: string;
}

export default function TranscriptModal({
  title,
  transcript,
  onClose,
  locale,
}: TranscriptModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-11/12 max-w-2xl max-h-[80vh] overflow-auto bg-[#0a0b0e] border border-[#e8b84d]/30 rounded-lg p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#e8b84d] hover:text-white transition-colors text-2xl font-bold"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#e8b84d] mb-4 pr-8">{title}</h2>

        {/* Transcript Content */}
        <div className="text-[#e0e0e0] leading-relaxed whitespace-pre-wrap text-sm font-mono">
          {transcript}
        </div>

        {/* Close Button at Bottom */}
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-[#e8b84d] text-[#0a0b0e] font-bold rounded hover:bg-[#f5c96a] transition-colors"
        >
          {locale === 'no' ? 'Lukk' : 'Close'}
        </button>
      </div>
    </div>
  );
}
