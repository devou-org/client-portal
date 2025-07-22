'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface ForgotPasswordFormProps {
  onBack?: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      setSubmitted(true);
      toast({
        variant: "success",
        title: "Reset Email Sent!",
        description: "Check your Gmail for password reset instructions.",
      });

    } catch (error: unknown) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Check Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-gray-600">
              We&apos;ve sent password reset instructions to your Gmail:
            </p>
            <p className="font-semibold text-gray-900 break-all">
              {email}
            </p>
            <p className="text-sm text-gray-500">
              Check your Gmail inbox (including spam folder) for the reset link. The link will expire in 1 hour for security.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mt-4">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong>
                <br />
                1. Click the reset link in your Gmail
                <br />
                2. Create a new password
                <br />
                3. Back to the login page
              </p>
            </div>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => {
                setSubmitted(false);
                setEmail('');
                setError(null); // Clear error when trying different email
              }}
              variant="outline" 
              className="w-full"
            >
              Try Different Email
            </Button>
            
            {onBack ? (
             <Link href="/" className="block">
               <Button  variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
               </Button>
             </Link>
            ) : (
              <Link href="/" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Forgot Password?
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Enter your registered email address and we&apos;ll send password reset instructions to your Gmail account.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Registered Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your registered Gmail address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null); // Clear error when user types
              }}
              required
              disabled={loading}
              className="w-full"
            />
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p>{error}</p>
                    {error.includes('contact administrator') && (
                      <div className="mt-2">
                        <a 
                          href="mailto:info@devou.in?subject=Account Creation Request&body=Hello, I would like to request an account for the Client Portal. My email address is: "
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Contact Administrator
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Reset Email...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Reset Email
              </>
            )}
          </Button>
          
          <div className="text-center">
            {onBack ? (
              <Button onClick={onBack} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
