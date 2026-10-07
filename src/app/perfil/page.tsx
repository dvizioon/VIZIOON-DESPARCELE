import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { ProfileForm } from "@/components/profile/profile-form";
import { AppIcon } from "@/components/ui/icon";
import { requireUser } from "@/shared/auth/session";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <Reveal className="mx-auto min-h-screen w-full max-w-xl space-y-5 px-4 py-6 sm:px-5 sm:py-10">
      <div className="flex items-center gap-3" data-reveal>
        <Link className="btn-ghost" href="/workspaces">
          <AppIcon className="size-4" name="tabler:arrow-left" />
          Espaços
        </Link>
      </div>
      <div data-reveal>
        <h1 className="font-display text-4xl">Meu perfil</h1>
        <p className="mt-1 text-sm text-ink/55">Telefone, senha e encerrar conta.</p>
      </div>
      <ProfileForm
        avatarUrl={user.avatarUrl}
        avatarVariant={user.avatarVariant}
        email={user.email}
        name={user.name}
        phone={user.phone}
      />
    </Reveal>
  );
}
