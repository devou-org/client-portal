'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { projectService } from '@/lib/firebase-services';
import { Project } from '@/types';
import { Plus, Edit, Trash2, Eye, Calendar, User } from 'lucide-react';

export default function ProjectsPage() {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [user, isAdmin]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        // Admin sees all projects
        const allProjects = await projectService.getAllProjects();
        setProjects(allProjects);
      } else if (user) {
        // Client sees only their projects
        const userProjects = await projectService.getUserProjects(user.uid);
        setProjects(userProjects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!isAdmin) return;
    
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.deleteProject(projectId);
        await loadProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProject(null);
    loadProjects();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin ? 'Manage all projects' : 'View your projects'}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleCreateProject} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>

        {showForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectForm
                  project={editingProject}
                  onSuccess={handleFormSuccess}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingProject(null);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.uid} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.project_name}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {project.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Started: {new Date(project.start_date).toLocaleDateString()}
                  </div>
                  {project.end_date && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due: {new Date(project.end_date).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-2" />
                    Budget: ${project.budget?.toLocaleString() || 'Not set'}
                  </div>
                </div>

                <div className="flex justify-between">
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProject(project.uid)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {isAdmin ? 'No projects created yet' : 'No projects assigned to you yet'}
            </div>
            {isAdmin && (
              <Button onClick={handleCreateProject}>
                Create your first project
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
