"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MAX_DESCRIPTION_LENGTH = 500;

export default function NewRolePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [seniority, setSeniority] = useState("Mid");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!title.trim() || !description.trim()) {
            setError("Title and description are required.");
            return;
        }

        setSaving(true);

        // Duplicate title check
        const { data: existing, error: lookupError } = await supabase
            .from("roles")
            .select("id")
            .ilike("title", title.trim())
            .limit(1);

        if (lookupError) {
            setSaving(false);
            setError(lookupError.message);
            return;
        }

        if (existing && existing.length > 0) {
            setSaving(false);
            setError(`A role titled "${title.trim()}" already exists.`);
            return;
        }

        const { data: inserted, error: insertError } = await supabase
            .from("roles")
            .insert({
                title: title.trim(),
                description: description.trim(),
                skills: [],
                seniority,
            })
            .select()
            .single();

        setSaving(false);

        if (insertError || !inserted) {
            setError(insertError?.message ?? "Failed to create role.");
            return;
        }

        await supabase.from("activity_log").insert({
            action: "created",
            entity_type: "role",
            entity_name: title.trim(),
            details: null,
        });

        setShowSuccess(true);
        setTimeout(() => {
            router.push(`/roles/${inserted.id}/criteria`);
        }, 700);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-xl mx-auto">
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
                        <h1 className="text-2xl font-bold text-gray-900">Create a new role</h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Define the position. You'll set detailed skill and experience criteria next.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/roles/list")}
                        className="group inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
                    >
                        <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-blue-600"
                            >
                                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                            </svg>
                        </span>
                        <span className="relative">
                            View all roles
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gray-900 transition-all duration-300 group-hover:w-full" />
                        </span>
                    </button>
                </div>

                {/* Success banner */}
                {showSuccess && (
                    <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3.5 py-2.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm text-green-700">Role created. Taking you to set its criteria...</p>
                    </div>
                )}

                {/* Form card */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6"
                >
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Role title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Senior Backend Engineer"
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <span
                                className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH ? "text-red-500" : "text-gray-400"
                                    }`}
                            >
                                {description.length}/{MAX_DESCRIPTION_LENGTH}
                            </span>
                        </div>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                            rows={4}
                            placeholder="What will this person be responsible for?"
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                        />
                    </div>

                    {/* Seniority */}
                    <div>
                        <label htmlFor="seniority" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Seniority level
                        </label>
                        <select
                            id="seniority"
                            value={seniority}
                            onChange={(e) => setSeniority(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        >
                            <option>Junior</option>
                            <option>Mid</option>
                            <option>Senior</option>
                            <option>Lead</option>
                        </select>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mt-0.5 flex-shrink-0">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                        >
                            {saving && (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            )}
                            {saving ? "Creating..." : "Create role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}