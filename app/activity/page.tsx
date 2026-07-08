"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Activity = {
    id: string;
    action: string;
    entity_type: string;
    entity_name: string;
    details: string | null;
    created_at: string;
};

export default function ActivityPage() {
    const router = useRouter();

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivity();
    }, []);

    async function fetchActivity() {
        setLoading(true);

        const { data, error } = await supabase
            .from("activity_log")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setActivities(data as Activity[]);
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">

                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm text-gray-500 hover:text-gray-700 mb-6"
                >
                    ← Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold text-gray-900">
                    Activity Log
                </h1>

                <p className="text-gray-500 mt-2">
                    Track everything happening inside HireIQ.
                </p>

            </div>
        </div>
    );
}