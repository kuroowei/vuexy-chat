import AuthLayout from '@/components/Auth/AuthLayout';
import LoginForm from '@/components/Auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back! 👋" subtitle="Sign in to your account to continue">
      <LoginForm />
    </AuthLayout>
  );
}
