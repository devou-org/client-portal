'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  const oobCode = searchParams?.get('oobCode');
  const mode = searchParams?.get('mode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setVerifying(false);
        setValidCode(false);
        return;
      }

      try {
        // Verify the password reset code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setValidCode(true);
      } catch (error: unknown) {
        console.error('Error verifying reset code:', error);
        setValidCode(false);
        toast({
          variant: "destructive",
          title: "Invalid Reset Link",
          description: "This password reset link is invalid or has expired. Please request a new one.",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode, mode, toast]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oobCode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid reset code. Please request a new password reset.",
      });
      return;
    }

    // Validate passwords
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Password Requirements Not Met",
        description: passwordErrors.join('. '),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      setPasswordReset(true);
      
      toast({
        variant: "success",
        title: "Password Reset Successful!",
        description: "Your password has been updated. You can now login with your new password.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      // Type guard to check if it's a Firebase error
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        
        if (firebaseError.code === 'auth/expired-action-code') {
          errorMessage = 'This reset link has expired. Please request a new password reset.';
        } else if (firebaseError.code === 'auth/invalid-action-code') {
          errorMessage = 'This reset link is invalid. Please request a new password reset.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        }
      }
      
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Verifying reset link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!validCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Invalid Reset Link
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                This password reset link is invalid or has expired.
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password" className="block">
                  <Button className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Password Reset Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Your password has been successfully updated for:
              </p>
              <p className="font-semibold text-gray-900 break-all">
                {email}
              </p>
              <p className="text-sm text-gray-500">
                You will be redirected to the login page automatically in a few seconds.
              </p>
              <Link href="/" className="block">
                <Button className="w-full">
                  Go to Login Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Password
          </h1>
          <p className="text-gray-600">
            for {email}
          </p>
        </div>
        
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Set Your New Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Password must contain:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• At least 8 characters</li>
                  <li>• One uppercase letter</li>
                  <li>• One lowercase letter</li>
                  <li>• One number</li>
                  <li>• One special character (!@#$%^&*)</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
