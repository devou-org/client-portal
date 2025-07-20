import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = 'client' } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      name: name,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photoURL: null,
      // Initialize empty arrays for references
      projects: [],
      invoices: [],
      documents: [],
      requests: []
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        uid: user.uid,
        email: user.email,
        name: name,
        role: role
      }
    });

  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 409 }
      );
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
