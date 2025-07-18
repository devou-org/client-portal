'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

 return (
  <AuthGuard>
   <Layout>
    <ClientDashboard />
   </Layout>
  </AuthGuard>
 );
}
