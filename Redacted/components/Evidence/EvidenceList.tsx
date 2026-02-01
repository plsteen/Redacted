"use client";

import { useState, useMemo } from "react";
import { getMessagesForLocale } from "@/lib/i18n";
import type { Evidence } from "@/types/mystery";
import EvidenceItem from "./EvidenceItem";

// Extended Evidence type for items that may have transcript
interface EvidenceWithTranscript extends Evidence {
  transcript?: string;
}

interface Props {
  items: Evidence[];
  locale: string;
}

export function EvidenceList({ items, locale }: Props) {
  const t = getMessagesForLocale(locale);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("interviews");

  // Categorize evidence - must be called before any early returns
  const categories = useMemo(() => {
    const cats = {
      interviews: [] as Evidence[],
      video: [] as Evidence[],
      photos: [] as Evidence[],
      documents: [] as Evidence[],
      physical: [] as Evidence[]
    };

    items.forEach(item => {
      // Check if it's an interview based on title
      if (item.title.toLowerCase().includes('avhør') || 
          item.title.toLowerCase().includes('interview') ||
          item.title.toLowerCase().includes('vitneforklaring') ||
          item.title.toLowerCase().includes('statement')) {
        cats.interviews.push(item);
      } else if (item.type === 'video') {
        cats.video.push(item);
      } else if (item.type === 'image') {
        cats.photos.push(item);
      } else if (item.type === 'document') {
        // Check if it's physical evidence based on title
        if (item.title.toLowerCase().includes('pass') || 
            item.title.toLowerCase().includes('passport') ||
            item.title.toLowerCase().includes('nøkkel') ||
            item.title.toLowerCase().includes('key')) {
          cats.physical.push(item);
        } else {
          cats.documents.push(item);
        }
      } else {
        cats.documents.push(item);
      }
    });

    return cats;
  }, [items]);

  if (!items.length) {
    return <p className="text-sm text-[var(--color-muted)]">{t.play.evidence}: 0</p>;
  }

  const getCategoryLabel = (key: string) => {
    const labels: Record<string, { en: string; no: string }> = {
      interviews: { en: "Interviews", no: "Avhør & Vitneforklaringer" },
      video: { en: "Video Evidence", no: "Videobevis" },
      photos: { en: "Crime Scene Photos", no: "Åstedsfoto" },
      documents: { en: "Documents", no: "Dokumenter" },
      physical: { en: "Physical Evidence", no: "Fysiske bevis" }
    };
    return labels[key][locale === 'no' ? 'no' : 'en'];
  };

  const getCategoryIcon = (key: string) => {
    const icons: Record<string, string> = {
      interviews: "🎙️",
      video: "📹",
      photos: "📸",
      documents: "📄",
      physical: "🔍"
    };
    return icons[key];
  };

  const toggleCategory = (key: string) => {
    setExpandedCategory(expandedCategory === key ? null : key);
  };

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{t.play.evidence}</p>
        <span className="text-xs text-[var(--color-muted)]">{items.length}</span>
      </div>
      
      <div className="space-y-2">
        {Object.entries(categories).map(([key, categoryItems]) => {
          if (categoryItems.length === 0) return null;
          
          const isExpanded = expandedCategory === key;
          
          return (
            <div key={key} className="border border-white/10 rounded-md overflow-hidden">
              <button
                onClick={() => toggleCategory(key)}
                className="w-full px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-[#14161a]/50 hover:bg-[#14161a]/80 transition text-left"
              >
                <span className="text-sm text-white flex items-center gap-2 min-w-0">
                  <span className="shrink-0">{getCategoryIcon(key)}</span>
                  <span className="break-words">{getCategoryLabel(key)}</span>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[var(--color-muted)]">({categoryItems.length})</span>
                  <span className="text-xs text-[var(--color-gold)]">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-2 space-y-2 bg-[#0a0b0e]/30">
                  {categoryItems.map((evidence) => {
                    const evWithTranscript = evidence as EvidenceWithTranscript;
                    return (
                      <EvidenceItem
                        key={evidence.id}
                        id={evidence.id}
                        title={evidence.title}
                        type={evidence.type as 'document' | 'video' | 'audio' | 'image'}
                        description={evidence.description}
                        transcript={evWithTranscript.transcript}
                        has_transcript={evidence.has_transcript}
                        locale={locale}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
