'use client';

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare,
  Search,
  Filter,
  Clock,
  Play,
  CheckCircle,
  User,
  Calendar,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { ServiceRequest } from '@/types';
import { requestService } from '@/lib/firebase-services';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function AdminTickets() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadRequests();
    
    // Set up real-time listener for requests
    const unsubscribe = requestService.onRequestsChange((updatedRequests) => {
      setRequests(updatedRequests);
    });

    return () => unsubscribe();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await requestService.getAllRequests();
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
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

  const deleteRequest = async (requestId: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await requestService.deleteRequest(requestId);
        // Real-time listener will update the state automatically
      } catch (error) {
        console.error('Error deleting request:', error);
      }
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.email && request.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const requestsByStatus = {
    todo: filteredRequests.filter(r => r.status === 'todo'),
    'in-progress': filteredRequests.filter(r => r.status === 'in-progress'),
    done: filteredRequests.filter(r => r.status === 'done'),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <Play className="h-4 w-4" />;
      case 'done': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusActions = (request: ServiceRequest) => {
    const actions = [];
    
    if (request.status !== 'in-progress') {
      actions.push(
        <Button
          key="start"
          size="sm"
          variant="outline"
          onClick={() => updateRequestStatus(request.uid, 'in-progress')}
          className="text-xs"
        >
          <Play className="h-3 w-3 mr-1" />
          Start
        </Button>
      );
    }
    
    if (request.status !== 'done') {
      actions.push(
        <Button
          key="complete"
          size="sm"
          variant="outline"
          onClick={() => updateRequestStatus(request.uid, 'done')}
          className="text-xs bg-green-50 text-green-700 hover:bg-green-100"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Complete
        </Button>
      );
    }
    
    if (request.status !== 'todo') {
      actions.push(
        <Button
          key="todo"
          size="sm"
          variant="outline"
          onClick={() => updateRequestStatus(request.uid, 'todo')}
          className="text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          To Do
        </Button>
      );
    }

    actions.push(
      <Button
        key="delete"
        size="sm"
        variant="destructive"
        onClick={() => deleteRequest(request.uid)}
        className="text-xs"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Delete
      </Button>
    );

    return actions;
  };

  if (loading) {
    return (
      <AuthGuard requireAdmin>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireAdmin>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Management</h1>
              <p className="text-gray-600 mt-1">
                Manage and track all service requests
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search tickets by name, email, or request..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">To Do</p>
                    <p className="text-2xl font-bold text-orange-600">{requestsByStatus.todo.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{requestsByStatus['in-progress'].length}</p>
                  </div>
                  <Play className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{requestsByStatus.done.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* To Do Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  <span>To Do ({requestsByStatus.todo.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {requestsByStatus.todo.map((request) => (
                    <Card key={request.uid} className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900">{request.name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">{request.request}</p>
                        
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <User className="h-3 w-3 mr-1" />
                          {request.email || request.user_id}
                          {request.createdAt && (
                            <>
                              <Calendar className="h-3 w-3 ml-3 mr-1" />
                              {formatDate(request.createdAt)}
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {getStatusActions(request)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {requestsByStatus.todo.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No tickets in To Do</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-600">
                  <Play className="h-5 w-5" />
                  <span>In Progress ({requestsByStatus['in-progress'].length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {requestsByStatus['in-progress'].map((request) => (
                    <Card key={request.uid} className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900">{request.name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">{request.request}</p>
                        
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <User className="h-3 w-3 mr-1" />
                          {request.email || request.user_id}
                          {request.createdAt && (
                            <>
                              <Calendar className="h-3 w-3 ml-3 mr-1" />
                              {formatDate(request.createdAt)}
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {getStatusActions(request)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {requestsByStatus['in-progress'].length === 0 && (
                    <p className="text-center text-gray-500 py-4">No tickets in progress</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Done Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Completed ({requestsByStatus.done.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {requestsByStatus.done.map((request) => (
                    <Card key={request.uid} className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900">{request.name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">{request.request}</p>
                        
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <User className="h-3 w-3 mr-1" />
                          {request.email || request.user_id}
                          {request.createdAt && (
                            <>
                              <Calendar className="h-3 w-3 ml-3 mr-1" />
                              {formatDate(request.createdAt)}
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {getStatusActions(request)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {requestsByStatus.done.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No completed tickets</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
