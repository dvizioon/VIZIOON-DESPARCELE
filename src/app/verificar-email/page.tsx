import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthStage } from "@/components/auth/auth-stage";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { confirmEmailVerificationAction } from "@/app/actions/auth";
import {
  EMAIL_VERIFY_GRACE_MS,
  isEmailVerified,
  mustVerifyEmail,
} from "@/modules/auth/domain/user";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { auth } from "@/auth";
import { requireUser } from "@/shared/auth/session";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  let tokenError: string | null = null;
  let verifiedByToken = false;

  if (token) {
    const result = await confirmEmailVerificationAction(token);
    if (result.error) {
      tokenError = result.error;
    } else {
      verifiedByToken = true;
    }
  }

  const session = await auth();

  if (verifiedByToken && session?.user?.id) {
    redirect("/workspaces");
  }

  if (!session?.user?.id) {
    return (
      <AuthStage variant="login">
        {verifiedByToken ? (
          <div className="sheet space-y-4">
            <h1 className="font-display text-3xl">E-mail confirmado</h1>
            <p className="text-sm text-ink/60">Entre na sua conta para continuar.</p>
            <Link className="btn-primary inline-flex" href="/login">
              Entrar
            </Link>
          </div>
        ) : (
          <div className="sheet space-y-4">
            <h1 className="font-display text-3xl">Verificar e-mail</h1>
            {tokenError ? (
              <p className="text-sm text-clay">{tokenError}</p>
            ) : (
              <p className="text-sm text-ink/60">
                Abra o link do e-mail ou entre na conta para reenviar a verificação.
              </p>
            )}
            <Link className="btn-primary inline-flex" href="/login">
              Entrar
            </Link>
          </div>
        )}
      </AuthStage>
    );
  }

  const user = await requireUser({ allowUnverified: true });
  if (isEmailVerified(user) || verifiedByToken) {
    redirect("/workspaces");
  }

  const stored = await new PrismaUserRepository().findById(user.id);
  const locked = stored ? mustVerifyEmail(stored) : true;
  const remainingMs = stored
    ? EMAIL_VERIFY_GRACE_MS - (Date.now() - stored.createdAt.getTime())
    : 0;
  const graceHoursLeft =
    !locked && remainingMs > 0 ? Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000))) : null;

  return (
    <AuthStage variant="login">
      <VerifyEmailPanel
        email={user.email}
        graceHoursLeft={graceHoursLeft}
        locked={locked}
        tokenError={tokenError}
        verified={false}
      />
    </AuthStage>
  );
}
