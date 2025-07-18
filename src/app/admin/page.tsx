'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  CreditCard, 
  FileText, 
  MessageSquare,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  User,
  Project, 
  Invoice, 
  Document, 
  ServiceRequest 
} from '@/types';
import { 
  userService,
  projectService,
  invoiceService,
  documentService,
  requestService
} from '@/lib/firebase-services';
import { formatCurrency, getStatusColor } from '@/lib/utils';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
    
    // Set up real-time listener for requests
    const unsubscribe = requestService.onRequestsChange((updatedRequests) => {
      setRequests(updatedRequests);
    });

    return unsubscribe;
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [
        allUsers,
        allProjects,
        allInvoices,
        allDocuments,
        allRequests
      ] = await Promise.all([
        userService.getAllUsers(),
        projectService.getAllProjects(),
        invoiceService.getAllInvoices(),
        documentService.getAllDocuments(),
        requestService.getAllRequests()
      ]);

      setUsers(allUsers);
      setProjects(allProjects);
      setInvoices(allInvoices);
      setDocuments(allDocuments);
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: ServiceRequest['status']) => {
    try {
      await requestService.updateRequest(requestId, { status: newStatus });
      // Real-time listener will update the state automatically
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  if (loading) {
    return (
      <AuthGuard requireAdmin>
        <Layout>
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
        </Layout>
      </AuthGuard>
    );
  }

  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const pendingRequests = requests.filter(r => r.status === 'todo' || r.status === 'in-progress').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  const requestsByStatus = {
    todo: requests.filter(r => r.status === 'todo'),
    'in-progress': requests.filter(r => r.status === 'in-progress'),
    done: requests.filter(r => r.status === 'done'),
  };

  return (
    <AuthGuard requireAdmin>
      <Layout>
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
                  </div>
                  <FolderOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingRequests}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Ticket Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
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
                          <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
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

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Projects</span>
                    <span className="font-medium">{projects.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Invoices</span>
                    <span className="font-medium">{invoices.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Documents</span>
                    <span className="font-medium">{documents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Requests</span>
                    <span className="font-medium">{requests.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Ticket Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* To Do */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    To Do ({requestsByStatus.todo.length})
                  </h4>
                  <div className="space-y-2">
                    {requestsByStatus.todo.slice(0, 3).map((request) => (
                      <div key={request.uid} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">{request.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{request.request}</p>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRequestStatus(request.uid, 'in-progress')}
                            className="text-xs"
                          >
                            Start
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRequestStatus(request.uid, 'done')}
                            className="text-xs"
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* In Progress */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    In Progress ({requestsByStatus['in-progress'].length})
                  </h4>
                  <div className="space-y-2">
                    {requestsByStatus['in-progress'].slice(0, 3).map((request) => (
                      <div key={request.uid} className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium text-sm">{request.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{request.request}</p>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRequestStatus(request.uid, 'todo')}
                            className="text-xs"
                          >
                            Move to Todo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRequestStatus(request.uid, 'done')}
                            className="text-xs"
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Done */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Completed ({requestsByStatus.done.length})
                  </h4>
                  <div className="space-y-2">
                    {requestsByStatus.done.slice(0, 3).map((request) => (
                      <div key={request.uid} className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-sm">{request.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{request.request}</p>
                        <Badge className={getStatusColor(request.status)} >
                          Completed
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  );
}
