import ComingSoonPage from "@/app/components/ComingSoonPage";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Student List — PCM System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Student List"
      Icon={Users}
      accent="bg-rose-600"
      trail={[{ label: "PCM System", href: "/dashboards/pcm" }, { label: "Student List" }]}
    />
  );
}
