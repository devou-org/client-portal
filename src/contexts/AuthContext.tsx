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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleUserLogin = async (firebaseUser: FirebaseUser, name?: string) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      // Check if user is admin by email
      const isUserAdmin = checkIsAdmin(firebaseUser.email || '');

      if (userDoc.exists()) {
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
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // If name is provided (first time login), update the user document
      if (name) {
        await handleUserLogin(result.user, name);
      }
      // The user state will be updated through the onAuthStateChanged listener
      
    } catch (error) {
      console.error('Error signing in with email/password:', error);
      
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
