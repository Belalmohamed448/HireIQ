"use client";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CustomCriterion = { id: string; label: string };

// Keyword → suggested skills dictionary. Matching is case-insensitive
// and checks both the role title and description.
const SKILL_SUGGESTIONS: { keywords: string[]; skills: string[] }[] = [
    { keywords: ["backend", "back-end", "server"], skills: ["Node.js", "SQL", "REST APIs", "Docker", "PostgreSQL"] },
    { keywords: ["frontend", "front-end", "ui engineer"], skills: ["React", "TypeScript", "CSS", "Next.js", "Accessibility"] },
    { keywords: ["full stack", "fullstack", "full-stack"], skills: ["React", "Node.js", "SQL", "TypeScript", "REST APIs"] },
    { keywords: ["mobile", "ios", "android", "react native", "flutter"], skills: ["Swift", "Kotlin", "React Native", "Flutter", "Mobile UI"] },
    { keywords: ["data scientist", "data science", "ml engineer", "machine learning"], skills: ["Python", "Pandas", "scikit-learn", "SQL", "Statistics"] },
    { keywords: ["data engineer", "data engineering"], skills: ["Python", "SQL", "Airflow", "Spark", "ETL"] },
    { keywords: ["devops", "sre", "site reliability", "infrastructure"], skills: ["Kubernetes", "Docker", "AWS", "CI/CD", "Terraform"] },
    { keywords: ["designer", "product design", "ux", "ui design"], skills: ["Figma", "Prototyping", "User Research", "Design Systems"] },
    { keywords: ["product manager", "product management", " pm "], skills: ["Roadmapping", "Stakeholder Management", "Analytics", "User Research"] },
    { keywords: ["qa", "quality assurance", "test engineer", "sdet"], skills: ["Test Automation", "Selenium", "Cypress", "Manual Testing"] },
    { keywords: ["security", "cybersecurity", "infosec"], skills: ["Penetration Testing", "Security Audits", "OWASP", "Networking"] },
    { keywords: ["marketing"], skills: ["SEO", "Content Strategy", "Google Analytics", "Copywriting"] },
    { keywords: ["sales", "account executive", "business development"], skills: ["CRM", "Negotiation", "Lead Generation", "Salesforce"] },
];

function getSuggestedSkills(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const matched = new Set<string>();

    for (const entry of SKILL_SUGGESTIONS) {
        if (entry.keywords.some((kw) => text.includes(kw))) {
            entry.skills.forEach((s) => matched.add(s));
        }
    }

    return Array.from(matched);
}

