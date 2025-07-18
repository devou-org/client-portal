'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, AuthContextType } from '@/types';
import { isAdmin as checkIsAdmin } from '@/lib/utils';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        await handleUserLogin(firebaseUser);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleUserLogin = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let userData: User;

      if (userDoc.exists()) {
        // User exists, get their data
        const existingData = userDoc.data();
        userData = {
          uid: firebaseUser.uid,
          name: existingData.name || firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          projects: existingData.projects || [],
          invoices: existingData.invoices || [],
          documents: existingData.documents || [],
          requests: existingData.requests || [],
          createdAt: existingData.createdAt?.toDate(),
          updatedAt: existingData.updatedAt?.toDate(),
        };

        // Update the document with any new info from Firebase Auth
        await setDoc(userDocRef, {
          ...existingData,
          name: firebaseUser.displayName || existingData.name,
          email: firebaseUser.email,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // New user, create their document
        userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
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
      }

      setUser(userData);
      setIsAdmin(checkIsAdmin(userData.email));
    } catch (error) {
      console.error('Error handling user login:', error);
      setUser(null);
      setIsAdmin(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      await signInWithPopup(auth, provider);
      // User state will be updated through the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
