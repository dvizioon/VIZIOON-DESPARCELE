import { AuthStory, type AuthStoryVariant } from "@/components/auth/auth-story";
import { LogoMark } from "@/components/brand/logo";

export function AuthStage({
  variant,
  children,
}: {
  variant: AuthStoryVariant;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden bg-[#0B4038] lg:block">
        <AuthStory variant={variant} />
      </aside>
      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="size-14 shrink-0" />
            <div>
              <p className="font-display text-2xl tracking-wide">Desparcele</p>
              <p className="text-sm text-ink/55">Parcelas no controle</p>
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
