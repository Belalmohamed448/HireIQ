"use client";
"use client";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Role = {
    id: string;
    title: string;
    description: string;
    skills: string[];
    seniority: string;
    created_at: string;
};

export default function RolesListPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [criteriaRoleIds, setCriteriaRoleIds] = useState<Set<string>>(new Set());
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    async function fetchRoles() {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
            .from("roles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to load roles:", error);
            setLoadError("We couldn't load your roles. Please try again.");
            setLoading(false);
            return;
        }

        if (data) {
            setRoles(data as Role[]);
        }

        const { data: criteriaData, error: criteriaError } = await supabase
            .from("criteria")
            .select("role_id");

        if (!criteriaError && criteriaData) {
            setCriteriaRoleIds(new Set(criteriaData.map((c) => c.role_id)));
        }

        setLoading(false);
    }
  async function handleDelete(id: string) {
        const role = roles.find((r) => r.id === id);
        setDeletingId(id);
        const { error } = await supabase.from("roles").delete().eq("id", id);
        if (!error) {
            setRoles((prev) => prev.filter((r) => r.id !== id));
            if (role) {
                await supabase.from("activity_log").insert({
                    action: "deleted",
                    entity_type: "role",
                    entity_name: role.title,
                    details: null,
                });
                showToast(`"${role.title}" deleted.`, "success");
            }
        } else {
            console.error("DELETE ERROR:", error);
            showToast("Failed to delete role.", "error");
        }
        setDeletingId(null);
    }
    const seniorityColors: Record<string, string> = {
        Junior: "bg-gray-100 text-gray-700",
        Mid: "bg-blue-50 text-blue-700",
        Senior: "bg-purple-50 text-purple-700",
        Lead: "bg-amber-50 text-amber-700",
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
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
                        <h1 className="text-2xl font-bold text-gray-900">All roles</h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {roles.length} role{roles.length !== 1 ? "s" : ""} created.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/roles")}
                        className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New role
                    </button>
                </div>

               {/* Loading */}
                {loading && <LoadingSpinner text="Loading roles..." />}

                {/* Error state */}
                {!loading && loadError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
                        <p className="text-sm">{loadError}</p>
                        <button
                            onClick={fetchRoles}
                            className="mt-3 text-sm font-medium underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !loadError && roles.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                        <p className="text-gray-500 text-sm mb-4">No roles yet. Create your first one to get started.</p>
                        <button
                            type="button"
                            onClick={() => router.push("/roles")}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Create a role →
                        </button>
                    </div>
                )}

              {/* Roles list */}
                {!loading && !loadError && (
                <div className="space-y-3">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="font-semibold text-gray-900">{role.title}</h3>
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${seniorityColors[role.seniority] || "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {role.seniority}
                                    </span>
                                </div>
                              <p className="text-sm text-gray-500 mb-2.5 line-clamp-2">{role.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/roles/${role.id}/criteria`)}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                                >
                                    {criteriaRoleIds.has(role.id) ? "Edit criteria" : "Set criteria"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(role.id)}
                                    disabled={deletingId === role.id}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
                                    title="Delete role"
                                >
                                    {deletingId === role.id ? (
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
                   ))}
                </div>
                )}
            </div>
        </div>
    );
}
