import { redirect } from "next/navigation";
import { verifyAdmin } from "../../lib/admin-auth";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    redirect("/admin");
  }

  return <DashboardClient />;
}