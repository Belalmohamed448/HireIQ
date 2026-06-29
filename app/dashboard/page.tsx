import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h1 className="text-4xl font-bold">
        Recruiter Dashboard
      </h1>

      <p className="mt-4 text-gray-600">
        Welcome to HireIQ.
      </p>
    </DashboardLayout>
  );
}