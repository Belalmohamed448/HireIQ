import { supabase } from "@/lib/supabase";

export type Criteria = {
    required_skills: string[] | null;
    preferred_skills: string[] | null;
    custom_criteria: { id: string; label: string }[] | null;
    experience_level: string | null;
    min_experience_years: number | null;
};

export async function fetchCriteria(roleId: string): Promise<{ data: Criteria | null; error: string | null }> {
    const { data, error } = await supabase
        .from("criteria")
        .select("*")
        .eq("role_id", roleId)
        .maybeSingle();

    if (error) {
        console.error("CRITERIA FETCH ERROR:", error);
        return { data: null, error: "Couldn't check evaluation criteria for this role." };
    }

    return { data, error: null };
}

export function hasCriteria(criteria: Criteria | null): boolean {
    if (!criteria) return false;
    return (
        (criteria.required_skills?.length ?? 0) > 0 ||
        (criteria.preferred_skills?.length ?? 0) > 0 ||
        (criteria.custom_criteria?.length ?? 0) > 0
    );
}