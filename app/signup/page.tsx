"use client";

import { useState } from "react";
export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        alert("Form Submitted!");
    };
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
            >

                <h1 className="text-3xl font-bold text-center mb-6">
                    Create Your Account
                </h1>


                <label
                    htmlFor="email"
                    className="block mb-2 font-medium"
                >
                    Email
                </label>

                <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />


                <label
                    htmlFor="password"
                    className="block mt-4 mb-2 font-medium"
                >
                    Password
                </label>

                <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />


                <button
                    type="submit"
                    className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    Create Account
                </button>

                <p className="mt-6 text-sm text-gray-600">
                    Email: {email}
                </p>

                <p className="text-sm text-gray-600">
                    Password: {password}
                </p>

            </form>
        </main>
    );
}