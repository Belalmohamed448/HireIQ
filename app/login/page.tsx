"use client";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";


export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setError("");

        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setLoading(false);

        router.push("/dashboard");
    }
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white w-full max-w-md rounded-xl shadow-lg p-8"
            >
                <h1 className="text-3xl font-bold text-center mb-2">
                    Welcome Back
                </h1>

                <p className="text-center text-gray-500 mb-8">
                    Log in to continue using HireIQ.
                </p>

                <Input
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    autoFocus
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                    }}
                />
                <div className="mt-5">
                    <Input
                        id="password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                    />


                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-blue-600 text-sm mt-2 hover:underline"
                    >
                        {showPassword ? "Hide Password" : "Show Password"}
                    </button>
                </div>
                {error && (
                    <div className="mt-5 rounded-lg border border-red-300 bg-red-100 p-3">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Logging In..." : "Log In"}
                </Button>

                <p className="text-center text-sm text-gray-600 mt-8">
                    Don't have an account?{" "}
                    <Link
                        href="/signup"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Create one
                    </Link>
                </p>
            </form>
        </main>
    );
}