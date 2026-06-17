import ComingSoonPage from "@/app/components/ComingSoonPage";
import { LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "FA System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="FA System"
      Icon={LayoutDashboard}
      accent="bg-teal-600"
      trail={[{ label: "FA System" }]}
    />
  );
}
