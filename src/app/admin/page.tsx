import { redirect } from "next/navigation";

/** Admin Console index — currently redirects to the only built admin page. */
export default function AdminIndexPage() {
  redirect("/admin/onboarding");
}
