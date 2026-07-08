import { NextResponse } from "next/server";
import { scoreCandidate } from "@/lib/evaluation/scoreCandidate";

export async function GET() {
    return NextResponse.json({
        message: "API is working!",
    });
}

export async function POST(req: Request) {
    try {
        const {
            cvText,
            requiredSkills,
            preferredSkills,
            experienceLevel,
            minYears,
            customCriteria,
        } = await req.json();

        const result = scoreCandidate({
            cvText,
            requiredSkills: requiredSkills ?? [],
            preferredSkills: preferredSkills ?? [],
            customCriteria: customCriteria ?? [],
            experienceLevel,
            minYears,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("===== AI ERROR =====");
        console.error(error);

        return NextResponse.json(
            { message: "Evaluation failed. Please try again." },
            { status: 500 }
        );
    }
}