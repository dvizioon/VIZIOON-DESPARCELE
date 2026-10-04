import { AuthStage } from "@/components/auth/auth-stage";
import { LoginForm } from "@/components/forms/auth-forms";
import { getRepositories } from "@/shared/infrastructure/container";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; redefinida?: string; desativada?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, redefinida, desativada } = await searchParams;
  const settings = await getRepositories().admin.getSystemSettings();

  return (
    <AuthStage variant="login">
      <LoginForm
        allowSignup={settings.allowPublicSignup}
        callbackUrl={callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/workspaces"}
        disabledAccount={desativada === "1"}
        restored={redefinida === "1"}
      />
    </AuthStage>
  );
}
