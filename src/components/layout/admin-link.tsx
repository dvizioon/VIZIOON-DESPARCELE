import Link from "next/link";
import { AppIcon } from "@/components/ui/icon";

export function AdminLink() {
  return (
    <Link className="btn-ghost" href="/admin">
      <AppIcon name="tabler:shield-cog" className="size-4" />
      Admin
    </Link>
  );
}
