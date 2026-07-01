import AuthLayout from '@/components/Auth/AuthLayout';
import ResetPasswordForm from '@/components/Auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Reset Password 🔐" subtitle="Create a new secure password">
      <ResetPasswordForm />
    </AuthLayout>
  );
}
