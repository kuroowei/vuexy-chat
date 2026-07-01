import AuthLayout from '@/components/Auth/AuthLayout';
import ForgotPasswordForm from '@/components/Auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Forgot Password? 🔐" subtitle="No worries, we'll help you reset it">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
