"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ActivityRow = {
    id: string;
    action: string;
    entity_type: string;
    entity_name: string | null;
    details: string | null;
    created_at: string;
};

export default function HistoryPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const [createdCount, setCreatedCount] = useState(0);
    const [editedCount, setEditedCount] = useState(0);
    const [deletedCount, setDeletedCount] = useState(0);
    const [evaluatedCount, setEvaluatedCount] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        setLoading(true);
        const { data, error } = await supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);

        if (!error && data) {
            const rows = data as ActivityRow[];

            setLogs(rows);

            setCreatedCount(rows.filter((log) => log.action === "created").length);
            setEditedCount(rows.filter((log) => log.action === "edited").length);
            setDeletedCount(rows.filter((log) => log.action === "deleted").length);
            setEvaluatedCount(rows.filter((log) => log.action === "evaluated").length);
        }
        setLoading(false);
    }

    function actionColor(action: string) {
        if (action === "deleted") return "bg-red-50 text-red-700 border-red-200";
        if (action === "edited") return "bg-amber-50 text-amber-700 border-amber-200";
        if (action === "evaluated") return "bg-indigo-50 text-indigo-700 border-indigo-200";
        if (action === "created") return "bg-green-50 text-green-700 border-green-200";
        return "bg-gray-50 text-gray-700 border-gray-200";
    }

    function actionIcon(action: string) {
        if (action === "deleted") return "🗑️";
        if (action === "edited") return "✏️";
        if (action === "evaluated") return "🤖";
        if (action === "created") return "➕";
        return "•";
    }
    function timeAgo(date: string) {
    const seconds = Math.floor(
        (Date.now() - new Date(date).getTime()) / 1000
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7)
        return `${days} day${days > 1 ? "s" : ""} ago`;

    return new Date(date).toLocaleDateString();
}

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
                    <h1 className="text-2xl font-bold text-gray-900">Activity history</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Recent actions across HireIQ, most recent first.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="text-3xl font-bold text-green-600">
                                {createdCount}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Edited</p>
                            <p className="text-3xl font-bold text-amber-600">
                                {editedCount}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Deleted</p>
                            <p className="text-3xl font-bold text-red-600">
                                {deletedCount}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <p className="text-sm text-gray-500">Evaluated</p>
                            <p className="text-3xl font-bold text-indigo-600">
                                {evaluatedCount}
                            </p>
                        </div>
                    </div>
                </div>

                {loading && <p className="text-sm text-gray-500">Loading history...</p>}
                <div className="flex gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Search activity..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                        <option value="All">All</option>
                        <option value="created">Created</option>
                        <option value="edited">Edited</option>
                        <option value="deleted">Deleted</option>
                        <option value="evaluated">Evaluated</option>
                    </select>
                </div>

                {!loading && logs.length === 0 && (

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                        <p className="text-gray-500 text-sm">
                            No activity yet. Actions like adding, editing, evaluating, or deleting will show up here.
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    {logs
                        .filter((log) => {
                            const text = search.toLowerCase();

                            const matchesSearch =
                                log.action.toLowerCase().includes(text) ||
                                log.entity_type.toLowerCase().includes(text) ||
                                (log.entity_name ?? "").toLowerCase().includes(text) ||
                                (log.details ?? "").toLowerCase().includes(text);

                            const matchesFilter =
                                filter === "All" || log.action === filter;

                            return matchesSearch && matchesFilter;
                        })
                        .map((log) => (
                            <div
                                key={log.id}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{actionIcon(log.action)}</span>
                                    <div>
                                        <p className="text-sm text-gray-900">
                                            <span
                                                className={`inline-block text-xs font-medium border px-2 py-0.5 rounded-full mr-2 ${actionColor(
                                                    log.action
                                                )}`}
                                            >
                                                {log.action}
                                            </span>
                                            <span className="font-medium">{log.entity_type}</span>
                                            {log.entity_name && (
                                                <span className="text-gray-600"> · {log.entity_name}</span>
                                            )}
                                        </p>
                                        {log.details && (
                                            <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {timeAgo(log.created_at)}
                                </span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}