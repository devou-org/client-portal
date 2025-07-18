'use client';

import { redirect } from 'next/navigation';

// Admin documents should redirect to the main documents page
// since we handle admin/client logic within the page itself
export default function AdminDocuments() {
  redirect('/documents');
}
