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
      console.log('Auth instance:', auth);
      console.log('Auth currentUser:', auth.currentUser);
      
      // Send Firebase password reset email directly - Firebase will handle user existence check
      await sendPasswordResetEmail(auth, email);
      
      console.log('Password reset email sent successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Password reset email sent successfully to your Gmail account'
      });

    } catch (firebaseError: any) {
      console.error('Firebase password reset error:', firebaseError);
      console.error('Error code:', firebaseError.code);
      console.error('Error message:', firebaseError.message);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/user-not-found') {
        console.log('Firebase Auth: User not found');
        return NextResponse.json(
          { error: 'No account found with this email address. Please contact administrator for account creation.' },
          { status: 404 }
        );
      }
      
      if (firebaseError.code === 'auth/invalid-email') {
        console.log('Firebase Auth: Invalid email');
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        );
      }

      if (firebaseError.code === 'auth/too-many-requests') {
        console.log('Firebase Auth: Too many requests');
        return NextResponse.json(
          { error: 'Too many reset attempts. Please try again later.' },
          { status: 429 }
        );
      }

      console.log('Firebase Auth: Generic error, returning 500');
      return NextResponse.json(
        { error: `Failed to send password reset email: ${firebaseError.message}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
