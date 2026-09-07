import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { CreateLessonView } from './components/CreateLessonView';
import { LessonEditorView } from './components/LessonEditorView';
import { LessonLibraryView } from './components/LessonLibraryView';
import { QuizGeneratorView } from './components/QuizGeneratorView';
import { HomeworkGeneratorView } from './components/HomeworkGeneratorView';
import { TimetableView } from './components/TimetableView';
import { ProfileView } from './components/ProfileView';
import { LessonPlan } from './types';
import { fetchLessonById, fetchLessons } from './lib/api';

function MainApp() {
  const { teacher, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [toolLessonId, setToolLessonId] = useState<string | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNavigate = async (view: string, lessonId?: string) => {
    if (lessonId) {
      setToolLessonId(lessonId);
      if (view === 'editor') {
        try {
          const lesson = await fetchLessonById(lessonId);
          setSelectedLesson(lesson);
        } catch (e) {
          console.error('Could not fetch lesson:', e);
        }
      }
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLesson = (lesson: LessonPlan) => {
    setSelectedLesson(lesson);
    setToolLessonId(lesson.id);
  };

  const handleLessonGenerated = (lesson: LessonPlan) => {
    setSelectedLesson(lesson);
    setToolLessonId(lesson.id);
    showToast('Lesson plan generated with AI! You can now review and refine any section.', 'success');
  };

  const handleLessonUpdated = (updated: LessonPlan) => {
    setSelectedLesson(updated);
  };

  // If entering editor directly with no selected lesson, try to fetch the latest
  useEffect(() => {
    if (currentView === 'editor' && !selectedLesson && teacher) {
      fetchLessons({ teacher_id: teacher.id }).then(list => {
        if (list.length > 0) {
          setSelectedLesson(list[0]);
        } else {
          setCurrentView('create');
        }
      });
    }
  }, [currentView, selectedLesson, teacher]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading AI Teacher Lesson Planner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Sidebar (Desktop) */}
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">
          {currentView === 'dashboard' && (
            <DashboardView onNavigate={handleNavigate} onSelectLesson={handleSelectLesson} />
          )}

          {currentView === 'create' && (
            <CreateLessonView
              onLessonGenerated={handleLessonGenerated}
              onNavigate={handleNavigate}
              onShowToast={showToast}
            />
          )}

          {currentView === 'editor' && selectedLesson && (
            <LessonEditorView
              lesson={selectedLesson}
              onLessonUpdated={handleLessonUpdated}
              onNavigate={handleNavigate}
              onShowToast={showToast}
            />
          )}

          {currentView === 'plans' && (
            <LessonLibraryView
              onSelectLesson={handleSelectLesson}
              onNavigate={handleNavigate}
              onShowToast={showToast}
            />
          )}

          {currentView === 'quiz' && (
            <QuizGeneratorView
              initialLessonId={toolLessonId}
              onShowToast={showToast}
            />
          )}

          {currentView === 'homework' && (
            <HomeworkGeneratorView
              initialLessonId={toolLessonId}
              onShowToast={showToast}
            />
          )}

          {currentView === 'timetable' && (
            <TimetableView onNavigate={handleNavigate} onShowToast={showToast} />
          )}

          {currentView === 'profile' && (
            <ProfileView
              onShowToast={showToast}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <BottomNav currentView={currentView} onNavigate={handleNavigate} />

      {/* Connectivity & Offline Notifications */}
      <OfflineIndicator />
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
