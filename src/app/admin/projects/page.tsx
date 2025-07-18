'use client';

import { redirect } from 'next/navigation';

// Admin projects should redirect to the main projects page
// since we handle admin/client logic within the page itself
export default function AdminProjects() {
  redirect('/projects');
}
