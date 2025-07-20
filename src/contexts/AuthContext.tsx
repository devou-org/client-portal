'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthContextType } from '@/types';
import { isAdmin as checkIsAdmin } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Check if Firebase config is loaded
    if (!auth) {
      console.error('Firebase auth not initialized');
      setAuthError('Firebase configuration error');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: Auth state changed', firebaseUser?.email);
      setLoading(true);
      setAuthError(null);
      
      if (firebaseUser) {
        try {
          await handleUserLogin(firebaseUser);
        } catch (error) {
          console.error('Auth error:', error);
          setAuthError(error instanceof Error ? error.message : 'Authentication failed');
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        console.log('AuthContext: No user signed in');
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleUserLogin = async (firebaseUser: FirebaseUser, name?: string) => {
    try {
      console.log('Handling user login for:', firebaseUser.email);
      
      if (!db) {
        throw new Error('Firestore database not initialized');
      }
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      // Check if user is admin by email
      const isUserAdmin = checkIsAdmin(firebaseUser.email || '');
      console.log('User admin status:', isUserAdmin);

      if (userDoc.exists()) {
        console.log('User document exists, updating...');
        // User exists in database, update and login
        const existingData = userDoc.data();
        const userData: User = {
          uid: firebaseUser.uid,
          name: existingData.name || name || '',
          email: firebaseUser.email || '',
          projects: existingData.projects || [],
          invoices: existingData.invoices || [],
          documents: existingData.documents || [],
          requests: existingData.requests || [],
          createdAt: existingData.createdAt?.toDate(),
          updatedAt: existingData.updatedAt?.toDate(),
        };

        // Update the document with any new info
        await setDoc(userDocRef, {
          ...existingData,
          name: name || existingData.name,
          email: firebaseUser.email,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        setUser(userData);
        setIsAdmin(isUserAdmin);
      } else {
        console.log('Creating new user document...');
        // User doesn't exist, create new user document
        const userData: User = {
          uid: firebaseUser.uid,
          name: name || '',
          email: firebaseUser.email || '',
          projects: [],
          invoices: [],
          documents: [],
          requests: [],
        };

        await setDoc(userDocRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setUser(userData);
        setIsAdmin(isUserAdmin);
      }
      
      console.log('User login handled successfully');
    } catch (error) {
      console.error('Error handling user login:', error);
      
      // For any errors, sign out and show generic error
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      throw new Error('Login failed. Please try again.');
    }
  };

  const signInWithEmailPassword = async (email: string, password: string, name?: string) => {
    try {
      console.log('Attempting to sign in with email:', email);
      setAuthError(null);
      
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.email);
      
      // If name is provided (first time login), update the user document
      if (name) {
        await handleUserLogin(result.user, name);
      }
      // The user state will be updated through the onAuthStateChanged listener
      
    } catch (error) {
      console.error('Error signing in with email/password:', error);
      
      // Provide user-friendly error messages
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            throw new Error('No account found with this email address.');
          case 'auth/wrong-password':
            throw new Error('Incorrect password. Please try again.');
          case 'auth/invalid-email':
            throw new Error('Invalid email address format.');
          case 'auth/user-disabled':
            throw new Error('This account has been disabled.');
          case 'auth/too-many-requests':
            throw new Error('Too many failed login attempts. Please try again later.');
          default:
            throw new Error(`Login failed: ${firebaseError.message}`);
        }
      }
      
      // Re-throw the error so the UI can handle it
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      setAuthError(null);
      // Redirect to login page
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    authError,
    signInWithEmailPassword,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
