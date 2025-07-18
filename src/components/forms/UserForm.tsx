'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userService } from '@/lib/firebase-services';
import { User } from '@/types';

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        await userService.updateUser(user.uid, {
          name: formData.name,
          email: formData.email,
          isAdmin: formData.isAdmin,
        });
      } else {
        // Note: Creating new users typically requires Firebase Admin SDK
        // For now, we'll show a message about this limitation
        alert('Creating new users requires Firebase Admin SDK implementation. This would typically be done through a backend API.');
        onCancel();
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="Enter email address"
          disabled={!!user} // Disable email editing for existing users
        />
        {user && (
          <p className="text-sm text-gray-500 mt-1">
            Email cannot be changed for existing users
          </p>
        )}
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isAdmin}
            onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="text-sm font-medium text-gray-700">
            Admin privileges
          </span>
        </label>
        <p className="text-sm text-gray-500 mt-1">
          Admin users can manage all data and users
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </Button>
      </div>

      {!user && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Note about user creation
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Creating new users requires Firebase Admin SDK and would typically be handled by a backend API. 
                  In a production environment, you would implement user invitation flows with proper authentication setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
