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

interface Task {
  id: string;
  idx: number;
  type: "mcq" | "open";
  question: string;
  options: string[];
  answer: string;
  hint: string;
  is_final: boolean;
  revelation: string;
}

interface Evidence {
  id: string;
  title: string;
  type: "document" | "image" | "audio" | "video";
  description: string;
  storage_path: string;
  transcript: string;
  unlocked_on_task_idx: number;
  has_transcript: boolean;
}

interface CaseData {
  code: string;
  en: CaseContent | null;
  no: CaseContent | null;
}

type Tab = "info" | "tasks" | "evidence";

function CasesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authParam = searchParams?.get("auth");

  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [selectedLang, setSelectedLang] = useState<"en" | "no">("en");
  
  // Case info editing
  const [editingInfo, setEditingInfo] = useState(false);
  const [editFormData, setEditFormData] = useState<CaseContent | null>(null);
  
  // Tasks editing
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  
  // Evidence editing
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  
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

  const fetchTasks = useCallback(async (caseCode: string, lang: "en" | "no") => {
    setTasksLoading(true);
    try {
      const res = await fetch(
        `/api/admin/case-content/tasks?auth=${authParam}&caseCode=${caseCode}&lang=${lang}`
      );
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [authParam]);

  const fetchEvidence = useCallback(async (caseCode: string, lang: "en" | "no") => {
    setEvidenceLoading(true);
    try {
      const res = await fetch(
        `/api/admin/case-content/evidence?auth=${authParam}&caseCode=${caseCode}&lang=${lang}`
      );
      const data = await res.json();
      setEvidence(data.evidence || []);
    } catch {
      setEvidence([]);
    } finally {
      setEvidenceLoading(false);
    }
  }, [authParam]);

  useEffect(() => {
    if (authParam !== "redacted2026") {
      router.push("/admin");
      return;
    }
    fetchCases();
  }, [authParam, router, fetchCases]);

  useEffect(() => {
    if (selectedCase && activeTab === "tasks") {
      fetchTasks(selectedCase.code, selectedLang);
    } else if (selectedCase && activeTab === "evidence") {
      fetchEvidence(selectedCase.code, selectedLang);
    }
  }, [selectedCase, activeTab, selectedLang, fetchTasks, fetchEvidence]);

  const selectCase = (caseItem: CaseData) => {
    setSelectedCase(caseItem);
    setEditingInfo(false);
    setEditingTask(null);
    setEditingEvidence(null);
    setEditFormData(null);
    setTasks([]);
    setEvidence([]);
  };

  // Case Info handlers
  const startEditInfo = () => {
    const content = selectedLang === "en" ? selectedCase?.en : selectedCase?.no;
    if (content) {
      setEditFormData({ ...content });
      setEditingInfo(true);
    }
  };

  const handleSaveInfo = async () => {
    if (!selectedCase || !editFormData) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/case-content?auth=${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseCode: selectedCase.code,
          lang: selectedLang,
          content: editFormData,
        }),
      });

      if (res.ok) {
        await fetchCases();
        setEditingInfo(false);
        setEditFormData(null);
        // Update selected case
        const updated = cases.find(c => c.code === selectedCase.code);
        if (updated) setSelectedCase(updated);
      } else {
        alert("Failed to save case info");
      }
    } catch {
      alert("Failed to save case info");
    } finally {
      setSaving(false);
    }
  };

  // Task handlers
  const startEditTask = (task: Task) => {
    setEditingTask({ ...task });
  };

  const handleSaveTask = async () => {
    if (!selectedCase || !editingTask) return;
    
    setSaving(true);
    try {
      const updatedTasks = tasks.map(t => 
        t.id === editingTask.id ? editingTask : t
      );
      
      const res = await fetch(`/api/admin/case-content/tasks?auth=${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseCode: selectedCase.code,
          lang: selectedLang,
          tasks: updatedTasks,
        }),
      });

      if (res.ok) {
        setTasks(updatedTasks);
        setEditingTask(null);
      } else {
        alert("Failed to save task");
      }
    } catch {
      alert("Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  // Evidence handlers
  const startEditEvidence = (ev: Evidence) => {
    setEditingEvidence({ ...ev });
  };

  const handleSaveEvidence = async () => {
    if (!selectedCase || !editingEvidence) return;
    
    setSaving(true);
    try {
      const updatedEvidence = evidence.map(e => 
        e.id === editingEvidence.id ? editingEvidence : e
      );
      
      const res = await fetch(`/api/admin/case-content/evidence?auth=${authParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseCode: selectedCase.code,
          lang: selectedLang,
          evidence: updatedEvidence,
        }),
      });

      if (res.ok) {
        setEvidence(updatedEvidence);
        setEditingEvidence(null);
      } else {
        alert("Failed to save evidence");
      }
    } catch {
      alert("Failed to save evidence");
    } finally {
      setSaving(false);
    }
  };

  if (authParam !== "redacted2026") return null;

  return (
    <AdminLayout title="Case Content Management">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                  onClick={() => selectCase(caseItem)}
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

        {/* Case Details */}
        <div className="lg:col-span-3">
          {selectedCase ? (
            <div className="space-y-4">
              {/* Language & Tab Selector */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {(["info", "tasks", "evidence"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setEditingInfo(false);
                        setEditingTask(null);
                        setEditingEvidence(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        activeTab === tab
                          ? "bg-[var(--color-gold)] text-black"
                          : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                      }`}
                    >
                      {tab === "info" && "📝 Case Info"}
                      {tab === "tasks" && "🎯 Tasks"}
                      {tab === "evidence" && "🔍 Evidence"}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2 bg-stone-800 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedLang("en")}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                      selectedLang === "en"
                        ? "bg-blue-600 text-white"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    🇬🇧 EN
                  </button>
                  <button
                    onClick={() => setSelectedLang("no")}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                      selectedLang === "no"
                        ? "bg-red-600 text-white"
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    🇳🇴 NO
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "info" && (
                <CaseInfoTab
                  caseData={selectedCase}
                  lang={selectedLang}
                  editing={editingInfo}
                  formData={editFormData}
                  setFormData={setEditFormData}
                  onStartEdit={startEditInfo}
                  onSave={handleSaveInfo}
                  onCancel={() => {
                    setEditingInfo(false);
                    setEditFormData(null);
                  }}
                  saving={saving}
                />
              )}

              {activeTab === "tasks" && (
                <TasksTab
                  tasks={tasks}
                  loading={tasksLoading}
                  editingTask={editingTask}
                  setEditingTask={setEditingTask}
                  onStartEdit={startEditTask}
                  onSave={handleSaveTask}
                  onCancel={() => setEditingTask(null)}
                  saving={saving}
                />
              )}

              {activeTab === "evidence" && (
                <EvidenceTab
                  evidence={evidence}
                  loading={evidenceLoading}
                  editingEvidence={editingEvidence}
                  setEditingEvidence={setEditingEvidence}
                  onStartEdit={startEditEvidence}
                  onSave={handleSaveEvidence}
                  onCancel={() => setEditingEvidence(null)}
                  saving={saving}
                  tasks={tasks}
                />
              )}
            </div>
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

// Case Info Tab Component
function CaseInfoTab({
  caseData,
  lang,
  editing,
  formData,
  setFormData,
  onStartEdit,
  onSave,
  onCancel,
  saving,
}: {
  caseData: CaseData;
  lang: "en" | "no";
  editing: boolean;
  formData: CaseContent | null;
  setFormData: (data: CaseContent | null) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const content = lang === "en" ? caseData.en : caseData.no;

  if (!content) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-8 text-center text-stone-500">
        No {lang === "en" ? "English" : "Norwegian"} content available
      </div>
    );
  }

  if (editing && formData) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Edit {lang === "en" ? "English" : "Norwegian"} Version
          </h2>
          <span className="text-xs text-stone-400 bg-stone-700 px-2 py-1 rounded">
            {caseData.code}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Date</label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Difficulty (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Duration (min)</label>
              <input
                type="number"
                value={formData.estimatedMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Price (NOK)</label>
              <input
                type="number"
                value={formData.priceNok}
                onChange={(e) => setFormData({ ...formData, priceNok: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Summary (landing page)</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Case Briefing (backstory)</label>
            <textarea
              value={formData.backstory}
              onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none"
            />
          </div>

          {formData.culprit && (
            <div className="border-t border-stone-700 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Culprit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.culprit.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      culprit: { ...formData.culprit!, name: e.target.value },
                    })}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-1">Image Path</label>
                  <input
                    type="text"
                    value={formData.culprit.image}
                    onChange={(e) => setFormData({
                      ...formData,
                      culprit: { ...formData.culprit!, image: e.target.value },
                    })}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[var(--color-gold)] text-black rounded font-semibold hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-stone-600 text-white rounded hover:bg-stone-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preview mode
  return (
    <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          {lang === "en" ? "🇬🇧 English" : "🇳🇴 Norwegian"} Version
        </h3>
        <button
          onClick={onStartEdit}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 transition"
        >
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Title</p>
          <p className="text-xl font-serif text-white">{content.title}</p>
        </div>

        <div className="flex gap-6 text-sm flex-wrap">
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-stone-200">{content.location}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Date</p>
            <p className="text-stone-200">{content.date}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Difficulty</p>
            <p className="text-stone-200">{"⭐".repeat(content.difficulty)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Duration</p>
            <p className="text-stone-200">{content.estimatedMinutes} min</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Price</p>
            <p className="text-stone-200">{content.priceNok} NOK</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Summary</p>
          <p className="text-stone-300 text-sm">{content.summary}</p>
        </div>

        <div className="border-t border-stone-700 pt-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Backstory</p>
          <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">{content.backstory}</p>
        </div>

        {content.culprit && (
          <div className="border-t border-stone-700 pt-4">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Culprit</p>
            <p className="text-stone-200">{content.culprit.name}</p>
          </div>
        )}

        {content.suspects && content.suspects.length > 0 && (
          <div className="border-t border-stone-700 pt-4">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Suspects ({content.suspects.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {content.suspects.map((suspect, i) => (
                <div key={i} className="bg-stone-900/50 rounded p-2 text-sm">
                  <p className="text-white font-medium">{suspect.name}</p>
                  <p className="text-stone-400 text-xs">{suspect.role}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tasks Tab Component
function TasksTab({
  tasks,
  loading,
  editingTask,
  setEditingTask,
  onStartEdit,
  onSave,
  onCancel,
  saving,
}: {
  tasks: Task[];
  loading: boolean;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  onStartEdit: (task: Task) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  if (loading) {
    return <div className="text-center py-8 text-stone-400">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-8 text-center text-stone-500">
        No tasks found for this case
      </div>
    );
  }

  // Edit mode
  if (editingTask) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Edit Task #{editingTask.idx}
          </h2>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${
            editingTask.type === "mcq" ? "bg-blue-600" : "bg-purple-600"
          }`}>
            {editingTask.type === "mcq" ? "Multiple Choice" : "Open Answer"}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Question</label>
            <textarea
              value={editingTask.question}
              onChange={(e) => setEditingTask({ ...editingTask, question: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none"
            />
          </div>

          {editingTask.type === "mcq" && (
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">
                Options (one per line)
              </label>
              <textarea
                value={editingTask.options.join("\n")}
                onChange={(e) => setEditingTask({
                  ...editingTask,
                  options: e.target.value.split("\n").filter(o => o.trim()),
                })}
                rows={3}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none font-mono text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Correct Answer</label>
              <input
                type="text"
                value={editingTask.answer}
                onChange={(e) => setEditingTask({ ...editingTask, answer: e.target.value })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Hint</label>
              <input
                type="text"
                value={editingTask.hint}
                onChange={(e) => setEditingTask({ ...editingTask, hint: e.target.value })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Revelation Text</label>
            <textarea
              value={editingTask.revelation}
              onChange={(e) => setEditingTask({ ...editingTask, revelation: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editingTask.is_final}
                onChange={(e) => setEditingTask({ ...editingTask, is_final: e.target.checked })}
                className="w-4 h-4 rounded bg-stone-700 border-stone-600"
              />
              <span className="text-sm text-stone-300">Final task (ends the game)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[var(--color-gold)] text-black rounded font-semibold hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Task"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-stone-600 text-white rounded hover:bg-stone-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-stone-800 border border-stone-700 rounded-lg p-4 hover:border-stone-600 transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 flex items-center justify-center bg-stone-700 rounded-full text-sm font-bold">
                  {task.idx}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  task.type === "mcq" ? "bg-blue-600/20 text-blue-400" : "bg-purple-600/20 text-purple-400"
                }`}>
                  {task.type === "mcq" ? "MCQ" : "Open"}
                </span>
                {task.is_final && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-600/20 text-red-400">
                    Final
                  </span>
                )}
              </div>
              <p className="text-white font-medium mb-2">{task.question}</p>
              <div className="text-sm text-stone-400">
                <span className="text-green-400">Answer:</span> {task.answer}
              </div>
              {task.type === "mcq" && (
                <div className="text-xs text-stone-500 mt-1">
                  Options: {task.options.join(" | ")}
                </div>
              )}
            </div>
            <button
              onClick={() => onStartEdit(task)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 transition"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Evidence Tab Component
function EvidenceTab({
  evidence,
  loading,
  editingEvidence,
  setEditingEvidence,
  onStartEdit,
  onSave,
  onCancel,
  saving,
  tasks,
}: {
  evidence: Evidence[];
  loading: boolean;
  editingEvidence: Evidence | null;
  setEditingEvidence: (ev: Evidence | null) => void;
  onStartEdit: (ev: Evidence) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  tasks: Task[];
}) {
  const typeIcons: Record<string, string> = {
    document: "📄",
    image: "🖼️",
    audio: "🔊",
    video: "🎬",
  };

  if (loading) {
    return <div className="text-center py-8 text-stone-400">Loading evidence...</div>;
  }

  if (evidence.length === 0) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-8 text-center text-stone-500">
        No evidence found for this case
      </div>
    );
  }

  // Edit mode
  if (editingEvidence) {
    return (
      <div className="bg-stone-800 border border-stone-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            Edit Evidence: {editingEvidence.title}
          </h2>
          <span className="text-2xl">{typeIcons[editingEvidence.type]}</span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Title</label>
              <input
                type="text"
                value={editingEvidence.title}
                onChange={(e) => setEditingEvidence({ ...editingEvidence, title: e.target.value })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Type</label>
              <select
                value={editingEvidence.type}
                onChange={(e) => setEditingEvidence({
                  ...editingEvidence,
                  type: e.target.value as Evidence["type"],
                })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              >
                <option value="document">Document</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">Description</label>
            <textarea
              value={editingEvidence.description}
              onChange={(e) => setEditingEvidence({ ...editingEvidence, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Storage Path</label>
              <input
                type="text"
                value={editingEvidence.storage_path}
                onChange={(e) => setEditingEvidence({ ...editingEvidence, storage_path: e.target.value })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Unlocked After Task</label>
              <select
                value={editingEvidence.unlocked_on_task_idx}
                onChange={(e) => setEditingEvidence({
                  ...editingEvidence,
                  unlocked_on_task_idx: parseInt(e.target.value),
                })}
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white"
              >
                <option value="0">Available from start</option>
                {tasks.map((task) => (
                  <option key={task.idx} value={task.idx}>
                    After Task #{task.idx}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-stone-300">Transcript</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingEvidence.has_transcript}
                  onChange={(e) => setEditingEvidence({
                    ...editingEvidence,
                    has_transcript: e.target.checked,
                  })}
                  className="w-4 h-4 rounded bg-stone-700 border-stone-600"
                />
                <span className="text-xs text-stone-400">Has transcript</span>
              </label>
            </div>
            <textarea
              value={editingEvidence.transcript}
              onChange={(e) => setEditingEvidence({ ...editingEvidence, transcript: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded text-white resize-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[var(--color-gold)] text-black rounded font-semibold hover:bg-[var(--color-gold)]/90 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Evidence"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-stone-600 text-white rounded hover:bg-stone-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="space-y-3">
      {evidence.map((ev) => (
        <div
          key={ev.id}
          className="bg-stone-800 border border-stone-700 rounded-lg p-4 hover:border-stone-600 transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{typeIcons[ev.type]}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{ev.title}</p>
                <p className="text-sm text-stone-400 mt-1">{ev.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                  <span>Unlocks: {ev.unlocked_on_task_idx === 0 ? "Start" : `Task #${ev.unlocked_on_task_idx}`}</span>
                  {ev.has_transcript && <span className="text-green-400">Has transcript</span>}
                </div>
              </div>
            </div>
            <button
              onClick={() => onStartEdit(ev)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-500 transition"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-400">Loading...</div>}>
      <CasesContent />
    </Suspense>
  );
}
