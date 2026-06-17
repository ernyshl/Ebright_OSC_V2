import ComingSoonPage from "@/app/components/ComingSoonPage";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events — PCM System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Events"
      Icon={CalendarDays}
      accent="bg-rose-600"
      trail={[{ label: "PCM System", href: "/dashboards/pcm" }, { label: "Events" }]}
    />
  );
}
