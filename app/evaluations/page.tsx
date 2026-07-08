"use client";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { evaluateCandidate as runEvaluation } from "@/lib/evaluateCandidate";
const PAGE_SIZE = 10;

type EvaluationRow = {
    id: string;
    score: number;
    summary: string;
    matched_skills: string[];
    missing_skills: string[];
    interview_focus_areas: string[] | null;
    recommendation: string;
    created_at: string;
    role_id: string | null;
    candidates: { id: string; name: string; email: string; cv_text: string } | null;
    roles: { title: string; description: string } | null;
};

export default function EvaluationsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
   const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
    const [reevaluatingId, setReevaluatingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [recommendationFilter, setRecommendationFilter] = useState("all");

    useEffect(() => {
        fetchEvaluations();
    }, []);

   
async function fetchEvaluations() {
        setLoading(true);
        setLoadError(null);

       const { data, error } = await supabase
            .from("evaluations")
            .select(
                "id, score, summary, matched_skills, missing_skills, interview_focus_areas, recommendation, created_at, role_id, candidates(id, name, email, cv_text), roles(title, description)"
            )
            .order("created_at", { ascending: false })
            .range(0, PAGE_SIZE - 1);

        if (error) {
            console.error("FETCH EVALUATIONS ERROR:", error);
            setLoadError("We couldn't load your evaluations. Please try again.");
            setLoading(false);
            return;
        }

        if (data) {
            setEvaluations(data as unknown as EvaluationRow[]);
            setHasMore(data.length === PAGE_SIZE);
        }
        setLoading(false);
    }

    async function loadMoreEvaluations() {
        setLoadingMore(true);

        const { data, error } = await supabase
            .from("evaluations")
            .select(
                "id, score, summary, matched_skills, missing_skills, interview_focus_areas, recommendation, created_at, role_id, candidates(id, name, email, cv_text), roles(title, description)"
            )
            .order("created_at", { ascending: false })
            .range(evaluations.length, evaluations.length + PAGE_SIZE - 1);

        if (error) {
            console.error("LOAD MORE EVALUATIONS ERROR:", error);
            showToast("Failed to load more evaluations.", "error");
            setLoadingMore(false);
            return;
        }

        if (data) {
            setEvaluations((prev) => [...prev, ...(data as unknown as EvaluationRow[])]);
            setHasMore(data.length === PAGE_SIZE);
        }
        setLoadingMore(false);
    }
    async function handleDelete(id: string) {
        const confirmed = window.confirm("Delete this evaluation? This can't be undone.");
        if (!confirmed) return;

        setDeletingId(id);
        const { error } = await supabase.from("evaluations").delete().eq("id", id);

       if (!error) {
            setEvaluations((prev) => prev.filter((ev) => ev.id !== id));
            if (expandedId === id) setExpandedId(null);
            showToast("Evaluation deleted.", "success");
        } else {
            console.error("DELETE ERROR:", error);
            showToast("Failed to delete evaluation.", "error");
        }

        setDeletingId(null);
    }

async function handleReevaluate(ev: EvaluationRow) {
        if (!ev.candidates) {
            showToast("Missing candidate data for re-evaluation.", "error");
            return;
        }

        setReevaluatingId(ev.id);

        const { data: liveCandidate, error: candidateError } = await supabase
            .from("candidates")
            .select("cv_text, role_id")
            .eq("id", ev.candidates.id)
            .single();

        if (candidateError || !liveCandidate) {
            showToast("Missing candidate or role data for re-evaluation.", "error");
            setReevaluatingId(null);
            return;
        }

        const outcome = await runEvaluation({
            candidateId: ev.candidates.id,
            candidateName: ev.candidates.name,
            cvText: liveCandidate.cv_text,
            roleId: liveCandidate.role_id,
            reevaluation: true,
        });

        if (!outcome.success) {
            showToast(outcome.error, "error");
            setReevaluatingId(null);
            return;
        }

        showToast(`Re-evaluation complete: ${outcome.result.score}/100`, "success");
        fetchEvaluations();
        setReevaluatingId(null);
    }

   function recommendationColor(rec: string) {
        if (rec === "Strongly Recommended") return "bg-green-50 text-green-700 border-green-200";
        if (rec === "Recommended") return "bg-blue-50 text-blue-700 border-blue-200";
        if (rec === "Consider for Interview") return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-red-50 text-red-700 border-red-200";
    }

    const roleTitles = Array.from(
        new Set(evaluations.map((ev) => ev.roles?.title).filter(Boolean))
    ) as string[];

    const filteredEvaluations = evaluations.filter((ev) => {
        const matchesSearch =
            (ev.candidates?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (ev.candidates?.email ?? "").toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === "all" || ev.roles?.title === roleFilter;

        const matchesRecommendation =
            recommendationFilter === "all" || ev.recommendation === recommendationFilter;

        return matchesSearch && matchesRole && matchesRecommendation;
    });
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
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
                    <h1 className="text-2xl font-bold text-gray-900">All evaluations</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""} on record.
                    </p>
                </div>

               {loading && <LoadingSpinner text="Loading evaluations..." />}

                {!loading && loadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
                        <p className="text-sm">{loadError}</p>
                        <button
                            onClick={fetchEvaluations}
                            className="mt-3 text-sm font-medium underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !loadError && evaluations.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                        <p className="text-gray-500 text-sm mb-4">
                            No evaluations yet. Evaluate a candidate to see results here.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push("/candidates/list")}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Go to candidates →
                        </button>
                    </div>
                )}

               {!loading && !loadError && evaluations.length > 0 && (
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
                                {roleTitles.map((title) => (
                                    <option key={title} value={title}>
                                        {title}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={recommendationFilter}
                                onChange={(e) => setRecommendationFilter(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="all">All Recommendations</option>
                                <option value="Strongly Recommended">Strongly Recommended</option>
                                <option value="Recommended">Recommended</option>
                                <option value="Consider for Interview">Consider for Interview</option>
                                <option value="Not Recommended">Not Recommended</option>
                            </select>
                        </div>
                    </div>
                )}

                {!loading && !loadError && evaluations.length > 0 && filteredEvaluations.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                        <p className="text-gray-500 text-sm">No evaluations match your filters.</p>
                    </div>
                )}

                {!loading && !loadError && (
                <div className="space-y-3">
                    {filteredEvaluations.map((ev) => (
                        <div key={ev.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                        {(ev.candidates?.name ?? "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {ev.candidates?.name ?? "Unknown candidate"}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {ev.roles?.title ?? "No role"} ·{" "}
                                            {new Date(ev.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-indigo-900">
                                        {ev.score}
                                        <span className="text-xs font-normal text-indigo-500">/100</span>
                                    </span>
                                    <span
                                        className={`text-xs font-medium border px-2.5 py-1 rounded-full ${recommendationColor(
                                            ev.recommendation
                                        )}`}
                                    >
                                        {ev.recommendation}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        {expandedId === ev.id ? "Hide" : "Details"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleReevaluate(ev)}
                                        disabled={reevaluatingId === ev.id}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                                    >
                                        {reevaluatingId === ev.id ? "🤖 Re-evaluating..." : "🤖 Re-evaluate"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(ev.id)}
                                        disabled={deletingId === ev.id}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                    >
                                        {deletingId === ev.id ? (
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

                            {expandedId === ev.id && (
                                <div className="mt-4 ml-12 space-y-4">
                                    <p className="text-sm text-gray-700">{ev.summary}</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Matched skills
                                            </p>
                                            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-0.5">
                                                {(ev.matched_skills ?? []).map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Missing skills
                                            </p>
                                            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-0.5">
                                                {(ev.missing_skills ?? []).map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {ev.interview_focus_areas && ev.interview_focus_areas.length > 0 && (
                                        <div className="pt-3 border-t border-gray-200">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Interview focus areas
                                            </p>
                                            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-0.5">
                                                {ev.interview_focus_areas.map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
              ))}
                </div>
                )}

                {!loading && !loadError && hasMore && (
                    <div className="flex justify-center mt-6">
                        <button
                            type="button"
                            onClick={loadMoreEvaluations}
                            disabled={loadingMore}
                            className="text-sm font-medium bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {loadingMore ? "Loading..." : "Load more evaluations"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}