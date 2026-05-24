"use client";

/**
 * Modular Department Workflow placeholder — per spec Phase A.
 *
 * Self-contained dashed-border card. Will be replaced with the real
 * workflow display once the workflow builder (Phase E) connects to
 * candidate-assigned workflows.
 *
 * // TODO: connect to workflow_template + workflow_assignment tables (Phase
 * //       E.2+). When a workflow is assigned to this candidate, render the
 * //       workflow steps here using the same checklist pattern as Day Tabs.
 */
interface Props {
  /** Optional override message if a department-specific note is needed. */
  message?: string;
}

export function DepartmentWorkflowPlaceholder({
  message = "Department workflow will be assigned by your department head.",
}: Props) {
  return (
    <section
      className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center"
      aria-labelledby="dept-workflow-placeholder"
    >
      <p className="text-3xl mb-2" aria-hidden="true">⚙️</p>
      <h2 id="dept-workflow-placeholder" className="text-base font-semibold text-slate-700">
        Department Workflow
      </h2>
      <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">{message}</p>
      <p className="mt-3 text-xs text-slate-400">
        🔗 To be connected to workflow builder (Process Street-style).
      </p>
    </section>
  );
}
