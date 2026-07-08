"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [signingOut, setSigningOut] = useState(false);
    const [error, setError] = useState("");
   const [displayName, setDisplayName] = useState("");
    const [savingName, setSavingName] = useState(false);
    const [loadingName, setLoadingName] = useState(true);

  const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    const [currentEmail, setCurrentEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [savingEmail, setSavingEmail] = useState(false);

    useEffect(() => {
        async function loadName() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    "";
                setDisplayName(name);
                setCurrentEmail(user.email ?? "");
            }
            setLoadingName(false);
        }
        loadName();
    }, []);

    async function handleSaveName() {
        if (!displayName.trim()) {
            showToast("Display name can't be empty.", "error");
            return;
        }

        setSavingName(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: displayName.trim() },
        });
        setSavingName(false);

        if (error) {
            console.error("UPDATE NAME ERROR:", error);
            showToast("Failed to update display name.", "error");
            return;
        }

      showToast("Display name updated.", "success");
        setTimeout(() => {
            router.push("/dashboard");
        }, 700);
    }
 

    async function handleChangePassword() {
        if (!newPassword || !confirmPassword) {
            showToast("Please fill in both password fields.", "error");
            return;
        }

        if (newPassword.length < 8) {
            showToast("Password must be at least 8 characters.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("Passwords don't match.", "error");
            return;
        }

        setSavingPassword(true);
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        setSavingPassword(false);

        if (error) {
            console.error("UPDATE PASSWORD ERROR:", error);
            showToast("Failed to update password: " + error.message, "error");
            return;
        }

        showToast("Password updated.", "success");
        setNewPassword("");
        setConfirmPassword("");
    }

    async function handleChangeEmail() {
        if (!newEmail.trim()) {
            showToast("Please enter a new email address.", "error");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
            showToast("That's already your current email.", "error");
            return;
        }

        setSavingEmail(true);
        const { error } = await supabase.auth.updateUser({
            email: newEmail.trim(),
        });
        setSavingEmail(false);

        if (error) {
            console.error("UPDATE EMAIL ERROR:", error);
            showToast("Failed to update email: " + error.message, "error");
            return;
        }

        showToast(
            `Verification link sent to ${newEmail.trim()}. Check your inbox to confirm the change.`,
            "success"
        );
        setNewEmail("");
    }
   async function handleDeleteAccount() {
    const confirmed = window.confirm(
        "Are you sure you want to permanently delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            showToast("You are not logged in.", "error");
            return;
        }

        const res = await fetch("/api/delete-account", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Failed to delete account.", "error");
            return;
        }

        await supabase.auth.signOut();

        showToast("Account deleted successfully.", "success");

        router.push("/login");
    } catch (error) {
        console.error(error);
        showToast("Something went wrong.", "error");
    }
}

    async function handleSignOut() {
        setSigningOut(true);
        setError("");
 
        const { error } = await supabase.auth.signOut();
 
        if (error) {
            console.error("SIGN OUT ERROR:", error);
            setError("Failed to sign out. Please try again.");
            setSigningOut(false);
            return;
        }
 
        router.push("/login");
    }
 
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-xl mx-auto">
                <div className="mb-8">
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
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Manage your account preferences.
                    </p>
                </div>
 
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-1">Display name</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        This is the name shown in your dashboard header.
                    </p>

                    {loadingName ? (
                        <p className="text-sm text-gray-400">Loading...</p>
                    ) : (
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your name"
                                className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            />
                            <button
                                type="button"
                                onClick={handleSaveName}
                                disabled={savingName}
                                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                            >
                                {savingName ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </div>

             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-1">Change password</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Choose a new password for your account.
                    </p>

                    <div className="space-y-3">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                        <button
                            type="button"
                            onClick={handleChangePassword}
                            disabled={savingPassword}
                            className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                        >
                            {savingPassword ? "Updating..." : "Update password"}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <h2 className="font-semibold text-gray-900 mb-1">Account</h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Sign out of your HireIQ account on this device.
                    </p>
 
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 mb-4">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 mt-0.5 flex-shrink-0">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
 
                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                    >
                        {signingOut && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        )}
                        {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 sm:p-8 mt-6">
    <h2 className="font-semibold text-red-600 mb-1">
        Delete Account
    </h2>

    <p className="text-sm text-gray-500 mb-5">
        Permanently delete your account. This action cannot be undone.
    </p>

    <button
        type="button"
        onClick={handleDeleteAccount}
        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
    >
        Delete Account
    </button>
</div>
            </div>
        </div>
        
    );
}