import ComingSoonPage from "@/app/components/ComingSoonPage";
import { ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Attendance — PCM System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Attendance"
      Icon={ClipboardCheck}
      accent="bg-rose-600"
      trail={[{ label: "PCM System", href: "/dashboards/pcm" }, { label: "Attendance" }]}
    />
  );
}
