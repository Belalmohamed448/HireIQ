export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-8">HireIQ</h2>

      <nav className="space-y-4">
        <p>📊 Dashboard</p>
        <p>💼 Roles</p>
        <p>👥 Candidates</p>
        <p>🤖 Evaluations</p>
        <p>📜 History</p>
        <p>⚙️ Settings</p>
      </nav>
    </aside>
  );
}