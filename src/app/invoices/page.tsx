'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

  useEffect(() => {
    loadInvoices();
  }, [user, isAdmin]);

  const loadInvoices = async () => {
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
  };

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
    if (invoice.fileUrl) {
      window.open(invoice.fileUrl, '_blank');
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
          {invoices.map((invoice) => (
            <Card key={invoice.uid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Invoice #{invoice.invoiceNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-lg font-semibold text-green-600">
                    <DollarSign className="h-5 w-5 mr-1" />
                    ${invoice.amount.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'}
                  </div>

                  {invoice.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {invoice.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {invoice.fileUrl && (
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
          ))}
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
  );
}
