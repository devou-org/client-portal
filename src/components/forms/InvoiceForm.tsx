'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { invoiceService, userService } from '@/lib/firebase-services';
import { Invoice, User } from '@/types';
import { Upload } from 'lucide-react';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    status: 'pending',
    description: '',
    clientId: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber || invoice.invoice_name,
        amount: invoice.amount.toString(),
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : (invoice.due_date ? invoice.due_date.toISOString().split('T')[0] : ''),
        status: invoice.status,
        description: invoice.description || '',
        clientId: invoice.clientId || '',
      });
    } else {
      // Generate invoice number for new invoice
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `INV-${Date.now()}`,
      }));
    }
  }, [invoice]);

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      const clients = allUsers.filter(user => !user.isAdmin);
      setUsers(clients);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    console.log('=== INVOICE FILE UPLOAD STARTED ===');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'invoices');

    console.log('Sending upload request...');
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Upload API response:', data);
    
    if (!data.success || !data.data?.url) {
      console.error('Upload response missing URL:', data);
      throw new Error('Upload failed - no URL in response');
    }

    console.log('Upload successful, URL:', data.data.url);
    console.log('=== INVOICE FILE UPLOAD COMPLETED ===');
    
    return data.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileUrl = invoice?.fileUrl || invoice?.file_link;

      // Upload file if selected
      if (file) {
        console.log('Uploading invoice file:', file.name);
        setUploading(true);
        fileUrl = await uploadFile(file);
        console.log('Invoice file upload result:', fileUrl);
        setUploading(false);
      }

      const invoiceData = {
        invoice_name: formData.invoiceNumber,
        amount: parseFloat(formData.amount),
        due_date: new Date(formData.dueDate),
        status: formData.status as 'pending' | 'paid' | 'due' | 'overdue',
        description: formData.description || undefined,
        clientId: formData.clientId || undefined,
        file_link: fileUrl || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Invoice data to save:', invoiceData);
      console.log('File link value:', invoiceData.file_link);

      if (invoice) {
        // Update existing invoice
        await invoiceService.updateInvoice(invoice.uid, invoiceData);
      } else {
        // Create new invoice
        const invoiceId = await invoiceService.createInvoice(invoiceData);
        
        // Assign invoice to client if selected
        if (formData.clientId) {
          await invoiceService.assignInvoiceToUser(invoiceId, formData.clientId);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Number *
          </label>
          <Input
            type="text"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            required
            placeholder="INV-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($) *
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <option value="pending">Pending</option>
            <option value="due">Due</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign to Client
        </label>
        <select
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <option value="">Select a client</option>
          {users.map((user) => (
            <option key={user.uid} value={user.uid}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          placeholder="Enter invoice description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload Invoice File
        </label>
        <div className="flex items-center space-x-2">
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="flex-1"
          />
          {file && (
            <div className="flex items-center text-sm text-gray-600">
              <Upload className="h-4 w-4 mr-1" />
              {file.name}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10MB)
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {uploading ? 'Uploading...' : loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
