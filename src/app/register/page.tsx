import { AuthStage } from "@/components/auth/auth-stage";
import { RegisterForm } from "@/components/forms/auth-forms";

export default function RegisterPage() {
  return (
    <AuthStage variant="register">
      <RegisterForm />
    </AuthStage>
  );
}
