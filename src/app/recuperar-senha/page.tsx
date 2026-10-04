import { AuthStage } from "@/components/auth/auth-stage";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";

export default function RecoverPasswordPage() {
  return (
    <AuthStage variant="recover">
      <ForgotPasswordForm />
    </AuthStage>
  );
}
