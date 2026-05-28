"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkflow, type ActionResult } from "./actions";

const DEFAULT_CATEGORIES = ["Onboarding", "Offboarding", "Other"] as const;

const APPLIES_TO_OPTIONS = [
  "Regular Intern",
  "Protege Intern",
  "Coach (Part-timer)",
  "Coach (Full-timer)",
  "Full-timer (HQ)",
];

const TRIGGER_OPTIONS = [
  { value: "after-day-3", label: "After Day 3 Induction Completed" },
  { value: "after-branch", label: "After Branch Onboarding Completed" },
  { value: "manual", label: "Manual assignment by HR" },
];

interface DepartmentOption {
  id: number;
  name: string;
  code: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Departments the actor can pick from. For HOD this is just their own. */
  departments: DepartmentOption[];
  /** When set, the department field is locked to this id (HOD case). */
  lockedDepartmentId: number | null;
  /** Previously-used categories in the actor's scope — adds to the dropdown. */
  knownCategories: string[];
}

export function CreateWorkflowModal({
  open,
  onClose,
  departments,
  lockedDepartmentId,
  knownCategories,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const initialDepartment = lockedDepartmentId ?? departments[0]?.id ?? null;
  const [departmentId, setDepartmentId] = useState<number | null>(initialDepartment);
  const [name, setName] = useState("");
  const [categoryMode, setCategoryMode] = useState<"preset" | "custom">("preset");
  const [categoryPreset, setCategoryPreset] = useState<string>("Onboarding");
  const [categoryCustom, setCategoryCustom] = useState("");
  const [trigger, setTrigger] = useState("after-day-3");
  const [appliesTo, setAppliesTo] = useState<string[]>([]);

  if (!open) return null;

  const mergedKnownCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...knownCategories]),
  );

  const handleSubmit = (publishNow: boolean) => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (departmentId === null) {
      setError("Department is required.");
      return;
    }
    const finalCategory =
      categoryMode === "custom" ? categoryCustom.trim() : categoryPreset;
    if (!finalCategory) {
      setError("Category is required.");
      return;
    }

    const fd = new FormData();
    fd.set("name", trimmedName);
    fd.set("department_id", String(departmentId));
    fd.set("category", finalCategory);
    fd.set("trigger", trigger);
    for (const t of appliesTo) fd.append("applies_to", t);
    if (publishNow) fd.set("publish", "1");

    startTransition(async () => {
      const result: ActionResult = await createWorkflow(null, fd);
      if (!result.ok) {
        setError(result.error ?? "Could not create workflow.");
        return;
      }
      // Navigate to the new workflow's detail page so HR/HOD can add steps
      onClose();
      if (result.workflowId) {
        router.push(`/dashboards/workflow-center/${result.workflowId}?edit=1`);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workflow-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <h2 id="create-workflow-title" className="text-base font-bold text-slate-900">
              Create Workflow
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Define the workflow shell. You can add steps after it&rsquo;s created.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 text-lg leading-none px-2"
          >
            ×
          </button>
        </header>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <Field label="Workflow Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Academy Induction — Tutor Track"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </Field>

          <Field label="Department" required hint={lockedDepartmentId !== null ? "Locked to your department." : undefined}>
            <select
              value={departmentId ?? ""}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              disabled={lockedDepartmentId !== null}
              required
              className={`w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                lockedDepartmentId !== null
                  ? "bg-slate-50 text-slate-600 border-slate-200 cursor-not-allowed"
                  : "bg-white border-slate-300"
              }`}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Category" required hint="Drives auto-assignment after Day 3 (Onboarding) or offboarding linkage.">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="radio"
                    name="cat-mode"
                    checked={categoryMode === "preset"}
                    onChange={() => setCategoryMode("preset")}
                  />
                  Pick from list
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="radio"
                    name="cat-mode"
                    checked={categoryMode === "custom"}
                    onChange={() => setCategoryMode("custom")}
                  />
                  Type custom (e.g. Probation, Training)
                </label>
              </div>
              {categoryMode === "preset" ? (
                <select
                  value={categoryPreset}
                  onChange={(e) => setCategoryPreset(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {mergedKnownCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={categoryCustom}
                  onChange={(e) => setCategoryCustom(e.target.value)}
                  placeholder="e.g. Probation"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          </Field>

          <Field label="Trigger">
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TRIGGER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Applies To" hint="Which employee types this workflow applies to.">
            <div className="flex flex-wrap gap-2">
              {APPLIES_TO_OPTIONS.map((t) => {
                const checked = appliesTo.includes(t);
                return (
                  <label key={t} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs cursor-pointer ${
                    checked
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setAppliesTo((prev) => [...prev, t]);
                        else setAppliesTo((prev) => prev.filter((x) => x !== t));
                      }}
                      className="sr-only"
                    />
                    {t}
                  </label>
                );
              })}
            </div>
          </Field>

          {error && (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={pending}
            className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save as Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={pending}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Save & Publish"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
      {hint && <span className="block mt-1 text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}
