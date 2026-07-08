"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get display name from metadata or email
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";
      setUserName(name);

      // Check for existing avatar
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(`${user.id}/avatar`);
      if (data?.publicUrl) {
        // Verify it actually exists by appending a cache-buster
        setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      }
    }
    loadUser();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(`${user.id}/avatar`, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(`${user.id}/avatar`);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    }

    setUploading(false);
  }

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="flex items-center justify-between bg-white border-b px-4 md:px-8 py-4 shadow-sm">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Recruiter Dashboard
        </h1>
        <p className="hidden sm:block text-sm text-gray-500 mt-1">
          Manage roles, candidates and AI evaluations.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-xl hover:text-blue-600 transition">
          🔔
        </button>

        <div className="flex items-center gap-3">
          {/* Avatar — click to upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-10 h-10 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold hover:ring-2 hover:ring-blue-400 transition"
            title="Click to change photo"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <span>{uploading ? "..." : initials}</span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          <div className="hidden md:block">
            <p className="font-semibold">{userName || "Loading..."}</p>
            <p className="text-sm text-gray-500">Recruiter</p>
          </div>
        </div>
      </div>
    </header>
  );
}