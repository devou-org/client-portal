'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Layout>
        <ClientDashboard />
      </Layout>
    </AuthGuard>
  );
}