export default function CriteriaPage() {
    const { id: roleId } = useParams();
    const router = useRouter();
const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existingId, setExistingId] = useState<string | null>(null);

    const [roleTitle, setRoleTitle] = useState("");
    const [roleDescription, setRoleDescription] = useState("");

    const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
    const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
    const [requiredInput, setRequiredInput] = useState("");
    const [preferredInput, setPreferredInput] = useState("");

    const [minYears, setMinYears] = useState<number | "">("");
    const [experienceLevel, setExperienceLevel] = useState("Any");

    const [customCriteria, setCustomCriteria] = useState<CustomCriterion[]>([]);
    const [customInput, setCustomInput] = useState("");

    const [saved, setSaved] = useState(false);

    // Load role info (for suggestions) + existing criteria if present
    useEffect(() => {
        async function load() {
            const { data: roleData } = await supabase
                .from("roles")
                .select("title, description")
                .eq("id", roleId)
                .maybeSingle();

            if (roleData) {
                setRoleTitle(roleData.title ?? "");
                setRoleDescription(roleData.description ?? "");
            }

            const { data, error } = await supabase
                .from("criteria")
                .select("*")
                .eq("role_id", roleId)
                .maybeSingle();

            if (data) {
                setExistingId(data.id);
                setRequiredSkills(data.required_skills ?? []);
                setPreferredSkills(data.preferred_skills ?? []);
                setMinYears(data.min_experience_years ?? "");
                setExperienceLevel(data.experience_level ?? "Any");
                setCustomCriteria(data.custom_criteria ?? []);
            }
            setLoading(false);
        }
        if (roleId) load();
    }, [roleId]);

    const suggestedSkills = getSuggestedSkills(roleTitle, roleDescription).filter(
        (s) => !requiredSkills.includes(s) && !preferredSkills.includes(s)
    );

    function addSkill(type: "required" | "preferred", value: string) {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (type === "required") {
            if (!requiredSkills.includes(trimmed)) setRequiredSkills([...requiredSkills, trimmed]);
            setRequiredInput("");
        } else {
            if (!preferredSkills.includes(trimmed)) setPreferredSkills([...preferredSkills, trimmed]);
            setPreferredInput("");
        }
    }

   function removeSkill(type: "required" | "preferred", skill: string) {
        if (type === "required") setRequiredSkills(requiredSkills.filter((s) => s !== skill));
        else setPreferredSkills(preferredSkills.filter((s) => s !== skill));
    }

    function moveSkill(skill: string, from: "required" | "preferred", to: "required" | "preferred") {
        if (from === "required") {
            setRequiredSkills(requiredSkills.filter((s) => s !== skill));
        } else {
            setPreferredSkills(preferredSkills.filter((s) => s !== skill));
        }

        if (to === "required") {
            if (!requiredSkills.includes(skill)) setRequiredSkills((prev) => [...prev, skill]);
        } else {
            if (!preferredSkills.includes(skill)) setPreferredSkills((prev) => [...prev, skill]);
        }
    }

    function addCustomCriterion() {
        const value = customInput.trim();
        if (!value) return;
        setCustomCriteria([...customCriteria, { id: crypto.randomUUID(), label: value }]);
        setCustomInput("");
    }

    function removeCustomCriterion(cid: string) {
        setCustomCriteria(customCriteria.filter((c) => c.id !== cid));
    }

  async function handleSave() {
        if (typeof minYears === "number" && minYears < 0) {
            showToast("Minimum years can't be negative.", "error");
            return;
        }

        setSaving(true);
        const payload = {
            role_id: roleId,
            required_skills: requiredSkills,
            preferred_skills: preferredSkills,
            min_experience_years: minYears === "" ? null : minYears,
            experience_level: experienceLevel,
            custom_criteria: customCriteria,
            updated_at: new Date().toISOString(),
        };

       try {
            const { error } = existingId
                ? await supabase.from("criteria").update(payload).eq("id", existingId)
                : await supabase.from("criteria").insert(payload);

            setSaving(false);

            if (!error) {
                await supabase.from("activity_log").insert({
                    action: existingId ? "edited" : "created",
                    entity_type: "criteria",
                    entity_name: roleTitle || "Untitled role",
                    details: null,
                });

                showToast("Criteria saved.", "success");
                setSaved(true);
                setTimeout(() => {
                    router.push("/roles/list");
                }, 1000);
            } else {
                console.error(error);
                showToast("Failed to save criteria: " + error.message, "error");
            }
        } catch (err) {
            setSaving(false);
            console.error("SAVE CRITERIA NETWORK ERROR:", err);
            showToast("You appear to be offline. Check your connection and try again.", "error");
        }
    }

    if (loading) return <div className="p-8 text-gray-500">Loading criteria...</div>;

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-1">Evaluation Criteria</h1>
            <p className="text-gray-500 mb-6">
                Define what matters for this role. Candidates will be scored against this.
            </p>

            {/* Suggested Skills */}
            {suggestedSkills.length > 0 && (
                <section className="mb-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <p className="text-sm font-medium text-indigo-900 mb-2">
                        Suggested skills based on this role
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedSkills.map((skill) => (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => addSkill("preferred", skill)}
                                className="text-xs bg-white border border-indigo-200 text-indigo-700 rounded-full px-3 py-1 hover:bg-indigo-100 transition-colors"
                                title="Add to preferred skills"
                            >
                                + {skill}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-indigo-400 mt-2">
                        Click to add to Preferred Skills. Move it to Required below if it's a must-have.
                    </p>
                </section>
            )}

            {/* Required Skills */}
            <section className="mb-6">
                <label className="block font-medium mb-2">Required Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                    {requiredSkills.map((skill) => (
                        <span
                            key={skill}
                            className="bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                        >
                            {skill}
                            <button
                                onClick={() => moveSkill(skill, "required", "preferred")}
                                className="text-red-400 hover:text-red-700 text-xs ml-1"
                                title="Move to Preferred"
                            >
                                ↓
                            </button>
                            <button onClick={() => removeSkill("required", skill)} className="text-red-400 hover:text-red-700">
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    value={requiredInput}
                    onChange={(e) => setRequiredInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("required", requiredInput))}
                    placeholder="Type a skill and press Enter"
                    className="border rounded-lg px-3 py-2 w-full"
                />
            </section>

            {/* Preferred Skills */}
            <section className="mb-6">
                <label className="block font-medium mb-2">Preferred Skills</label>
               <div className="flex flex-wrap gap-2 mb-2">
                    {preferredSkills.map((skill) => (
                        <span
                            key={skill}
                            className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                        >
                            {skill}
                            <button
                                onClick={() => moveSkill(skill, "preferred", "required")}
                                className="text-blue-400 hover:text-blue-700 text-xs ml-1"
                                title="Move to Required"
                            >
                                ↑
                            </button>
                            <button onClick={() => removeSkill("preferred", skill)} className="text-blue-400 hover:text-blue-700">
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    value={preferredInput}
                    onChange={(e) => setPreferredInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("preferred", preferredInput))}
                    placeholder="Type a skill and press Enter"
                    className="border rounded-lg px-3 py-2 w-full"
                />
            </section>

            {/* Experience Criteria */}
            <section className="mb-6">
                <label className="block font-medium mb-2">Experience Criteria</label>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm text-gray-500">Minimum years</label>
                       <input
                            type="number"
                            min={0}
                            value={minYears}
                            onChange={(e) => {
                                if (e.target.value === "") {
                                    setMinYears("");
                                    return;
                                }
                                const num = Number(e.target.value);
                                setMinYears(num < 0 ? 0 : num);
                            }}
                            className="border rounded-lg px-3 py-2 w-full mt-1"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-sm text-gray-500">Level</label>
                        <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="border rounded-lg px-3 py-2 w-full mt-1"
                        >
                            <option>Any</option>
                            <option>Junior</option>
                            <option>Mid</option>
                            <option>Senior</option>
                            <option>Lead</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Custom Criteria */}
            <section className="mb-8">
                <label className="block font-medium mb-2">Custom Criteria</label>
                <div className="space-y-2 mb-2">
                    {customCriteria.map((c) => (
                        <div key={c.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                            <span>{c.label}</span>
                            <button onClick={() => removeCustomCriterion(c.id)} className="text-gray-400 hover:text-red-600">
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCriterion())}
                        placeholder="e.g. Must have led a team of 3+"
                        className="border rounded-lg px-3 py-2 flex-1"
                    />
                    <button
                        onClick={addCustomCriterion}
                        className="bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 text-sm"
                    >
                        Add
                    </button>
                </div>
            </section>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-black text-white rounded-lg px-5 py-2.5 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Criteria"}
                </button>
                {saved && <span className="text-green-600 text-sm">✓ Criteria saved</span>}
                <button onClick={() => router.push("/roles/list")} className="text-gray-500 text-sm">
                    Back to roles
                </button>
            </div>
        </div>
    );
}
