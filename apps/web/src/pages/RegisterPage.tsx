import AuthLayout from '@/components/Auth/AuthLayout';
import RegisterForm from '@/components/Auth/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout title="Create an account 🚀" subtitle="Start your journey with Vuexy Chat">
      <RegisterForm />
    </AuthLayout>
  );
}
