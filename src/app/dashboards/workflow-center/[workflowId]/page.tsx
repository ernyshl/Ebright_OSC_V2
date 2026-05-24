import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/nextauth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/AppShell";
import { WorkflowDetailView } from "./WorkflowDetailView";
import { findWorkflow } from "@/lib/workflow-mock-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ workflowId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Workflow detail / builder view. Same access rules as the list page.
 * `?edit=1` query param toggles edit mode if the user is allowed.
 *
 * Mock data only — see /lib/workflow-mock-data.ts.
 * // TODO: replace findWorkflow with real Prisma query once workflow_template
 * //       and workflow_step tables exist.
 */
export default async function WorkflowDetailPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const actor = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, role: { select: { role_type: true } } },
  });
  const roleType = (actor?.role?.role_type ?? "").toLowerCase();
  const ALLOWED = new Set(["superadmin", "admin", "hr", "od", "hod"]);
  if (!ALLOWED.has(roleType)) {
    redirect("/home");
  }

  const { workflowId } = await params;
  const sp = await searchParams;
  const id = Number(workflowId);
  if (!Number.isFinite(id)) notFound();

  const workflow = findWorkflow(id);
  if (!workflow) notFound();

  // HR sees only active workflows
  if (roleType === "hr" && workflow.status !== "active") {
    notFound();
  }

  const canEdit = (roleType === "superadmin" || roleType === "hod") && sp.edit === "1";

  return (
    <AppShell
      email={session.user.email}
      role={actor?.role?.role_type ?? ""}
      name={session.user.name ?? null}
    >
      <WorkflowDetailView workflow={workflow} canEdit={canEdit} />
    </AppShell>
  );
}
