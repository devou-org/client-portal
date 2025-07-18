'use client';

import { redirect } from 'next/navigation';

// Admin invoices should redirect to the main invoices page
// since we handle admin/client logic within the page itself
export default function AdminInvoices() {
  redirect('/invoices');
}
