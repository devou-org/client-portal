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
    password: '',
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Password not needed for updates
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
        // Create new user via API
        if (!formData.password) {
          alert('Password is required for new users');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.isAdmin ? 'admin' : 'client',
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create user');
        }

        alert('User created successfully!');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.message || 'Error saving user. Please try again.');
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

      {!user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Enter password (min. 6 characters)"
            minLength={6}
          />
          <p className="text-sm text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>
      )}

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
    </form>
  );
}
