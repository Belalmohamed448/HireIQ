"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [roleCount, setRoleCount] = useState(0);
    const [candidateCount, setCandidateCount] = useState(0);
    const [evaluationCount, setEvaluationCount] = useState(0);

   const [averageScore, setAverageScore] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/login");
                    return;
                }

                const { count: rCount, error: rError } = await supabase
                    .from("roles")
                    .select("*", { count: "exact", head: true });

                if (rError) throw rError;
                if (rCount !== null) setRoleCount(rCount);

                const { count: cCount, error: cError } = await supabase
                    .from("candidates")
                    .select("*", { count: "exact", head: true });

                if (cError) throw cError;
                if (cCount !== null) setCandidateCount(cCount);

                const { data: evalRows, error: eError } = await supabase
                    .from("evaluations")
                    .select("candidate_id, score");

                if (eError) throw eError;

                if (evalRows) {
                    const uniqueCandidates = new Set(evalRows.map((e) => e.candidate_id));
                    setEvaluationCount(uniqueCandidates.size);

                    const totalScore = evalRows.reduce(
                        (sum, row) => sum + (row.score ?? 0),
                        0
                    );

                    const average =
                        evalRows.length > 0
                            ? Math.round(totalScore / evalRows.length)
                            : 0;

                    setAverageScore(average);
                }
            } catch (err) {
                console.error("Dashboard load error:", err);
                setError("We couldn't load your dashboard data. Please try refreshing the page.");
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [router]);

 if (loading) {
        return (
            <DashboardLayout>
                <LoadingSpinner text="Loading dashboard..." />
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mt-8">
                    <p className="font-semibold">Something went wrong</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 text-sm font-medium text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            </DashboardLayout>
        );
    }
    return (
        <DashboardLayout>
            <section>
                <h2 className="text-3xl font-bold text-gray-800">
                    Dashboard Overview
                </h2>
<p className="mt-2 text-gray-600">
                    Welcome to HireIQ! This dashboard will help you manage job roles,
                    candidates, and AI-powered evaluations.
                </p>

                {roleCount === 0 && candidateCount === 0 && evaluationCount === 0 && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-6 mt-6">
                        <p className="font-semibold">Let&apos;s get started 🚀</p>
                        <p className="text-sm mt-1">
                            You haven&apos;t created any roles or candidates yet. Create your first
                            job role to begin evaluating candidates with AI.
                        </p>
                        <button
                            onClick={() => router.push("/roles")}
                            className="mt-4 text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Create your first role
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Total Roles
                                </p>

                                <h2 className="text-4xl font-bold text-blue-600 mt-2">
                                    {roleCount}
                                </h2>

                                <p className="text-sm text-gray-400 mt-2">
                                    Job positions created
                                </p>
                            </div>

                            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-3xl">
                                💼
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Candidates
                                </p>

                                <h2 className="text-4xl font-bold text-green-600 mt-2">
                                    {candidateCount}
                                </h2>

                                <p className="text-sm text-gray-400 mt-2">
                                    CVs uploaded
                                </p>
                            </div>

                            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-3xl">
                                👤
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    AI Evaluations
                                </p>

                              <h2 className="text-4xl font-bold text-purple-600 mt-2">
                                    {evaluationCount}
                                </h2>

                                <p className="text-sm text-gray-400 mt-2">
                                    Candidates evaluated
                                </p>
                            </div>

                            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-3xl">
                                🤖
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Average AI Score
                                </p>

                                <h2 className="text-4xl font-bold text-orange-600 mt-2">
                                    {averageScore}
                                </h2>

                                <p className="text-sm text-gray-400 mt-2">
                                    Across all evaluations
                                </p>
                            </div>

                            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center text-3xl">
                                ⭐
                            </div>
                        </div>
                    </Card>

                </div>
                <div className="mt-10">
                    <h3 className="text-xl font-semibold text-gray-800 mb-5">
                        Quick Actions
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <button
                            onClick={() => router.push("/roles")}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition text-left"
                        >
                            <div className="text-3xl mb-3">💼</div>

                            <h4 className="font-semibold text-gray-900">
                                Create Role
                            </h4>

                            <p className="text-sm text-gray-500 mt-1">
                                Add a new job position.
                            </p>
                        </button>

<button
                            onClick={() => router.push("/candidates")}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition text-left"
                        >
                            <div className="text-3xl mb-3">👤</div>

                            <h4 className="font-semibold text-gray-900">
                                Add Candidate
                            </h4>

                            <p className="text-sm text-gray-500 mt-1">
                                Upload a new resume.
                            </p>
                        </button>

                        <button
                            onClick={() => router.push("/candidates/list")}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition text-left"
                        >
                            <div className="text-3xl mb-3">🗂️</div>

                            <h4 className="font-semibold text-gray-900">
                                View Candidates
                            </h4>

                            <p className="text-sm text-gray-500 mt-1">
                                Manage all candidates.
                            </p>
                        </button>

                        <button
                            onClick={() => router.push("/roles/list")}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition text-left"
                        >
                            <div className="text-3xl mb-3">📋</div>

                            <h4 className="font-semibold text-gray-900">
                                View Roles
                            </h4>

                            <p className="text-sm text-gray-500 mt-1">
                                Manage all job roles.
                            </p>
                        </button>

                    </div>
                </div>
            </section>
        </DashboardLayout>
    );
}