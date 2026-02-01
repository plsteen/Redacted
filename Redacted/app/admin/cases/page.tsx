"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface Case {
  id: string;
  code: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_duration_minutes: number;
  description: string;
  tags: string[];
  is_published: boolean;
  mystery_locales: Array<{ title: string; lang: string }>;
  created_at: string;
  updated_at: string;
}

interface EvidencePrompt {
  id: string;
  case_id: string;
  evidence_key: string;
  media_type: "image" | "video" | "audio" | "document";
  media_url: string | null;
  ai_provider: string;
  ai_model: string | null;
  prompt: string;
  prompt_version: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function CasesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<EvidencePrompt[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    title_en: "",
    title_no: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    estimated_duration_minutes: 30,
    description: "",
    tags: "",
  });

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cases?auth=${authParam || ""}`);
      const data = await res.json();
      setCases(data.cases || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [authParam]);

  const fetchEvidence = useCallback(
    async (caseId: string) => {
      try {
        const res = await fetch(
          `/api/admin/evidence?case_id=${caseId}&auth=${authParam || ""}`
        );
        const data = await res.json();
        setEvidence(data.evidence || []);
      } catch {
        setEvidence([]);
      }
    },
    [authParam]
  );

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchCases();
  }, [authParam, router, fetchCases]);

  useEffect(() => {
    if (selectedCase) {
      fetchEvidence(selectedCase.id);
    }
  }, [selectedCase, fetchEvidence]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      title_en: formData.title_en,
      title_no: formData.title_no,
      difficulty: formData.difficulty,
      estimated_duration_minutes: parseInt(formData.estimated_duration_minutes.toString()),
      description: formData.description,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      ...(editingCase && { id: editingCase.id }),
    };

    try {
      const res = await fetch(`/api/admin/cases?auth=${authParam}`, {
        method: editingCase ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchCases();
        resetForm();
      }
    } catch {
      alert("Failed to save case");
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm("Delete this case? This will also delete all evidence.")) return;

    try {
      const res = await fetch(`/api/admin/cases?auth=${authParam}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: caseId }),
      });

      if (res.ok) {
        fetchCases();
        setSelectedCase(null);
      }
    } catch {
      alert("Failed to delete case");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      title_en: "",
      title_no: "",
      difficulty: "medium",
      estimated_duration_minutes: 30,
      description: "",
      tags: "",
    });
    setEditingCase(null);
    setShowCreateForm(false);
  };

  const startEdit = (caseData: Case) => {
    const enTitle = caseData.mystery_locales.find((m) => m.lang === "en")?.title || "";
    const noTitle = caseData.mystery_locales.find((m) => m.lang === "no")?.title || "";

    setFormData({
      code: caseData.code,
      title_en: enTitle,
      title_no: noTitle,
      difficulty: caseData.difficulty,
      estimated_duration_minutes: caseData.estimated_duration_minutes,
      description: caseData.description,
      tags: caseData.tags.join(", "),
    });
    setEditingCase(caseData);
    setShowCreateForm(true);
  };

  const difficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-500/20 text-green-400 border-green-500/30",
      medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      hard: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[difficulty] || colors.medium;
  };

  if (authParam !== "redacted2026") return null;

  return (
    <AdminLayout title="Case Management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Cases</h2>
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="px-3 py-1.5 bg-[var(--color-gold)] text-black rounded text-sm font-semibold hover:bg-[var(--color-gold)]/90 transition"
            >
              + New
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-stone-400">Loading...</div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-stone-500">No cases yet</div>
          ) : (
            <div className="space-y-2">
              {cases.map((caseItem) => {
                const enTitle = caseItem.mystery_locales.find(
                  (m) => m.lang === "en"
                )?.title;
                return (
                  <div
                    key={caseItem.id}
                    onClick={() => setSelectedCase(caseItem)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      selectedCase?.id === caseItem.id
                        ? "bg-stone-700 border-[var(--color-gold)]"
                        : "bg-stone-800 border-stone-700 hover:border-stone-600"
                    }`}
                  >
                    <p className="font-medium text-white text-sm">{enTitle || caseItem.code}</p>
                    <p className="text-xs text-stone-400">{caseItem.code}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border font-semibold ${difficultyColor(
                          caseItem.difficulty
                        )}`}
                      >
                        {caseItem.difficulty.toUpperCase()}
                      </span>
                      {caseItem.is_published && (
                        <span className="px-2 py-0.5 rounded-full text-xs border border-green-500/30 bg-green-500/10 text-green-400 font-semibold">
                          Published
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Details & Edit Form */}
        <div className="lg:col-span-2">
          {showCreateForm ? (
            <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {editingCase ? "Edit Case" : "Create New Case"}
              </h2>
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="e.g., silent-harbour"
                      required
                      className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          difficulty: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) =>
                      setFormData({ ...formData, title_en: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    Title (Norsk)
                  </label>
                  <input
                    type="text"
                    value={formData.title_no}
                    onChange={(e) =>
                      setFormData({ ...formData, title_no: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimated_duration_minutes: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="e.g., nordic, noir, murder, detective"
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[var(--color-gold)] text-black rounded font-semibold hover:bg-[var(--color-gold)]/90 transition"
                  >
                    {editingCase ? "Update Case" : "Create Case"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-stone-600 text-white rounded hover:bg-stone-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : selectedCase ? (
            <div className="space-y-4">
              {/* Case Details */}
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedCase.mystery_locales.find((m) => m.lang === "en")?.title ||
                        selectedCase.code}
                    </h2>
                    <p className="text-sm text-stone-400">{selectedCase.code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(selectedCase)}
                      className="px-3 py-1.5 border border-stone-600 text-white rounded text-sm hover:bg-stone-700 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCase(selectedCase.id)}
                      className="px-3 py-1.5 border border-red-500/30 text-red-400 rounded text-sm hover:bg-red-500/10 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Difficulty:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border font-semibold ${difficultyColor(
                        selectedCase.difficulty
                      )}`}
                    >
                      {selectedCase.difficulty.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Est. Duration:</span>
                    <span className="text-white">
                      {selectedCase.estimated_duration_minutes} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Status:</span>
                    <span
                      className={
                        selectedCase.is_published
                          ? "text-green-400"
                          : "text-amber-400"
                      }
                    >
                      {selectedCase.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                  {selectedCase.description && (
                    <div className="pt-2 border-t border-stone-700">
                      <p className="text-stone-400 mb-1">Description:</p>
                      <p className="text-white text-xs leading-relaxed">
                        {selectedCase.description}
                      </p>
                    </div>
                  )}
                  {selectedCase.tags.length > 0 && (
                    <div className="pt-2 border-t border-stone-700 flex flex-wrap gap-2">
                      {selectedCase.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full text-xs bg-stone-700 text-stone-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence/Media Section */}
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Evidence & Media</h3>
                  <button
                    onClick={() => {
                      // TODO: Open evidence create modal
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 transition"
                  >
                    + Add Evidence
                  </button>
                </div>

                {evidence.length === 0 ? (
                  <p className="text-center py-8 text-stone-500">No evidence yet</p>
                ) : (
                  <div className="space-y-3">
                    {evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-stone-900 border border-stone-700 rounded p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white text-sm">
                              {ev.evidence_key}
                            </p>
                            <p className="text-xs text-stone-400">
                              {ev.media_type} • v{ev.prompt_version}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs bg-stone-800 text-stone-300">
                            {ev.ai_provider}
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 mt-2 p-2 bg-stone-950 rounded border border-stone-800">
                          <span className="text-stone-500">Prompt:</span> {ev.prompt}
                        </p>
                        {ev.notes && (
                          <p className="text-xs text-stone-400 mt-2">
                            <span className="font-semibold">Notes:</span> {ev.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-stone-500">
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
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-900 text-amber-100 flex items-center justify-center">
          <div className="text-xl">Loading...</div>
        </main>
      }
    >
      <CasesContent />
    </Suspense>
  );
}
