"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/ui/LoadingSpinner";



type CompareCandidate = {
    id: string;
    name: string;
    email: string;
    roleTitle: string | null;
    score: number | null;
    recommendation: string | null;
    summary: string | null;
    matchedSkills: string[];
    missingSkills: string[];
};

function ComparePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

   const [candidates, setCandidates] = useState<CompareCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (ids.length > 0) {
            fetchComparisonData();
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchComparisonData() {
        setLoading(true);
        setLoadError(null);

        const { data: candidateRows, error: candidateError } = await supabase
            .from("candidates")
            .select("id, name, email, roles(title)")
            .in("id", ids);

        if (candidateError || !candidateRows) {
            console.error("FETCH COMPARISON ERROR:", candidateError);
            setLoadError("We couldn't load the comparison data. Please try again.");
            setLoading(false);
            return;
        }

        const { data: evalRows } = await supabase
            .from("evaluations")
            .select(
                "candidate_id, score, recommendation, summary, matched_skills, missing_skills, created_at"
            )
            .in("candidate_id", ids)
            .order("created_at", { ascending: false });

        // Keep only the latest evaluation per candidate.
        const latestEval: { [id: string]: any } = {};
        (evalRows ?? []).forEach((row) => {
            if (!latestEval[row.candidate_id]) latestEval[row.candidate_id] = row;
        });

        const merged: CompareCandidate[] = candidateRows.map((c: any) => {
            const ev = latestEval[c.id];
            return {
                id: c.id,
                name: c.name,
                email: c.email,
                roleTitle: c.roles?.title ?? null,
                score: ev?.score ?? null,
                recommendation: ev?.recommendation ?? null,
                summary: ev?.summary ?? null,
                matchedSkills: ev?.matched_skills ?? [],
                missingSkills: ev?.missing_skills ?? [],
            };
        });

        // Preserve the order candidates were selected in, and rank by score.
        merged.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

        setCandidates(merged);
        setLoading(false);
    }

    function recommendationColor(rec: string | null) {
        if (rec === "Strongly Recommended") return "bg-green-50 text-green-700 border-green-200";
        if (rec === "Recommended") return "bg-blue-50 text-blue-700 border-blue-200";
        if (rec === "Consider for Interview") return "bg-amber-50 text-amber-700 border-amber-200";
        if (rec === "Not Recommended") return "bg-red-50 text-red-700 border-red-200";
        return "bg-gray-50 text-gray-500 border-gray-200";
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => router.push("/candidates/list")}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4 transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back to candidates
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Compare candidates</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}, ranked by score.
                    </p>
                </div>

              {loading && <LoadingSpinner text="Loading comparison..." />}

                {!loading && loadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
                        <p className="text-sm">{loadError}</p>
                        <button
                            onClick={fetchComparisonData}
                            className="mt-3 text-sm font-medium underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !loadError && candidates.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                        <p className="text-gray-500 text-sm">No candidates selected to compare.</p>
                    </div>
                )}

              {!loading && !loadError && candidates.length > 0 && (
                    <div className="overflow-x-auto">
                    <div
                        className="grid gap-4"
                        style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(260px, 1fr))` }}
                    >
                        {candidates.map((c) => (
                            <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{c.roleTitle ?? "No role"}</p>
                                    </div>
                                </div>

                                {c.score === null ? (
                                    <div className="text-sm text-gray-400 italic py-4 text-center border border-dashed border-gray-200 rounded-lg">
                                        Not evaluated yet
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl font-bold text-indigo-900">
                                                {c.score}
                                                <span className="text-xs font-normal text-indigo-500">/100</span>
                                            </span>
                                        </div>

                                        <span
                                            className={`inline-block text-xs font-medium border px-2.5 py-1 rounded-full mb-3 ${recommendationColor(
                                                c.recommendation
                                            )}`}
                                        >
                                            {c.recommendation}
                                        </span>

                                        {c.summary && (
                                            <p className="text-xs text-gray-600 mb-4">{c.summary}</p>
                                        )}

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Strengths
                                                </p>
                                                {c.matchedSkills.length > 0 ? (
                                                    <ul className="list-disc ml-4 text-xs text-gray-700 space-y-0.5">
                                                        {c.matchedSkills.map((s) => (
                                                            <li key={s}>{s}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-400">None</p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Gaps
                                                </p>
                                                {c.missingSkills.length > 0 ? (
                                                    <ul className="list-disc ml-4 text-xs text-gray-700 space-y-0.5">
                                                        {c.missingSkills.map((s) => (
                                                            <li key={s}>{s}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-400">None</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                    ))}
                    </div>
                    </div>
                )}
            </div>
        </div>
    );
}
export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading comparison..." />}>
      <ComparePageContent />
    </Suspense>
  );
}