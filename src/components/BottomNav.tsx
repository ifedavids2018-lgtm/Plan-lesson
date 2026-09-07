import React from 'react';
import { LayoutDashboard, Plus, BookOpenCheck, CalendarDays, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
    >
      <button
        id="bottom-nav-home"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center justify-center w-14 py-1 gap-1 text-xs font-medium transition ${
          currentView === 'dashboard' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        id="bottom-nav-plans"
        onClick={() => onNavigate('plans')}
        className={`flex flex-col items-center justify-center w-14 py-1 gap-1 text-xs font-medium transition ${
          currentView === 'plans' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <BookOpenCheck className="w-5 h-5" />
        <span className="text-[10px]">Plans</span>
      </button>

      {/* Prominent Center Create Button */}
      <button
        id="bottom-nav-create"
        onClick={() => {
          if (currentView === 'create') {
            const btn = document.getElementById('btn-create-lesson') || document.getElementById('btn-generate-lesson');
            if (btn) {
              btn.click();
              return;
            }
          }
          onNavigate('create');
        }}
        className="flex flex-col items-center justify-center -mt-5"
        aria-label="Create New Lesson Plan"
      >
        <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 border-4 border-white active:scale-95 transition">
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-bold text-blue-800 mt-0.5">Create</span>
      </button>

      <button
        id="bottom-nav-timetable"
        onClick={() => onNavigate('timetable')}
        className={`flex flex-col items-center justify-center w-14 py-1 gap-1 text-xs font-medium transition ${
          currentView === 'timetable' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span className="text-[10px]">Timetable</span>
      </button>

      <button
        id="bottom-nav-profile"
        onClick={() => onNavigate('profile')}
        className={`flex flex-col items-center justify-center w-14 py-1 gap-1 text-xs font-medium transition ${
          currentView === 'profile' ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">Profile</span>
      </button>
    </nav>
  );
};
