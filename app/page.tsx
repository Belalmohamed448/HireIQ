import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-6">
      <h1 className="text-6xl font-extrabold text-blue-700">
        HireIQ
      </h1>

      <p className="mt-6 max-w-2xl text-center text-xl text-gray-600">
        AI-Powered Candidate Evaluation Platform that helps recruiters
        analyze resumes, evaluate candidates, and hire the best talent
        faster using Artificial Intelligence.
      </p>

      <div className="mt-10 flex gap-4">
        <Link
          href="/signup"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
        >
          Get Started
        </Link>

        <Link
          href="/login"
          className="rounded-lg border border-blue-600 px-6 py-3 text-blue-600 font-semibold hover:bg-blue-50 transition"
        >
          Login
        </Link>
      </div>
    </main>
  );
}