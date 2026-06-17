import ComingSoonPage from "@/app/components/ComingSoonPage";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — FA System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Reports"
      Icon={FileText}
      accent="bg-teal-600"
      trail={[{ label: "FA System", href: "/dashboards/fa" }, { label: "Reports" }]}
    />
  );
}
