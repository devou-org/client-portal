'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  CreditCard, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  Project, 
  Invoice, 
  Document, 
  ServiceRequest, 
  PaymentSummary 
} from '@/types';
import { 
  projectService,
  invoiceService,
  documentService,
  requestService
} from '@/lib/firebase-services';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

export function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [
        userProjects,
        userInvoices,
        userDocuments,
        userRequests,
        summary
      ] = await Promise.all([
        projectService.getUserProjects(user.uid),
        invoiceService.getUserInvoices(user.uid),
        documentService.getUserDocuments(user.uid),
        requestService.getUserRequests(user.uid),
        invoiceService.getPaymentSummary(user.uid)
      ]);

      setProjects(userProjects);
      setInvoices(userInvoices);
      setDocuments(userDocuments);
      setRequests(userRequests);
      setPaymentSummary(summary);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const pendingRequests = requests.filter(r => r.status === 'todo' || r.status === 'in-progress').length;
  const recentDocuments = documents.slice(0, 5);
  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {paymentSummary ? formatCurrency(paymentSummary.totalPaid) : '$0'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {paymentSummary ? formatCurrency(paymentSummary.pending + paymentSummary.due) : '$0'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Requests</p>
                <p className="text-2xl font-bold text-orange-600">{pendingRequests}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5" />
              <span>Recent Projects</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{project.project_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(project.start_date)} - {formatDate(project.end_date)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Recent Invoices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoice_name}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDocuments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No documents yet</p>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((document) => (
                  <div key={document.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{document.name}</p>
                      <p className="text-sm text-gray-500">{document.filename}</p>
                    </div>
                    <a
                      href={document.file_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Service Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Recent Service Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No service requests yet</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{request.name}</p>
                      <p className="text-sm text-gray-500">{request.request}</p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      {paymentSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Payment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-600">Total Paid</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(paymentSummary.totalPaid)}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-xl font-bold text-yellow-700">
                  {formatCurrency(paymentSummary.pending)}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-600">Due</p>
                <p className="text-xl font-bold text-orange-700">
                  {formatCurrency(paymentSummary.due)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-600">Overdue</p>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency(paymentSummary.overdue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
