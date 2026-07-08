export type ScoreCandidateInput = {
    cvText: string;
    requiredSkills: string[];
    preferredSkills: string[];
    customCriteria: { label: string }[];
    experienceLevel: string;
    minYears: number | null;
};

export type ScoreCandidateResult = {
    score: number;
    recommendation: string;
    summary: string;
    matchedSkills: string[];
    missingSkills: string[];
    interviewFocusAreas: string[];
};

const REQUIRED_SKILLS_WEIGHT = 60;
const PREFERRED_SKILLS_WEIGHT = 20;
const YEARS_WEIGHT = 10;
const LEVEL_WEIGHT = 10;

function extractYearsOfExperience(cvText: string): number {
    const match = cvText.match(/(\d+)\s+years?/i);
    return match ? Number(match[1]) : 0;
}

function findMatchedAndMissing(cvTextLower: string, skills: string[]) {
    const matched: string[] = [];
    const missing: string[] = [];

    for (const skill of skills) {
        if (cvTextLower.includes(skill.toLowerCase())) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }
    }

    return { matched, missing };
}

function scoreRequiredSkills(matchedCount: number, totalCount: number): number {
    if (totalCount === 0) return REQUIRED_SKILLS_WEIGHT;
    return (matchedCount / totalCount) * REQUIRED_SKILLS_WEIGHT;
}

function scorePreferredSkills(matchedCount: number, totalCount: number): number {
    if (totalCount === 0) return PREFERRED_SKILLS_WEIGHT;
    return (matchedCount / totalCount) * PREFERRED_SKILLS_WEIGHT;
}

function scoreYearsOfExperience(years: number, minimumYears: number): number {
    if (minimumYears === 0) {
        return years >= 5 ? YEARS_WEIGHT : years * 2;
    }
    const ratio = Math.min(years / minimumYears, 1);
    return Math.round(ratio * YEARS_WEIGHT);
}

const LEVEL_THRESHOLDS: Record<string, { years: number; score: number }[]> = {
    Junior: [
        { years: 2, score: 10 },
        { years: 1, score: 6 },
    ],
    Mid: [
        { years: 5, score: 10 },
        { years: 4, score: 8 },
        { years: 3, score: 6 },
        { years: 2, score: 4 },
    ],
    Senior: [
        { years: 8, score: 10 },
        { years: 7, score: 8 },
        { years: 6, score: 6 },
        { years: 5, score: 4 },
    ],
    Lead: [
        { years: 10, score: 10 },
        { years: 9, score: 8 },
        { years: 8, score: 6 },
        { years: 7, score: 4 },
    ],
};

function scoreExperienceLevel(years: number, experienceLevel: string): number {
    if (experienceLevel === "Any") return LEVEL_WEIGHT;

    const thresholds = LEVEL_THRESHOLDS[experienceLevel];
    if (!thresholds) return 0;

    for (const { years: threshold, score } of thresholds) {
        if (years >= threshold) return score;
    }

    return 2;
}

function buildRecommendation(score: number): string {
    if (score >= 85) return "Strongly Recommended";
    if (score >= 70) return "Recommended";
    if (score >= 50) return "Consider for Interview";
    return "Not Recommended";
}

export function scoreCandidate(input: ScoreCandidateInput): ScoreCandidateResult {
    const {
        cvText,
        requiredSkills,
        preferredSkills,
        customCriteria,
        experienceLevel,
        minYears,
    } = input;

    const cvTextLower = cvText.toLowerCase();
    const years = extractYearsOfExperience(cvText);

    const { matched: matchedSkills, missing: missingSkills } = findMatchedAndMissing(
        cvTextLower,
        requiredSkills
    );

    const { matched: matchedPreferred, missing: unconfirmedPreferred } = findMatchedAndMissing(
        cvTextLower,
        preferredSkills
    );

    const unconfirmedCriteria = customCriteria
        .filter((c) => !cvTextLower.includes((c.label ?? "").toLowerCase()))
        .map((c) => c.label);

    const interviewFocusAreas = [
        ...missingSkills,
        ...unconfirmedPreferred,
        ...unconfirmedCriteria,
    ];

    const requiredScore = scoreRequiredSkills(matchedSkills.length, requiredSkills.length);
    const preferredScore = scorePreferredSkills(matchedPreferred.length, preferredSkills.length);
    const yearsScore = scoreYearsOfExperience(years, minYears ?? 0);
    const levelScore = scoreExperienceLevel(years, experienceLevel);

    const score = Math.min(
        100,
        Math.round(requiredScore + preferredScore + yearsScore + levelScore)
    );

    return {
        score,
        recommendation: buildRecommendation(score),
        summary: `Matches ${matchedSkills.length} of ${requiredSkills.length} required skills.`,
        matchedSkills,
        missingSkills,
        interviewFocusAreas,
    };
}