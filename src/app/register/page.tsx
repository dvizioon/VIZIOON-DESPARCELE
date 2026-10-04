import { AuthStage } from "@/components/auth/auth-stage";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getRepositories } from "@/shared/infrastructure/container";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const { allowPublicSignup } = await getRepositories().admin.getSystemSettings();

  return (
    <AuthStage variant="register">
      <RegisterForm closed={!allowPublicSignup} />
    </AuthStage>
  );
}
