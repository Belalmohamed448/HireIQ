export default function Header() {
  return (
    <header className="flex items-center justify-between bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Recruiter Dashboard
        </h1>

        <p className="text-gray-500">
          Welcome back to HireIQ
        </p>
      </div>

      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
        B
      </div>
    </header>
  );
}