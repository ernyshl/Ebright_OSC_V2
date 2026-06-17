import ComingSoonPage from "@/app/components/ComingSoonPage";
import { Mail } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invitations — PCM System" };

export default function Page() {
  return (
    <ComingSoonPage
      title="Invitations"
      Icon={Mail}
      accent="bg-rose-600"
      trail={[{ label: "PCM System", href: "/dashboards/pcm" }, { label: "Invitations" }]}
    />
  );
}
