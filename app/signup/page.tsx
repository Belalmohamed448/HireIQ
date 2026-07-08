// Due to chat size limits, this starter file is generated.
// Replace with your latest working version if needed and continue enhancements.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SignupPage() {
    const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [success, setSuccess] = useState("");

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setSuccess("");

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
      setPasswordError("Password does not meet all requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

   setLoading(true);

const { error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
});

if (error) {
  setEmailError(error.message);
  setLoading(false);
  return;
}

setSuccess("Account created successfully! Redirecting to login...");

setLoading(false);

setTimeout(() => {
  router.push("/login");
}, 1500);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Create Your Account</h1>

        <Input id="email" label="Email" type="email" placeholder="Email" value={email}
          error={emailError} autoFocus
          onChange={(e)=>{setEmail(e.target.value);setEmailError("");}}/>

        <Input id="password" label="Password"
          type={showPassword?"text":"password"}
          placeholder="Password"
          value={password}
          error={passwordError}
          onChange={(e)=>{setPassword(e.target.value);setPasswordError("");}}/>

        <button type="button" className="text-blue-600 text-sm mt-2"
          onClick={()=>setShowPassword(!showPassword)}>
          {showPassword?"Hide Password":"Show Password"}
        </button>

        <div className="mt-3 text-sm space-y-1">
          <p className={hasMinLength?"text-green-600":"text-red-600"}>{hasMinLength?"✔":"✖"} At least 8 characters</p>
          <p className={hasUpperCase?"text-green-600":"text-red-600"}>{hasUpperCase?"✔":"✖"} One uppercase letter</p>
          <p className={hasLowerCase?"text-green-600":"text-red-600"}>{hasLowerCase?"✔":"✖"} One lowercase letter</p>
          <p className={hasNumber?"text-green-600":"text-red-600"}>{hasNumber?"✔":"✖"} One number</p>
        </div>

        <Input id="confirmPassword" label="Confirm Password"
          type={showConfirmPassword?"text":"password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          error={confirmPasswordError}
          onChange={(e)=>{setConfirmPassword(e.target.value);setConfirmPasswordError("");}}/>

        <button type="button" className="text-blue-600 text-sm mt-2"
          onClick={()=>setShowConfirmPassword(!showConfirmPassword)}>
          {showConfirmPassword?"Hide Password":"Show Password"}
        </button>

        {success && <p className="mt-4 text-green-600">{success}</p>}

        <Button type="submit" disabled={loading}>
          {loading?"Creating Account...":"Create Account"}
        </Button>

        <p className="mt-6 text-center text-sm">
          Already have an account? <Link href="/login" className="text-blue-600">Log In</Link>
        </p>
      </form>
    </main>
  );
}
