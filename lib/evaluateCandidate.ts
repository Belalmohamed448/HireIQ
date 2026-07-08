import { supabase } from "@/lib/supabase";
import { fetchCriteria, hasCriteria } from "@/lib/criteria";

export type EvaluationResult = {
    score: number;
    summary: string;
    matchedSkills: string[];
    missingSkills: string[];
    interviewFocusAreas: string[];
    recommendation: string;
};

type EvaluateParams = {
    candidateId: string;
    candidateName: string;
    cvText: string;
    roleId: string | null;
    reevaluation?: boolean;
};

type EvaluateOutcome =
    | { success: true; result: EvaluationResult }
    | { success: false; error: string };

export async function evaluateCandidate({
    candidateId,
    candidateName,
    cvText,
    roleId,
    reevaluation = false,
}: EvaluateParams): Promise<EvaluateOutcome> {
    if (!roleId) {
        return { success: false, error: "This candidate has no assigned role." };
    }

    const { data: role, error: roleError } = await supabase
        .from("roles")
        .select("title, description")
        .eq("id", roleId)
        .single();

    if (roleError || !role) {
        return { success: false, error: "Couldn't load the role for this candidate." };
    }

 const { data: criteria, error: criteriaFetchError } = await fetchCriteria(roleId);

    if (criteriaFetchError) {
        return { success: false, error: criteriaFetchError };
    }

    if (!hasCriteria(criteria)) {
        return {
            success: false,
            error: "This role has no evaluation criteria. Please configure it before evaluating.",
        };
    }

    const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            cvText,
            roleTitle: role.title,
            roleDescription: role.description,
            requiredSkills: criteria?.required_skills ?? [],
            preferredSkills: criteria?.preferred_skills ?? [],
            experienceLevel: criteria?.experience_level ?? "Any",
            minYears: criteria?.min_experience_years ?? 0,
            customCriteria: criteria?.custom_criteria ?? [],
        }),
    });

    if (!response.ok) {
        return { success: false, error: "Evaluation failed. Please try again." };
    }

    const result: EvaluationResult = await response.json();

    const { error: saveError } = await supabase.from("evaluations").insert({
        candidate_id: candidateId,
        role_id: roleId,
        score: result.score,
        summary: result.summary,
        matched_skills: result.matchedSkills,
        missing_skills: result.missingSkills,
        interview_focus_areas: result.interviewFocusAreas,
        recommendation: result.recommendation,
    });

    if (saveError) {
        console.error("SAVE ERROR:", saveError);
        return { success: false, error: "Failed to save evaluation." };
    }

    await supabase.from("activity_log").insert({
        action: "evaluated",
        entity_type: "candidate",
        entity_name: candidateName,
        details: `${reevaluation ? "Re-evaluated · " : ""}Score: ${result.score}/100 · ${result.recommendation}`,
    });

    return { success: true, result };
}