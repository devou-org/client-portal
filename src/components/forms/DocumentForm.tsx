'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { documentService, userService } from '@/lib/firebase-services';
import { Document, User } from '@/types';
import { Upload } from 'lucide-react';

interface DocumentFormProps {
  document?: Document | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DocumentForm({ document, onSuccess, onCancel }: DocumentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
  });
  const [users, setUsers] = useState<User[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    if (document) {
      setFormData({
        name: document.name,
        description: document.description || '',
        clientId: '', // We'll need to add this to the document type
      });
    }
  }, [document]);

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
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-fill name if not provided
      if (!formData.name) {
        const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, name: nameWithoutExtension }));
      }
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; size: number; type: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return {
      url: data.url,
      size: file.size,
      type: file.type,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For new documents, file is required
    if (!document && !file) {
      alert('Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      let fileInfo = document ? {
        url: document.file_link,
        size: document.file_size || 0,
        type: document.file_type || '',
      } : null;

      // Upload file if selected
      if (file) {
        setUploading(true);
        fileInfo = await uploadFile(file);
        setUploading(false);
      }

      const documentData = {
        name: formData.name,
        filename: file?.name || document?.filename || '',
        file_link: fileInfo?.url || '',
        file_size: fileInfo?.size,
        file_type: fileInfo?.type,
        description: formData.description || undefined,
      };

      if (document) {
        // Update existing document
        await documentService.updateDocument(document.uid, documentData);
      } else {
        // Create new document
        const documentId = await documentService.createDocument(documentData);
        
        // Assign document to client if selected
        if (formData.clientId) {
          await documentService.assignDocumentToUser(documentId, formData.clientId);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter document name"
        />
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
          placeholder="Enter document description"
        />
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
          {document ? 'Replace File (optional)' : 'Upload File *'}
        </label>
        <div className="flex items-center space-x-2">
          <Input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            required={!document}
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
          Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT (max 10MB)
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || uploading}>
          {uploading ? 'Uploading...' : loading ? 'Saving...' : document ? 'Update Document' : 'Upload Document'}
        </Button>
      </div>
    </form>
  );
}
