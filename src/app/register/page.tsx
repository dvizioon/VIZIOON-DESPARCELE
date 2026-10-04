import { AuthStage } from "@/components/auth/auth-stage";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getRepositories } from "@/shared/infrastructure/container";

export default async function RegisterPage() {
  const settings = await getRepositories().admin.getSystemSettings();

  return (
    <AuthStage variant="register">
      <RegisterForm closed={!settings.allowPublicSignup} />
    </AuthStage>
  );
}
