"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TestPage() {
  useEffect(() => {
    async function testConnection() {
      console.log("Testing connection...");

      const { data, error } = await supabase.auth.getSession();

      console.log("Data:", data);
      console.log("Error:", error);
    }

    testConnection();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Testing Supabase Connection...
      </h1>
    </div>
  );
}