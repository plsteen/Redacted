"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin/AdminLayout";

interface MysteryLocale {
  id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  lang: string;
}

interface Case {
  id: string;
  code: string;
  difficulty: "easy" | "medium" | "hard" | "very_difficult";
  estimated_duration_minutes: number;
  description: string;
  tags: string[];
  is_published: boolean;
  mystery_locales: MysteryLocale[];
  created_at: string;
  updated_at: string;
}

interface EvidenceLocale {
  id: string;
  title: string;
  content: string | null;
  lang: string;
}

interface Evidence {
  id: string;
  type: string;
  storage_path: string;
  unlocked_on_task_id: string | null;
  has_transcript: boolean;
  evidence_locales: EvidenceLocale[];
}

function CasesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    title_en: "",
    title_no: "",
    tagline_en: "",
    tagline_no: "",
    description_en: "",
    description_no: "",
    difficulty: "medium" as "easy" | "medium" | "hard" | "very_difficult",
    estimated_duration_minutes: 30,
    tags: "",
  });

  const [evidenceFormData, setEvidenceFormData] = useState({
    type: "",
    storage_path: "",
    title_en: "",
    title_no: "",
    content_en: "",
    content_no: "",
    has_transcript: false,
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
          `/api/admin/mysteries/${caseId}/evidence?auth=${authParam || ""}`
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
      tagline_en: formData.tagline_en,
      tagline_no: formData.tagline_no,
      description_en: formData.description_en,
      description_no: formData.description_no,
      difficulty: formData.difficulty,
      estimated_duration_minutes: parseInt(formData.estimated_duration_minutes.toString()),
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
        if (editingCase && selectedCase?.id === editingCase.id) {
          // Refresh selected case data
          const updatedCases = await fetch(`/api/admin/cases?auth=${authParam}`).then(r => r.json());
          const updated = updatedCases.cases.find((c: Case) => c.id === editingCase.id);
          if (updated) setSelectedCase(updated);
        }
      }
    } catch {
      alert("Failed to save case");
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm("Delete this case? This will also delete all associated content.")) return;

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedCase) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mysteryCode", selectedCase.code);

      const res = await fetch(`/api/admin/upload?auth=${authParam}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok && data.path) {
        setEvidenceFormData({
          ...evidenceFormData,
          storage_path: data.path,
        });
        alert(`File uploaded: ${data.fileName}`);
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddOrUpdateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    const payload = {
      type: evidenceFormData.type,
      storage_path: evidenceFormData.storage_path,
      title_en: evidenceFormData.title_en,
      title_no: evidenceFormData.title_no,
      content_en: evidenceFormData.content_en,
      content_no: evidenceFormData.content_no,
      has_transcript: evidenceFormData.has_transcript,
    };

    try {
      const url = editingEvidence
        ? `/api/admin/mysteries/${selectedCase.id}/evidence/${editingEvidence.id}?auth=${authParam}`
        : `/api/admin/mysteries/${selectedCase.id}/evidence?auth=${authParam}`;
      
      const method = editingEvidence ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetEvidenceForm();
        fetchEvidence(selectedCase.id);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to save evidence"}`);
      }
    } catch (error) {
      alert("Failed to save evidence");
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm("Delete this evidence?")) return;
    if (!selectedCase) return;

    try {
      const res = await fetch(
        `/api/admin/mysteries/${selectedCase.id}/evidence/${evidenceId}?auth=${authParam}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        fetchEvidence(selectedCase.id);
      } else {
        alert("Failed to delete evidence");
      }
    } catch (error) {
      alert("Failed to delete evidence");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      title_en: "",
      title_no: "",
      tagline_en: "",
      tagline_no: "",
      description_en: "",
      description_no: "",
      difficulty: "medium" as "easy" | "medium" | "hard" | "very_difficult",
      estimated_duration_minutes: 30,
      tags: "",
    });
    setEditingCase(null);
    setShowCreateForm(false);
  };

  const resetEvidenceForm = () => {
    setShowEvidenceForm(false);
    setEditingEvidence(null);
    setEvidenceFormData({
      type: "",
      storage_path: "",
      title_en: "",
      title_no: "",
      content_en: "",
      content_no: "",
      has_transcript: false,
    });
  };

  const startEdit = (caseData: Case) => {
    const enLocale = caseData.mystery_locales.find((m) => m.lang === "en");
    const noLocale = caseData.mystery_locales.find((m) => m.lang === "no");

    setFormData({
      code: caseData.code,
      title_en: enLocale?.title || "",
      title_no: noLocale?.title || "",
      tagline_en: enLocale?.tagline || "",
      tagline_no: noLocale?.tagline || "",
      description_en: enLocale?.description || "",
      description_no: noLocale?.description || "",
      difficulty: caseData.difficulty as "easy" | "medium" | "hard" | "very_difficult",
      estimated_duration_minutes: caseData.estimated_duration_minutes,
      tags: caseData.tags.join(", "),
    });
    setEditingCase(caseData);
    setShowCreateForm(true);
  };

  const startEditEvidence = (evidenceData: Evidence) => {
    const enLocale = evidenceData.evidence_locales.find((l) => l.lang === "en");
    const noLocale = evidenceData.evidence_locales.find((l) => l.lang === "no");

    setEvidenceFormData({
      type: evidenceData.type,
      storage_path: evidenceData.storage_path,
      title_en: enLocale?.title || "",
      title_no: noLocale?.title || "",
      content_en: enLocale?.content || "",
      content_no: noLocale?.content || "",
      has_transcript: evidenceData.has_transcript,
    });
    setEditingEvidence(evidenceData);
    setShowEvidenceForm(true);
  };

  const difficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-500/20 text-green-400 border-green-500/30",
      medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      hard: "bg-red-500/20 text-red-400 border-red-500/30",
      very_difficult: "bg-purple-500/20 text-purple-400 border-purple-500/30",
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
                        {caseItem.difficulty === "very_difficult" ? "VERY HARD" : caseItem.difficulty.toUpperCase()}
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
                      disabled={!!editingCase}
                      className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm disabled:opacity-50"
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
                          difficulty: e.target.value as "easy" | "medium" | "hard" | "very_difficult",
                        })
                      }
                      className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="very_difficult">Very Difficult</option>
                    </select>
                  </div>
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

                <div className="border-t border-stone-700 pt-4">
                  <h3 className="text-sm font-semibold text-white mb-3">English Content</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Title</label>
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
                      <label className="block text-xs text-stone-400 mb-1">Tagline</label>
                      <input
                        type="text"
                        value={formData.tagline_en}
                        onChange={(e) =>
                          setFormData({ ...formData, tagline_en: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Description</label>
                      <textarea
                        value={formData.description_en}
                        onChange={(e) =>
                          setFormData({ ...formData, description_en: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-700 pt-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Norwegian Content</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Tittel</label>
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
                      <label className="block text-xs text-stone-400 mb-1">Taglinje</label>
                      <input
                        type="text"
                        value={formData.tagline_no}
                        onChange={(e) =>
                          setFormData({ ...formData, tagline_no: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Beskrivelse</label>
                      <textarea
                        value={formData.description_no}
                        onChange={(e) =>
                          setFormData({ ...formData, description_no: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm resize-none"
                      />
                    </div>
                  </div>
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
                      {selectedCase.difficulty === "very_difficult" ? "VERY HARD" : selectedCase.difficulty.toUpperCase()}
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

                {/* Show localized content - Preview for Admin */}
                <div className="mt-6 pt-6 border-t border-stone-700">
                  <h3 className="text-base font-semibold text-white mb-4">What Users See</h3>
                  
                  {selectedCase.mystery_locales.map((locale) => (
                    <div key={locale.id} className="mb-6 last:mb-0">
                      <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                        {locale.lang === "en" ? "🇬🇧 English" : "🇳🇴 Norwegian"}
                      </h4>
                      
                      {/* Case Intro Preview */}
                      <div className="bg-stone-900/50 border border-stone-700/50 rounded p-4 space-y-3">
                        <div>
                          <p className="text-xs text-stone-500 font-semibold uppercase tracking-widest mb-1">Title</p>
                          <p className="text-white font-serif text-lg">{locale.title || "—"}</p>
                        </div>
                        
                        {locale.tagline && (
                          <div className="pt-3 border-t border-stone-700/50">
                            <p className="text-xs text-stone-500 font-semibold uppercase tracking-widest mb-1">Tagline</p>
                            <p className="text-stone-200 text-sm italic">{locale.tagline}</p>
                          </div>
                        )}
                        
                        {locale.description && (
                          <div className="pt-3 border-t border-stone-700/50">
                            <p className="text-xs text-stone-500 font-semibold uppercase tracking-widest mb-2">Description</p>
                            <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{locale.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Evidence</h3>
                  <button
                    onClick={() => {
                      resetEvidenceForm();
                      setShowEvidenceForm(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 transition"
                  >
                    + Add Evidence
                  </button>
                </div>

                {showEvidenceForm && (
                  <div className="bg-stone-900 border border-blue-600/30 rounded p-4 mb-4">
                    <h4 className="text-sm font-semibold text-white mb-3">
                      {editingEvidence ? "Edit Evidence" : "New Evidence"}
                    </h4>
                    <form onSubmit={handleAddOrUpdateEvidence} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-stone-400 mb-1">Type</label>
                          <select
                            value={evidenceFormData.type}
                            onChange={(e) =>
                              setEvidenceFormData({
                                ...evidenceFormData,
                                type: e.target.value,
                              })
                            }
                            required
                            className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                          >
                            <option value="">Select type...</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="document">Document</option>
                            <option value="text">Text</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-stone-400 mb-1">Storage Path</label>
                          <input
                            type="text"
                            value={evidenceFormData.storage_path}
                            onChange={(e) =>
                              setEvidenceFormData({
                                ...evidenceFormData,
                                storage_path: e.target.value,
                              })
                            }
                            placeholder="/cases/silent-harbour/photo.jpg"
                            required
                            className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-stone-400 mb-1">
                          Upload File
                        </label>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-[var(--color-gold)] file:text-black hover:file:bg-[var(--color-gold)]/90 disabled:opacity-50"
                        />
                        {uploading && (
                          <p className="text-xs text-blue-400 mt-1">Uploading...</p>
                        )}
                      </div>

                      <div className="border-t border-stone-700 pt-3">
                        <h5 className="text-xs font-semibold text-white mb-2">English</h5>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-stone-400 mb-1">Title</label>
                            <input
                              type="text"
                              value={evidenceFormData.title_en}
                              onChange={(e) =>
                                setEvidenceFormData({
                                  ...evidenceFormData,
                                  title_en: e.target.value,
                                })
                              }
                              required
                              placeholder="E.g., Crime scene photo"
                              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-stone-400 mb-1">Content/Description</label>
                            <textarea
                              value={evidenceFormData.content_en}
                              onChange={(e) =>
                                setEvidenceFormData({
                                  ...evidenceFormData,
                                  content_en: e.target.value,
                                })
                              }
                              rows={2}
                              placeholder="Optional description"
                              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-stone-700 pt-3">
                        <h5 className="text-xs font-semibold text-white mb-2">Norwegian</h5>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-stone-400 mb-1">Tittel</label>
                            <input
                              type="text"
                              value={evidenceFormData.title_no}
                              onChange={(e) =>
                                setEvidenceFormData({
                                  ...evidenceFormData,
                                  title_no: e.target.value,
                                })
                              }
                              required
                              placeholder="F.eks., Åstedfoto"
                              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-stone-400 mb-1">Innhold/Beskrivelse</label>
                            <textarea
                              value={evidenceFormData.content_no}
                              onChange={(e) =>
                                setEvidenceFormData({
                                  ...evidenceFormData,
                                  content_no: e.target.value,
                                })
                              }
                              rows={2}
                              placeholder="Valgfri beskrivelse"
                              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="has_transcript"
                          checked={evidenceFormData.has_transcript}
                          onChange={(e) =>
                            setEvidenceFormData({
                              ...evidenceFormData,
                              has_transcript: e.target.checked,
                            })
                          }
                          className="w-4 h-4"
                        />
                        <label htmlFor="has_transcript" className="text-xs text-stone-300">
                          Has transcript
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-500 transition text-sm"
                        >
                          {editingEvidence ? "Update Evidence" : "Add Evidence"}
                        </button>
                        <button
                          type="button"
                          onClick={resetEvidenceForm}
                          className="flex-1 px-3 py-2 border border-stone-600 text-white rounded hover:bg-stone-700 transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {evidence.length === 0 ? (
                  <p className="text-center py-8 text-stone-500">No evidence yet</p>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs text-stone-400 mb-3">
                      {evidence.length} evidence item{evidence.length !== 1 ? "s" : ""}
                    </div>
                    {evidence.map((ev) => {
                      const enLocale = ev.evidence_locales.find((l) => l.lang === "en");
                      const noLocale = ev.evidence_locales.find((l) => l.lang === "no");
                      return (
                        <div
                          key={ev.id}
                          className="bg-stone-900/50 border border-stone-700 rounded p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-xs bg-stone-700 text-stone-200 font-medium uppercase">
                                  {ev.type}
                                </span>
                                {ev.has_transcript && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-green-600/20 text-green-300 border border-green-600/30">
                                    Has Transcript
                                  </span>
                                )}
                              </div>
                              {enLocale && (
                                <div className="mb-2">
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">🇬🇧 English</p>
                                  <p className="text-white font-semibold text-sm">{enLocale.title}</p>
                                  {enLocale.content && (
                                    <p className="text-stone-300 text-xs mt-1 leading-relaxed whitespace-pre-wrap">{enLocale.content}</p>
                                  )}
                                </div>
                              )}
                              {noLocale && (
                                <div>
                                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-widest mb-1">🇳🇴 Norwegian</p>
                                  <p className="text-white font-semibold text-sm">{noLocale.title}</p>
                                  {noLocale.content && (
                                    <p className="text-stone-300 text-xs mt-1 leading-relaxed whitespace-pre-wrap">{noLocale.content}</p>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-stone-500 mt-2 pt-2 border-t border-stone-700">
                                📁 {ev.storage_path}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <button
                                onClick={() => startEditEvidence(ev)}
                                className="px-2 py-1 rounded text-xs border border-stone-600 text-white hover:bg-stone-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvidence(ev.id)}
                                className="px-2 py-1 rounded text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
