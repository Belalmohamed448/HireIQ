"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Role = { id: string; title: string };

export default function NewCandidatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [cvText, setCvText] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");

useEffect(() => {
    supabase
      .from("roles")
      .select("id, title")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load roles:", error);
          setError("Couldn't load the list of roles. You can still add the candidate without selecting one.");
          return;
        }
        if (data) setRoles(data as Role[]);
      });
  }, []); 
  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  setExtracting(true);
  setCvText("");

  try {
    const pdfjsLib = await import("pdfjs-dist");
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }

    setCvText(fullText.trim());
    setActiveTab("paste");
  } catch (err) {
    console.error(err);
    setError("Failed to extract text from PDF. Try pasting it manually.");
  } finally {
    setExtracting(false);
  }
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !cvText.trim()) {
      setError("Name, email, and CV text are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const { data: existingCandidate } = await supabase
  .from("candidates")
  .select("id")
  .ilike("email", email.trim())
  .limit(1);

if (existingCandidate && existingCandidate.length > 0) {
  setError("A candidate with this email already exists.");
  return;
}

    setSaving(true);

    const { error: insertError } = await supabase.from("candidates").insert({
      name: name.trim(),
      email: email.trim(),
      role_id: roleId || null,
      cv_text: cvText.trim(),
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await supabase.from("activity_log").insert({
      action: "created",
      entity_type: "candidate",
      entity_name: name.trim(),
      details: null,
    });

    setShowSuccess(true);
    setTimeout(() => router.push("/candidates/list"), 700);
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
            <h1 className="text-2xl font-bold text-gray-900">Add a candidate</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Enter candidate details manually or upload their resume as a PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/candidates/list")}
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap"
          >
            <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </span>
            <span className="relative">
              View all
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
            <p className="text-sm text-green-700">Candidate added. Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@email.com"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
              Role applying for <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            >
              <option value="">— Select a role —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>

          {/* CV — tabs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CV / Resume</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => setActiveTab("paste")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === "paste"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Paste text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === "upload"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Upload PDF
              </button>
            </div>

            {activeTab === "paste" && (
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={6}
                placeholder="Paste the candidate's CV or resume text here..."
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
              />
            )}

            {activeTab === "upload" && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                {extracting ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <p className="text-sm text-gray-500">Extracting text from PDF...</p>
                  </div>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 mx-auto mb-2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm text-gray-500 mb-2">
                      {cvText ? "PDF extracted — switch to Paste text to review." : "Upload a PDF resume to extract its text automatically."}
                    </p>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      {cvText ? "Upload a different PDF" : "Choose PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            )}
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
              {saving ? "Saving..." : "Add candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}