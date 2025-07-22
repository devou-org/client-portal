'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvoiceForm } from '@/components/forms/InvoiceForm';
import { invoiceService } from '@/lib/firebase-services';
import { Invoice } from '@/types';
import { Plus, Edit, Trash2, Download, DollarSign, Calendar } from 'lucide-react';

export default function InvoicesPage() {
  const { user, isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        // Admin sees all invoices
        const allInvoices = await invoiceService.getAllInvoices();
        setInvoices(allInvoices);
      } else if (user) {
        // Client sees only their invoices
        const userInvoices = await invoiceService.getUserInvoices(user.uid);
        setInvoices(userInvoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    loadInvoices();
  }, [user, isAdmin, loadInvoices]);

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setShowForm(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    if (!isAdmin) return;
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.deleteInvoice(invoiceId);
        await loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingInvoice(null);
    loadInvoices();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'due': return 'bg-orange-100 text-orange-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (invoice: Invoice) => {
    console.log('Download requested for invoice:', invoice);
    const fileUrl = invoice.fileUrl || invoice.file_link;
    console.log('File URL:', fileUrl);
    
    if (fileUrl) {
      try {
        // Create a temporary anchor element to force download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = invoice.invoice_name || `invoice-${invoice.uid}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Error downloading file. Please try again.');
      }
    } else {
      console.error('No file URL available for invoice:', invoice);
      alert('File URL not available for download');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-600 mt-1">
                {isAdmin ? 'Manage all invoices' : 'View your invoices'}
              </p>
            </div>
          {isAdmin && (
            <Button onClick={handleCreateInvoice} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          )}
        </div>

        {showForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InvoiceForm
                  invoice={editingInvoice}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingInvoice(null);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => {
            // Debug log to see invoice structure
            console.log('Invoice data:', invoice);
            console.log('Invoice file_link:', invoice.file_link);
            console.log('Invoice fileUrl:', invoice.fileUrl);
            
            return (
            <Card key={invoice.uid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {invoice.invoice_name || `Invoice #${invoice.uid.slice(-6)}`}
                  </CardTitle>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-lg font-semibold text-green-600">
                    ₹{invoice.amount.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due: {(invoice.dueDate || invoice.due_date)
                      ? new Date(
                          typeof invoice.dueDate !== 'undefined'
                            ? invoice.dueDate
                            : invoice.due_date!
                        ).toLocaleDateString()
                      : 'Not set'}
                  </div>

                  {invoice.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {invoice.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {(invoice.fileUrl || invoice.file_link) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(invoice)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteInvoice(invoice.uid)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {isAdmin ? 'No invoices created yet' : 'No invoices available'}
            </div>
            {isAdmin && (
              <Button onClick={handleCreateInvoice}>
                Create your first invoice
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
    </AuthGuard>
  );
}
