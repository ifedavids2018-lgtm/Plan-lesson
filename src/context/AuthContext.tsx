import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { getTeacherProfile, saveTeacherProfile } from '../lib/firestoreService';
import { TeacherProfile } from '../types';

interface AuthContextType {
  teacher: TeacherProfile | null;
  firebaseUser: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    school_name: string;
    subjects_taught?: string[];
    classes_taught?: string[];
    curriculum?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<TeacherProfile>) => Promise<void>;
  loginDemoUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_GUEST_PROFILE: TeacherProfile = {
  id: 'teacher-demo-001',
  name: 'Demo Teacher',
  email: 'teacher@school.ng',
  school_name: 'Federal Government College',
  role: 'teacher',
  subscription_plan: 'free',
  subjects_taught: ['Biology', 'Basic Science & Technology'],
  classes_taught: ['JSS 3 (Basic 9)', 'SS 1'],
  curriculum: 'NERDC National Standard Curriculum',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function getStoredGuestProfile(): TeacherProfile {
  try {
    const raw = localStorage.getItem('local_teacher_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_GUEST_PROFILE;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(getStoredGuestProfile);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync profile from Firestore whenever Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userToken = await user.getIdToken();
          setToken(userToken);

          // Retrieve or initialize teacher profile in Firestore
          let profile = await getTeacherProfile(user.uid);
          if (!profile) {
            const now = new Date().toISOString();
            profile = {
              id: user.uid,
              name: user.displayName || 'Teacher',
              email: user.email || '',
              school_name: 'Federal Government College',
              role: 'teacher',
              subscription_plan: 'free',
              subjects_taught: ['Biology', 'Basic Science & Technology'],
              classes_taught: ['JSS 3 (Basic 9)', 'SS 1'],
              curriculum: 'NERDC National Standard Curriculum',
              created_at: now,
              updated_at: now,
            };
            await saveTeacherProfile(profile);
          }
          setTeacher(profile);
        } catch (err) {
          console.warn('Error synchronizing teacher profile from Firestore, using local:', err);
          setTeacher(prev => prev || getStoredGuestProfile());
        }
      } else {
        setTeacher(getStoredGuestProfile());
        setToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        let profile = await getTeacherProfile(res.user.uid);
        if (!profile) {
          const now = new Date().toISOString();
          profile = {
            id: res.user.uid,
            name: res.user.displayName || '',
            email: res.user.email || '',
            school_name: '',
            role: 'teacher',
            subscription_plan: 'free',
            subjects_taught: ['Biology', 'Basic Science & Technology'],
            classes_taught: ['JSS 3 (Basic 9)', 'SS 1'],
            curriculum: 'NERDC National Standard Curriculum',
            created_at: now,
            updated_at: now,
          };
          await saveTeacherProfile(profile);
        }
        setTeacher(profile);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      throw new Error(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (res.user) {
        const profile = await getTeacherProfile(res.user.uid);
        if (profile) setTeacher(profile);
      }
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. Please verify credentials.');
      } else if (err.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password login is not enabled in Firebase Console. Please use "Continue with Google".');
      }
      throw new Error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    school_name: string;
    subjects_taught?: string[];
    classes_taught?: string[];
    curriculum?: string;
  }) => {
    try {
      setIsLoading(true);
      const res = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (res.user) {
        if (data.name) {
          await updateFirebaseProfile(res.user, { displayName: data.name });
        }

        const now = new Date().toISOString();
        const newProfile: TeacherProfile = {
          id: res.user.uid,
          name: data.name,
          email: data.email,
          school_name: data.school_name,
          role: 'teacher',
          subscription_plan: 'free',
          subjects_taught: data.subjects_taught || ['Biology', 'Basic Science & Technology'],
          classes_taught: data.classes_taught || ['JSS 3 (Basic 9)', 'SS 1'],
          curriculum: data.curriculum || 'NERDC National Standard Curriculum',
          created_at: now,
          updated_at: now,
        };

        await saveTeacherProfile(newProfile);
        setTeacher(newProfile);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      } else if (err.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password provider is not enabled in Firebase Console. Please sign in using "Continue with Google".');
      }
      throw new Error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth).catch(() => {});
    setFirebaseUser(null);
    setToken(null);
    setTeacher(DEFAULT_GUEST_PROFILE);
  };

  const updateProfile = async (data: Partial<TeacherProfile>) => {
    if (!teacher) return;
    const updated: TeacherProfile = {
      ...teacher,
      ...data,
      updated_at: new Date().toISOString(),
    };
    setTeacher(updated);
    if (firebaseUser) {
      try {
        await saveTeacherProfile(updated);
      } catch (err) {
        console.warn('Could not save profile to Firestore, kept locally:', err);
      }
    } else {
      localStorage.setItem('local_teacher_profile', JSON.stringify(updated));
    }
  };

  const loginDemoUser = async () => {
    setTeacher(DEFAULT_GUEST_PROFILE);
    localStorage.removeItem('local_teacher_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        firebaseUser,
        token,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        loginDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
