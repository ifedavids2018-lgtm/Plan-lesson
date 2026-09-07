import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeacherProfile } from '../types';

interface AuthContextType {
  teacher: TeacherProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    school_name: string;
    subjects_taught?: string[];
    classes_taught?: string[];
    curriculum?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<TeacherProfile>) => Promise<void>;
  loginDemoUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('teacher_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const savedToken = localStorage.getItem('teacher_token');
        const res = await fetch(`/api/auth/me${savedToken ? `?teacher_id=${savedToken}` : ''}`, {
          headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setTeacher(data.teacher);
          if (data.teacher?.id) {
            setToken(data.teacher.id);
            localStorage.setItem('teacher_token', data.teacher.id);
          }
        } else {
          // Default to pre-seeded teacher on first run so the teacher can test immediately
          const fallbackRes = await fetch('/api/auth/me');
          if (fallbackRes.ok) {
            const fb = await fallbackRes.json();
            setTeacher(fb.teacher);
            setToken(fb.teacher.id);
            localStorage.setItem('teacher_token', fb.teacher.id);
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid credentials');
    }
    const data = await res.json();
    setTeacher(data.teacher);
    setToken(data.token);
    localStorage.setItem('teacher_token', data.token);
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
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    const result = await res.json();
    setTeacher(result.teacher);
    setToken(result.token);
    localStorage.setItem('teacher_token', result.token);
  };

  const logout = () => {
    setTeacher(null);
    setToken(null);
    localStorage.removeItem('teacher_token');
  };

  const updateProfile = async (data: Partial<TeacherProfile>) => {
    if (!teacher) return;
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || teacher.id}`,
      },
      body: JSON.stringify({ ...data, teacher_id: teacher.id }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const result = await res.json();
    setTeacher(result.teacher);
  };

  const loginDemoUser = async () => {
    await login('aisha.ibrahim@school.ng', 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        token,
        isLoading,
        login,
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
