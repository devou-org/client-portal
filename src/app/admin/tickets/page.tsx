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
import { ServiceRequest, User as UserType } from '@/types';
import { requestService, userService } from '@/lib/firebase-services';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function AdminTickets() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<Record<string, UserType>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
    
    // Set up real-time listener for requests
    const unsubscribe = requestService.onRequestsChange((updatedRequests) => {
      setRequests(updatedRequests);
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load requests and users in parallel
      const [allRequests, allUsers] = await Promise.all([
        requestService.getAllRequests(),
        userService.getAllUsers()
      ]);
      
      setRequests(allRequests);
      
      // Create a lookup map for users
      const userMap: Record<string, UserType> = {};
      allUsers.forEach(user => {
        userMap[user.uid] = user;
      });
      setUsers(userMap);
      
    } catch (error) {
      console.error('Error loading data:', error);
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

  const getUserName = (userId: string): string => {
    const user = users[userId];
    return user?.name || user?.email || 'Unknown User';
  };

  const filteredRequests = requests.filter(request => {
    const userName = getUserName(request.user_id);
    const matchesSearch = 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.request.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ticket Management</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage and track all service requests
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-4 sm:mb-6 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredRequests.length}</p>
                  </div>
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">To Do</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">{requestsByStatus.todo.length}</p>
                  </div>
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{requestsByStatus['in-progress'].length}</p>
                  </div>
                  <Play className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{requestsByStatus.done.length}</p>
                  </div>
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* To Do Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-600 text-sm sm:text-base">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>To Do ({requestsByStatus.todo.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {requestsByStatus.todo.map((request) => (
                    <Card key={request.uid} className="bg-orange-50 border-orange-200">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{request.name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.request}</p>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.description}</p>

                        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mb-3 space-y-1 sm:space-y-0">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span className="font-medium truncate">{getUserName(request.user_id)}</span>
                          </div>
                          {request.createdAt && (
                            <div className="flex items-center sm:ml-3">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="text-xs">{formatDate(request.createdAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {getStatusActions(request)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {requestsByStatus.todo.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">No tickets in To Do</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-600 text-sm sm:text-base">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>In Progress ({requestsByStatus['in-progress'].length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {requestsByStatus['in-progress'].map((request) => (
                    <Card key={request.uid} className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{request.name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.request}</p>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.description}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mb-3 space-y-1 sm:space-y-0">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span className="font-medium truncate">{getUserName(request.user_id)}</span>
                          </div>
                          {request.createdAt && (
                            <div className="flex items-center sm:ml-3">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="text-xs">{formatDate(request.createdAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {getStatusActions(request)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {requestsByStatus['in-progress'].length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">No tickets in progress</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Done Column */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600 text-sm sm:text-base">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Completed ({requestsByStatus.done.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {requestsByStatus.done.map((request) => (
                    <Card key={request.uid} className="bg-green-50 border-green-200">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{request.name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.request}</p>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.description}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mb-3 space-y-1 sm:space-y-0">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span className="font-medium truncate">{getUserName(request.user_id)}</span>
                          </div>
                          {request.createdAt && (
                            <div className="flex items-center sm:ml-3">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="text-xs">{formatDate(request.createdAt)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {getStatusActions(request)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {requestsByStatus.done.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">No completed tickets</p>
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