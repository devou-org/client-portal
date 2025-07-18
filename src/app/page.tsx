'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Home() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isAdmin, loading, router]);

  // Show login form if not authenticated
  if (!loading && !user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Welcome to Client Portal
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Please sign in to access your dashboard
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  // This will trigger the useEffect redirect above
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Redirecting...</h2>
        </div>
      </div>
    </Layout>
  );
}