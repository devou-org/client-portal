'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { ServiceRequestForm } from '@/components/forms/ServiceRequestForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServiceRequest } from '@/types';
import { requestService } from '@/lib/firebase-services';
import { formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils';
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRequests();
      
      // Set up real-time listener
      const unsubscribe = requestService.onUserRequestsChange(user.uid, (updatedRequests) => {
        setRequests(updatedRequests);
      });

      return unsubscribe;
    }
  }, [user, loadRequests]);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userRequests = await requestService.getUserRequests(user.uid);
      setRequests(userRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'todo':
        return <Clock className="h-4 w-4" />;
      case 'in-progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'done':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const groupedRequests = {
    todo: requests.filter(r => r.status === 'todo'),
    'in-progress': requests.filter(r => r.status === 'in-progress'),
    done: requests.filter(r => r.status === 'done'),
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-4 sm:space-y-6">
          <ServiceRequestForm onSuccess={loadRequests} />

          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* To Do Column */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
                  To Do ({groupedRequests.todo.length})
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {groupedRequests.todo.map((request) => (
                    <Card key={request.uid} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2 flex-1">{request.name}</h4>
                          {request.priority && (
                            <Badge className={`${getPriorityColor(request.priority)} ml-2 flex-shrink-0 text-xs`}>
                              {request.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{request.request}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2">{request.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 text-xs">{request.status}</span>
                          </Badge>
                          {request.createdAt && (
                            <span className="text-xs text-gray-400">
                              {formatDateTime(request.createdAt)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {groupedRequests.todo.length === 0 && (
                    <div className="text-center text-gray-500 py-6 sm:py-8 text-sm">
                      No pending requests
                    </div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  In Progress ({groupedRequests['in-progress'].length})
                </h3>
                <div className="space-y-4">
                  {groupedRequests['in-progress'].map((request) => (
                    <Card key={request.uid} className="hover:shadow-md transition-shadow border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{request.name}</h4>
                          {request.priority && (
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.request}</p>
                        <p className="text-sm text-gray-500 mb-3">{request.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </Badge>
                          {request.updatedAt && (
                            <span className="text-xs text-gray-400">
                              Updated: {formatDateTime(request.updatedAt)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {groupedRequests['in-progress'].length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No requests in progress
                    </div>
                  )}
                </div>
              </div>

              {/* Done Column */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                  Completed ({groupedRequests.done.length})
                </h3>
                <div className="space-y-4">
                  {groupedRequests.done.map((request) => (
                    <Card key={request.uid} className="hover:shadow-md transition-shadow border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{request.name}</h4>
                          {request.priority && (
                            <Badge className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.request}</p>
                        <p className="text-sm text-gray-500 mb-3">{request.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </Badge>
                          {request.updatedAt && (
                            <span className="text-xs text-gray-400">
                              Completed: {formatDateTime(request.updatedAt)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {groupedRequests.done.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No completed requests
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && requests.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Requests</h3>
                <p className="text-gray-500">
                  You haven&apos;t submitted any service requests yet. Use the form above to submit your first request.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
