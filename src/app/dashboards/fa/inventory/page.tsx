import ComingSoonPage from "@/app/components/ComingSoonPage";
import { Boxes } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory — FA System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Inventory"
      Icon={Boxes}
      accent="bg-teal-600"
      trail={[{ label: "FA System", href: "/dashboards/fa" }, { label: "Inventory" }]}
    />
  );
}
