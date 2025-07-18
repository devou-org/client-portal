'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DocumentForm } from '@/components/forms/DocumentForm';
import { documentService } from '@/lib/firebase-services';
import { Document } from '@/types';
import { Plus, Edit, Trash2, Download, File, Calendar } from 'lucide-react';

export default function DocumentsPage() {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [user, isAdmin]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        // Admin sees all documents
        const allDocuments = await documentService.getAllDocuments();
        setDocuments(allDocuments);
      } else if (user) {
        // Client sees only their documents
        const userDocuments = await documentService.getUserDocuments(user.uid);
        setDocuments(userDocuments);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setShowForm(true);
  };

  const handleEditDocument = (document: Document) => {
    if (!isAdmin) return;
    setEditingDocument(document);
    setShowForm(true);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(documentId);
        await loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingDocument(null);
    loadDocuments();
  };

  const handleDownload = (doc: Document) => {
    console.log('Download requested for document:', doc);
    const fileUrl = doc.file_link;
    console.log('File URL:', fileUrl);
    
    if (fileUrl) {
      try {
        // Create a temporary anchor element to force download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = doc.filename || doc.name;
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
      console.error('No file URL available for document:', doc);
      alert('File URL not available for download');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin ? 'Manage all documents' : 'View your documents'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleCreateDocument} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Document
            </Button>
          )}
        </div>

        {showForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingDocument ? 'Edit Document' : 'Upload New Document'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentForm
                  document={editingDocument}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingDocument(null);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <Card key={document.uid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <File className="h-5 w-5 text-blue-600" />
                  {document.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>Filename:</strong> {document.filename}
                  </div>
                  
                  {document.file_type && (
                    <div className="text-sm text-gray-600">
                      <strong>Type:</strong> {document.file_type.toUpperCase()}
                    </div>
                  )}

                  {document.file_size && (
                    <div className="text-sm text-gray-600">
                      <strong>Size:</strong> {formatFileSize(document.file_size)}
                    </div>
                  )}

                  {document.createdAt && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(document.createdAt).toLocaleDateString()}
                    </div>
                  )}

                  {document.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {document.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(document)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDocument(document)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDocument(document.uid)}
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

        {documents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {isAdmin ? 'No documents uploaded yet' : 'No documents available'}
            </div>
            {isAdmin && (
              <Button onClick={handleCreateDocument}>
                Upload your first document
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
