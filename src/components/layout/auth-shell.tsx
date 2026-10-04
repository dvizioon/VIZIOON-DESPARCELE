import { LogoMark } from "@/components/brand/logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-8 flex items-center gap-3">
        <LogoMark className="size-16 shrink-0" />
        <div>
          <p className="font-display text-2xl tracking-wide">Desparcele</p>
          <p className="text-sm text-ink/55">Parcelas no controle</p>
        </div>
      </div>
      <section className="sheet">
        <h1 className="font-display text-3xl leading-tight">{title}</h1>
        <p className="mt-2 mb-6 text-ink/65">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
