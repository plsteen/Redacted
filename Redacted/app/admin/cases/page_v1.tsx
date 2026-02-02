"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface CaseContent {
  id: string;
  title: string;
  location: string;
  date: string;
  difficulty: number;
  estimatedMinutes: number;
  priceNok: number;
  backstory: string;
  summary: string;
  culprit?: {
    name: string;
    image: string;
  };
  suspects?: Array<{
    name: string;
    role: string;
    status: string;
    notes: string;
  }>;
}

interface CaseData {
  code: string;
  en: CaseContent | null;
  no: CaseContent | null;
}

function CasesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");

  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [editingLang, setEditingLang] = useState<"en" | "no" | null>(null);
  const [editFormData, setEditFormData] = useState<CaseContent | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/case-content?auth=${authParam || ""}`);
      const data = await res.json();
      setCases(data.cases || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [authParam]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchCases();
  }, [authParam, router, fetchCases]);

  const startEdit = (caseData: CaseData, lang: "en" | "no") => {
    const content = lang === "en" ? caseData.en : caseData.no;
    if (content) {
      setEditFormData({ ...content });
      setEditingLang(lang);
    }
  };

  const cancelEdit = () => {
    setEditFormData(null);
    setEditingLang(null);
  };

  const handleSave = async () => {
    if (!selectedCase || !editingLang || !editFormData) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/case-content?auth=${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseCode: selectedCase.code,
          lang: editingLang,
          content: editFormData,
        }),
      });

      if (res.ok) {
        // Refresh cases
        await fetchCases();
        // Update selectedCase
        const updated = cases.find(c => c.code === selectedCase.code);
        if (updated) {
          setSelectedCase(updated);
        }
        cancelEdit();
        alert("Case saved successfully!");
      } else {
        alert("Failed to save case");
      }
    } catch {
      alert("Failed to save case");
    } finally {
      setSaving(false);
    }
  };

  if (authParam !== "redacted2026") return null;

  return (
    <AdminLayout title="Case Content Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-white mb-4">Cases</h2>

          {loading ? (
            <div className="text-center py-8 text-stone-400">Loading...</div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-stone-500">No cases found</div>
          ) : (
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <button
                  key={caseItem.code}
                  onClick={() => {
                    setSelectedCase(caseItem);
                    cancelEdit();
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    selectedCase?.code === caseItem.code
                      ? "bg-stone-700 border-[var(--color-gold)]"
                      : "bg-stone-800 border-stone-700 hover:border-stone-600"
                  }`}
                >
                  <p className="font-medium text-white">
                    {caseItem.en?.title || caseItem.code}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    {caseItem.code} • {caseItem.en?.estimatedMinutes || "?"} min
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Case Details / Edit Form */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            editingLang && editFormData ? (
              /* Edit Form */
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    Edit {editingLang === "en" ? "English" : "Norwegian"} Version
                  </h2>
                  <span className="text-xs text-stone-400 bg-stone-700 px-2 py-1 rounded">
                    {selectedCase.code}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editFormData.location}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, location: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">
                        Date
                      </label>
                      <input
                        type="text"
                        value={editFormData.date}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, date: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">
                        Difficulty (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={editFormData.difficulty}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, difficulty: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        value={editFormData.estimatedMinutes}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, estimatedMinutes: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-300 mb-1">
                        Price (NOK)
                      </label>
                      <input
                        type="number"
                        value={editFormData.priceNok}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, priceNok: parseInt(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">
                      Summary (kort beskrivelse på landingside)
                    </label>
                    <textarea
                      value={editFormData.summary}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, summary: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-300 mb-1">
                      Case Briefing (backstory som spillere ser ved start)
                    </label>
                    <textarea
                      value={editFormData.backstory}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, backstory: e.target.value })
                      }
                      rows={6}
                      className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none"
                    />
                  </div>

                  {editFormData.culprit && (
                    <div className="border-t border-stone-700 pt-4">
                      <h3 className="text-sm font-semibold text-white mb-3">Culprit</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-300 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editFormData.culprit.name}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                culprit: { ...editFormData.culprit!, name: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-300 mb-1">
                            Image Path
                          </label>
                          <input
                            type="text"
                            value={editFormData.culprit.image}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                culprit: { ...editFormData.culprit!, image: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-[var(--color-gold)] text-black rounded font-semibold hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-4 py-2 border border-stone-600 text-white rounded hover:bg-stone-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Case Preview */
              <div className="space-y-6">
                {/* English Version */}
                {selectedCase.en && (
                  <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <span className="text-lg">🇬🇧</span> English Version
                      </h3>
                      <button
                        onClick={() => startEdit(selectedCase, "en")}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 transition"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Title</p>
                        <p className="text-xl font-serif text-white">{selectedCase.en.title}</p>
                      </div>

                      <div className="flex gap-6 text-sm">
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Location</p>
                          <p className="text-stone-200">{selectedCase.en.location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Date</p>
                          <p className="text-stone-200">{selectedCase.en.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Duration</p>
                          <p className="text-stone-200">{selectedCase.en.estimatedMinutes} min</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Price</p>
                          <p className="text-stone-200">{selectedCase.en.priceNok} NOK</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Summary (landing page)</p>
                        <p className="text-stone-300 text-sm">{selectedCase.en.summary}</p>
                      </div>

                      <div className="border-t border-stone-700 pt-4">
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Case Briefing (what players see)</p>
                        <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedCase.en.backstory}</p>
                      </div>

                      {selectedCase.en.culprit && (
                        <div className="border-t border-stone-700 pt-4">
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Culprit</p>
                          <p className="text-stone-200">{selectedCase.en.culprit.name}</p>
                        </div>
                      )}

                      {selectedCase.en.suspects && selectedCase.en.suspects.length > 0 && (
                        <div className="border-t border-stone-700 pt-4">
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Suspects ({selectedCase.en.suspects.length})</p>
                          <div className="space-y-2">
                            {selectedCase.en.suspects.map((suspect, i) => (
                              <div key={i} className="bg-stone-900/50 rounded p-2 text-sm">
                                <p className="text-white font-medium">{suspect.name}</p>
                                <p className="text-stone-400 text-xs">{suspect.role} • {suspect.status}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Norwegian Version */}
                {selectedCase.no && (
                  <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <span className="text-lg">🇳🇴</span> Norwegian Version
                      </h3>
                      <button
                        onClick={() => startEdit(selectedCase, "no")}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 transition"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Tittel</p>
                        <p className="text-xl font-serif text-white">{selectedCase.no.title}</p>
                      </div>

                      <div className="flex gap-6 text-sm">
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Sted</p>
                          <p className="text-stone-200">{selectedCase.no.location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Dato</p>
                          <p className="text-stone-200">{selectedCase.no.date}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Varighet</p>
                          <p className="text-stone-200">{selectedCase.no.estimatedMinutes} min</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Pris</p>
                          <p className="text-stone-200">{selectedCase.no.priceNok} NOK</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Sammendrag (landingsside)</p>
                        <p className="text-stone-300 text-sm">{selectedCase.no.summary}</p>
                      </div>

                      <div className="border-t border-stone-700 pt-4">
                        <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Casebriefing (hva spillere ser)</p>
                        <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedCase.no.backstory}</p>
                      </div>

                      {selectedCase.no.culprit && (
                        <div className="border-t border-stone-700 pt-4">
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Gjerningsperson</p>
                          <p className="text-stone-200">{selectedCase.no.culprit.name}</p>
                        </div>
                      )}

                      {selectedCase.no.suspects && selectedCase.no.suspects.length > 0 && (
                        <div className="border-t border-stone-700 pt-4">
                          <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Mistenkte ({selectedCase.no.suspects.length})</p>
                          <div className="space-y-2">
                            {selectedCase.no.suspects.map((suspect, i) => (
                              <div key={i} className="bg-stone-900/50 rounded p-2 text-sm">
                                <p className="text-white font-medium">{suspect.name}</p>
                                <p className="text-stone-400 text-xs">{suspect.role} • {suspect.status}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-64 text-stone-500">
              Select a case to view details
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Loading...</div>}>
      <CasesContent />
    </Suspense>
  );
}
