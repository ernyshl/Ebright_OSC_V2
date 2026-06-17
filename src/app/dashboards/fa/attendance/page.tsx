import ComingSoonPage from "@/app/components/ComingSoonPage";
import { ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Attendance — FA System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Attendance"
      Icon={ClipboardCheck}
      accent="bg-teal-600"
      trail={[{ label: "FA System", href: "/dashboards/fa" }, { label: "Attendance" }]}
    />
  );
}
