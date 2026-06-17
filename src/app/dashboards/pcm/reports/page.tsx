import ComingSoonPage from "@/app/components/ComingSoonPage";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — PCM System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Reports"
      Icon={FileText}
      accent="bg-rose-600"
      trail={[{ label: "PCM System", href: "/dashboards/pcm" }, { label: "Reports" }]}
    />
  );
}
