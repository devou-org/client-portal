import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    try {
      console.log('Attempting to send password reset email to:', email);
      
      // Send Firebase password reset email directly
      await sendPasswordResetEmail(auth, email, {
        url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
        handleCodeInApp: false,
      });
      
      console.log('Password reset email sent successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Password reset email sent successfully to your Gmail account'
      });

    } catch (firebaseError: unknown) {
      console.error('Firebase password reset error:', firebaseError);
      
      // Type guard to check if it's a Firebase error
      if (firebaseError && typeof firebaseError === 'object' && 'code' in firebaseError && 'message' in firebaseError) {
        const error = firebaseError as { code: string; message: string };
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/user-not-found') {
          console.log('Firebase Auth: User not found');
          return NextResponse.json(
            { error: 'No account found with this email address. Please contact administrator for account creation.' },
            { status: 404 }
          );
        }
        
        if (error.code === 'auth/invalid-email') {
          console.log('Firebase Auth: Invalid email');
          return NextResponse.json(
            { error: 'Invalid email address format' },
            { status: 400 }
          );
        }

        if (error.code === 'auth/too-many-requests') {
          console.log('Firebase Auth: Too many requests');
          return NextResponse.json(
            { error: 'Too many reset attempts. Please try again later.' },
            { status: 429 }
          );
        }

        if (error.code === 'auth/missing-continue-uri') {
          console.log('Firebase Auth: Missing continue URI');
          // Try without the continue URL
          try {
            await sendPasswordResetEmail(auth, email);
            return NextResponse.json({ 
              success: true, 
              message: 'Password reset email sent successfully to your Gmail account'
            });
          } catch (retryError: unknown) {
            console.error('Retry failed:', retryError);
            const retryMessage = retryError instanceof Error ? retryError.message : 'Unknown error occurred';
            return NextResponse.json(
              { error: `Failed to send password reset email: ${retryMessage}` },
              { status: 500 }
            );
          }
        }

        console.log('Firebase Auth: Generic error, returning 500');
        return NextResponse.json(
          { error: `Failed to send password reset email: ${error.message}` },
          { status: 500 }
        );
      }

      // Fallback for unknown error types
      console.log('Firebase Auth: Unknown error type, returning 500');
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
