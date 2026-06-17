import ComingSoonPage from "@/app/components/ComingSoonPage";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Student List — FA System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Student List"
      Icon={Users}
      accent="bg-teal-600"
      trail={[{ label: "FA System", href: "/dashboards/fa" }, { label: "Student List" }]}
    />
  );
}
