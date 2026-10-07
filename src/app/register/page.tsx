import { redirect } from "next/navigation";
import { AuthStage } from "@/components/auth/auth-stage";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getRepositories } from "@/shared/infrastructure/container";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const settings = await getRepositories().admin.getSystemSettings();
  if (!settings.allowPublicSignup) {
    redirect("/login?callbackUrl=%2Fregister");
  }

  return (
    <AuthStage variant="register">
      <RegisterForm fields={settings.signupFields} />
    </AuthStage>
  );
}
