'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserForm } from '@/components/forms/UserForm';
import { userService, projectService, invoiceService, documentService, requestService } from '@/lib/firebase-services';
import { User } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  User as UserIcon, 
  Mail, 
  Calendar, 
  FolderOpen, 
  CreditCard, 
  FileText, 
  MessageSquare,
  Shield,
  Users as UsersIcon,
  RefreshCw
} from 'lucide-react';

interface UserStats {
  projects: number;
  invoices: number;
  documents: number;
  requests: number;
}

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
      await loadUserStats(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userList: User[]) => {
    try {
      setLoadingStats(true);
      const stats: Record<string, UserStats> = {};

      for (const user of userList) {
        if (!user.isAdmin) { // Only get stats for clients
          const [projects, invoices, documents, requests] = await Promise.all([
            projectService.getUserProjects(user.uid),
            invoiceService.getUserInvoices(user.uid),
            documentService.getUserDocuments(user.uid),
            requestService.getUserRequests(user.uid),
          ]);

          stats[user.uid] = {
            projects: projects.length,
            invoices: invoices.length,
            documents: documents.length,
            requests: requests.length,
          };
        } else {
          stats[user.uid] = {
            projects: 0,
            invoices: 0,
            documents: 0,
            requests: 0,
          };
        }
      }

      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.uid) {
      alert('You cannot delete your own account');
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this user? This will remove them from the database. ' +
      'Make sure to also delete them from Firebase Authentication console for complete removal.'
    );

    if (confirmDelete) {
      try {
        await userService.deleteUserAndCleanup(userId);
        loadUsers(); // Refresh the user list
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(null);
    loadUsers();
  };

  const getTotalStats = () => {
    const totals = {
      totalUsers: users.length,
      totalClients: users.filter(u => !u.isAdmin).length,
      totalAdmins: users.filter(u => u.isAdmin).length,
    };
    return totals;
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to view this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  const stats = getTotalStats();

  return (
    <AuthGuard requireAdmin>
      <Layout>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all users and their permissions</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={loadUsers} 
              variant="outline" 
              className="flex items-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleCreateUser} className="flex items-center gap-2 text-xs sm:text-sm" size="sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalClients}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalAdmins}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 sm:mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">User Management Information</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Register users:</strong> Create accounts in Firebase Authentication console</p>
                  <p>• <strong>User login:</strong> Users login with email/password (provide name on first login)</p>
                  <p>• <strong>Complete removal:</strong> Delete from both this panel AND Firebase Authentication</p>
                  <p>• <strong>Admin detection:</strong> Based on email address in admin list</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UserForm
                  user={editingUser}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Projects</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Invoices</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Documents</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Requests</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 rounded-full mr-3">
                            <UserIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {user.isAdmin ? 'Admin' : 'Client'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FolderOpen className="h-4 w-4 mr-1" />
                          {loadingStats ? '...' : userStats[user.uid]?.projects || 0}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <CreditCard className="h-4 w-4 mr-1" />
                          {loadingStats ? '...' : userStats[user.uid]?.invoices || 0}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="h-4 w-4 mr-1" />
                          {loadingStats ? '...' : userStats[user.uid]?.documents || 0}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          {loadingStats ? '...' : userStats[user.uid]?.requests || 0}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {user.uid !== currentUser?.uid && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.uid)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">No users found</div>
                <Button onClick={handleCreateUser}>
                  Add your first user
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  </AuthGuard>
  );
}
