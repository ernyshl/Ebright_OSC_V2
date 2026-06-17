import ComingSoonPage from "@/app/components/ComingSoonPage";
import { LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "PCM System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="PCM System"
      Icon={LayoutDashboard}
      accent="bg-rose-600"
      trail={[{ label: "PCM System" }]}
    />
  );
}
