import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { WorkflowCenterView } from "./WorkflowCenterView";
import { MOCK_WORKFLOWS } from "@/lib/workflow-mock-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Workflow Center",
};

/**
 * Workflow Center — Phase E (initial release).
 *
 * Access (per spec):
 *   - Superadmin: all workflows, full edit
 *   - Admin:      all workflows, read only
 *   - HR:         active workflows only, read only
 *   - HOD:        own department only, full edit  (role string TBD)
 *   - Everyone else: redirected to /home
 *
 * Data:
 *   workflow_template / workflow_step / workflow_link tables don't exist in
 *   the DB yet. Until they do, all data comes from src/lib/workflow-mock-data.ts.
 *   This file is the integration point for the eventual switch — the
 *   workflows + meta passed to <WorkflowCenterView> will come from real
 *   queries instead of MOCK_WORKFLOWS.
 *   // TODO: create workflow_template / workflow_step / workflow_link tables
 *   //       then replace MOCK_WORKFLOWS below with real Prisma query
 */
export default async function WorkflowCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  const roleType = (actor?.role?.role_type ?? "").toLowerCase();

  // Allowed roles per spec
  const ALLOWED = new Set(["superadmin", "admin", "hr", "od", "hod"]);
  if (!ALLOWED.has(roleType)) {
    redirect("/home");
  }

  // Filter mock workflows by role (HR sees only active; everyone else sees all
  // — admin/hod scoping by department happens in the view via tabs).
  const visibleWorkflows = roleType === "hr"
    ? MOCK_WORKFLOWS.filter((w) => w.status === "active")
    : MOCK_WORKFLOWS;

  const canEdit = roleType === "superadmin" || roleType === "hod";

  return (
    <AppShell
      email={session.user.email}
      role={actor?.role?.role_type ?? ""}
      name={session.user.name ?? null}
    >
      <WorkflowCenterView
        workflows={visibleWorkflows}
        canEdit={canEdit}
        canCreateNew={canEdit}
      />
    </AppShell>
  );
}
