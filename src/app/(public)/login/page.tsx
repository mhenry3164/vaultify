'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { AuthProvider } from '@/hooks/useAuth';

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}