import Link from "next/link";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Roles", href: "/roles", icon: "💼" },
  { name: "Candidates", href: "/candidates", icon: "👥" },
  { name: "Evaluations", href: "/evaluations", icon: "🤖" },
  { name: "History", href: "/history", icon: "📜" },
  { name: "Settings", href: "/settings", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 min-h-screen bg-slate-900 text-white p-6 flex-col">
      <h2 className="text-2xl font-bold mb-8">
        HireIQ
      </h2>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-slate-800 hover:text-blue-400 transition"
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}