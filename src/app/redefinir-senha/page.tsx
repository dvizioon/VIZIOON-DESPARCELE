import { AuthStage } from "@/components/auth/auth-stage";
import { ResetPasswordForm } from "@/components/forms/auth-forms";

type ResetPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPageProps) {
  const { token } = await searchParams;

  return (
    <AuthStage variant="recover">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-ink/60">Esse link está incompleto. Peça outro em recuperar senha.</p>
      )}
    </AuthStage>
  );
}
