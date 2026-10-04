import Link from "next/link";
import { AppIcon } from "@/components/ui/icon";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="sheet text-center">
        <AppIcon name="tabler:map-off" className="mx-auto size-10 text-pine" />
        <h1 className="mt-4 font-display text-3xl">Página não encontrada</h1>
        <Link className="btn-primary mt-6" href="/workspaces">
          Voltar
        </Link>
      </div>
    </main>
  );
}
