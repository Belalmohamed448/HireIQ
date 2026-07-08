"use client";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { evaluateCandidate as runEvaluation } from "@/lib/evaluateCandidate";


type Candidate = {
    id: string;
    name: string;
    email: string;
    cv_text: string;
    role_id: string | null;
    created_at: string;
    roles: { title: string } | null;
};

type Evaluation = {
    score: number;
    summary: string;
    matchedSkills: string[];
    missingSkills: string[];
    interviewFocusAreas: string[];
    recommendation: string;
};

type RoleOption = {
    id: string;
    title: string;
};

const PAGE_SIZE = 10;

export default function CandidatesListPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRoleId, setEditRoleId] = useState<string>("");
    const [savingEdit, setSavingEdit] = useState(false);

    const [evaluations, setEvaluations] = useState<{ [id: string]: Evaluation }>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectMode, setSelectMode] = useState(false);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [recommendationFilter, setRecommendationFilter] = useState("all");
    const [loadError, setLoadError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        fetchCandidates();
        fetchRoles();
        fetchLatestEvaluations();
    }, []);

    async function logActivity(
        action: string,
        entityType: string,
        entityName: string,
        details?: string
    ) {
        const { error } = await supabase.from("activity_log").insert({
            action,
            entity_type: entityType,
            entity_name: entityName,
            details: details ?? null,
        });

        if (error) {
            // Logging failures shouldn't block the actual action, just note it.
            console.error("LOG ERROR:", error);
        }
    }

  async function fetchCandidates() {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
            .from("candidates")
            .select("id, name, email, role_id, cv_text, created_at, roles(title)")
            .order("created_at", { ascending: false })
            .range(0, PAGE_SIZE - 1);

        if (error) {
            console.error("FETCH CANDIDATES ERROR:", error);
            setLoadError("We couldn't load your candidates. Please try again.");
            setLoading(false);
            return;
        }

        if (data) {
            setCandidates(data as unknown as Candidate[]);
            setHasMore(data.length === PAGE_SIZE);
        }
        setLoading(false);
    }

    async function loadMoreCandidates() {
        setLoadingMore(true);

        const { data, error } = await supabase
            .from("candidates")
            .select("id, name, email, role_id, cv_text, created_at, roles(title)")
            .order("created_at", { ascending: false })
            .range(candidates.length, candidates.length + PAGE_SIZE - 1);

        if (error) {
            console.error("LOAD MORE CANDIDATES ERROR:", error);
            showToast("Failed to load more candidates.", "error");
            setLoadingMore(false);
            return;
        }

        if (data) {
            setCandidates((prev) => [...prev, ...(data as unknown as Candidate[])]);
            setHasMore(data.length === PAGE_SIZE);
        }
        setLoadingMore(false);
    }
    async function fetchRoles() {
        const { data, error } = await supabase
            .from("roles")
            .select("id, title")
            .order("title", { ascending: true });

        if (!error && data) setRoles(data as RoleOption[]);
    }

    async function fetchLatestEvaluations() {
        const { data, error } = await supabase
            .from("evaluations")
            .select(
                "candidate_id, score, summary, matched_skills, missing_skills, interview_focus_areas, recommendation, created_at"
            )
            .order("created_at", { ascending: false });

        if (error || !data) {
            console.error("FETCH EVALUATIONS ERROR:", error);
            return;
        }

        const latestByCandidate: { [id: string]: Evaluation } = {};
        for (const row of data) {
            if (!latestByCandidate[row.candidate_id]) {
                latestByCandidate[row.candidate_id] = {
                    score: row.score,
                    summary: row.summary,
                    matchedSkills: row.matched_skills ?? [],
                    missingSkills: row.missing_skills ?? [],
                    interviewFocusAreas: row.interview_focus_areas ?? [],
                    recommendation: row.recommendation,
                };
            }
        }

        setEvaluations(latestByCandidate);
    }

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }
    function toggleSelectMode() {
        setSelectMode((prev) => {
            if (prev) setSelectedIds(new Set());
            return !prev;
        });
    }

    async function handleDelete(id: string) {
        const candidate = candidates.find((c) => c.id === id);
        setDeletingId(id);
        const { error } = await supabase.from("candidates").delete().eq("id", id);
        if (!error) {
            setCandidates((prev) => prev.filter((c) => c.id !== id));
            if (candidate) {
                await logActivity("deleted", "candidate", candidate.name);
            }
        }
        setDeletingId(null);
    }

    function startEditing(c: Candidate) {
        setEditingId(c.id);
        setEditName(c.name);
        setEditEmail(c.email);
        setEditRoleId(c.role_id ?? "");
        setExpandedId(null);
    }

    function cancelEditing() {
        setEditingId(null);
    }

   async function saveEdit(id: string) {
        if (!editName.trim() || !editEmail.trim()) {
            showToast("Name and email can't be empty.", "error");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        setSavingEdit(true);

        const { error } = await supabase
            .from("candidates")
            .update({
                name: editName.trim(),
                email: editEmail.trim(),
                role_id: editRoleId || null,
            })
            .eq("id", id)
            .select();

        setSavingEdit(false);

        

        if (error) {
            console.error("EDIT ERROR:", error);
            showToast("Failed to save changes.", "error");
            return;
        }

        await logActivity("edited", "candidate", editName.trim());

        setEditingId(null);
        fetchCandidates();
    }

   async function evaluateCandidate(candidate: Candidate) {
        setEvaluatingId(candidate.id);

        const outcome = await runEvaluation({
            candidateId: candidate.id,
            candidateName: candidate.name,
            cvText: candidate.cv_text,
            roleId: candidate.role_id,
        });

        if (!outcome.success) {
            showToast(outcome.error, "error");
            setEvaluatingId(null);
            return;
        }

        setEvaluations((prev) => ({
            ...prev,
            [candidate.id]: outcome.result,
        }));

        showToast(`Evaluation complete: ${outcome.result.score}/100`, "success");
        setExpandedId(candidate.id);
        setEvaluatingId(null);

        setTimeout(() => {
            document
                .getElementById(`evaluation-${candidate.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4 transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back to dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">All candidates</h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} on record.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={toggleSelectMode}
                        className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap ${selectMode
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        {selectMode ? "Cancel" : "Select"}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/candidates")}
                        className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add candidate
                    </button>
                </div>
                {loading && <LoadingSpinner text="Loading candidates..." />}

                {!loading && loadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center mb-5">
                        <p className="text-sm">{loadError}</p>
                        <button
                            onClick={fetchCandidates}
                            className="mt-3 text-sm font-medium underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !loadError && candidates.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                        <p className="text-gray-500 text-sm mb-4">No candidates yet. Add your first one to get started.</p>
                        <button
                            type="button"
                            onClick={() => router.push("/candidates")}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Add a candidate →
                        </button>
                    </div>
                )}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <input
                            type="text"
                            placeholder="Search candidate..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm"
                        />

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="all">All Roles</option>

                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.title}
                                </option>
                            ))}
                        </select>

                        <select
                            value={recommendationFilter}
                            onChange={(e) => setRecommendationFilter(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="all">All Recommendations</option>
                            <option value="Strongly Recommended">
                                Strongly Recommended
                            </option>
                            <option value="Recommended">
                                Recommended
                            </option>
                            <option value="Consider for Interview">
                                Consider for Interview
                            </option>
                            <option value="Not Recommended">
                                Not Recommended
                            </option>
                        </select>

                    </div>
                </div>

                <div className="space-y-3">
                    {candidates
                        .filter((c) => {
                            const matchesSearch =
                                c.name.toLowerCase().includes(search.toLowerCase()) ||
                                c.email.toLowerCase().includes(search.toLowerCase());

                            const matchesRole =
                                roleFilter === "all" || c.role_id === roleFilter;

                            const matchesRecommendation =
                                recommendationFilter === "all" ||
                                evaluations[c.id]?.recommendation === recommendationFilter;

                            return (
                                matchesSearch &&
                                matchesRole &&
                                matchesRecommendation
                            );
                        })
                        .map((c) => (
                            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                {editingId === c.id ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                                            <select
                                                value={editRoleId}
                                                onChange={(e) => setEditRoleId(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">No role assigned</option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => saveEdit(c.id)}
                                                disabled={savingEdit}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                                            >
                                                {savingEdit ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                disabled={savingEdit}
                                                className="text-gray-600 hover:text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                {selectMode && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(c.id)}
                                                        onChange={() => toggleSelect(c.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                )}
                                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                                                    <p className="text-sm text-gray-500">{c.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                                                >
                                                    {expandedId === c.id ? "Hide CV" : "View CV"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(c)}
                                                    className="text-xs font-medium text-gray-600 hover:text-gray-800 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => evaluateCandidate(c)}
                                                    disabled={evaluatingId === c.id}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                                                >
                                                    {evaluatingId === c.id ? "🤖 Evaluating..." : "🤖 Evaluate AI"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(c.id)}
                                                    disabled={deletingId === c.id}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                                >
                                                    {deletingId === c.id ? (
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                        </svg>
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {c.roles?.title && (
                                            <div className="mt-2.5 ml-12">
                                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                                    {c.roles.title}
                                                </span>
                                            </div>
                                        )}

                                        {expandedId === c.id && (
                                            <div className="mt-4 ml-12 space-y-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                                                        CV / Resume
                                                    </p>

                                                    <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                                        {c.cv_text}
                                                    </div>
                                                </div>

                                                {evaluations[c.id] && (
                                                    <div id={`evaluation-${c.id}`} className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                                                        <h3 className="font-semibold text-indigo-900 mb-3">
                                                            🤖 AI Evaluation
                                                        </h3>

                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-2xl font-bold text-indigo-900">
                                                                {evaluations[c.id].score}
                                                                <span className="text-sm font-normal text-indigo-600">/100</span>
                                                            </span>
                                                            <span
                                                                className={`text-xs font-medium px-2.5 py-1 rounded-full border
    ${evaluations[c.id].score >= 85
                                                                        ? "bg-green-100 text-green-700 border-green-300"
                                                                        : evaluations[c.id].score >= 70
                                                                            ? "bg-blue-100 text-blue-700 border-blue-300"
                                                                            : evaluations[c.id].score >= 50
                                                                                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                                                                : "bg-red-100 text-red-700 border-red-300"
                                                                    }`}
                                                            >
                                                                {
                                                                    evaluations[c.id].score >= 85
                                                                        ? "✔ Strongly Recommended"
                                                                        : evaluations[c.id].score >= 70
                                                                            ? "👍 Recommended"
                                                                            : evaluations[c.id].score >= 50
                                                                                ? "⚠ Consider for Interview"
                                                                                : "✖ Not Recommended"
                                                                }
                                                            </span>
                                                        </div>

                                                        <p className="text-sm text-gray-700 mb-4">
                                                            {evaluations[c.id].summary}
                                                        </p>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                                    Matched skills
                                                                </p>
                                                                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-0.5">
                                                                    {evaluations[c.id].matchedSkills.map((item: string) => (
                                                                        <li key={item}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                                    Missing skills
                                                                </p>
                                                                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-0.5">
                                                                    {evaluations[c.id].missingSkills.map((item: string) => (
                                                                        <li key={item}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        {evaluations[c.id].interviewFocusAreas?.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-indigo-200">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                                    Interview focus areas
                                                                </p>
                                                                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-0.5">
                                                                    {evaluations[c.id].interviewFocusAreas.map((item: string) => (
                                                                        <li key={item}>{item}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                     ))}
                </div>

                {!loading && !loadError && hasMore && (
                    <div className="flex justify-center mt-6">
                        <button
                            type="button"
                            onClick={loadMoreCandidates}
                            disabled={loadingMore}
                            className="text-sm font-medium bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? "Loading..." : "Load more candidates"}
                        </button>
                    </div>
                )}
            </div>

            {selectMode && (
                <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white px-6 py-4 shadow-lg flex items-center justify-between z-50">
                    <span className="text-sm">
                        {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""} selected
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedIds(new Set())}
                            className="text-sm text-gray-300 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            disabled={selectedIds.size < 2}
                            onClick={() =>
                                router.push(`/candidates/compare?ids=${Array.from(selectedIds).join(",")}`)
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            Compare ({selectedIds.size})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}