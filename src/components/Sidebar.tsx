import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpenCheck,
  FileQuestion,
  GraduationCap,
  CalendarDays,
  User,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Lesson', icon: PlusCircle, highlight: true },
    { id: 'plans', label: 'My Lesson Plans', icon: BookOpenCheck },
    { id: 'quiz', label: 'Quiz Generator', icon: FileQuestion },
    { id: 'homework', label: 'Homework Generator', icon: GraduationCap },
    { id: 'timetable', label: 'Weekly Timetable', icon: CalendarDays },
    { id: 'profile', label: 'Teacher Profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 shrink-0">
      <div className="space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-sm shadow-blue-700/20'
                  : item.highlight
                  ? 'text-blue-700 hover:bg-blue-50 bg-blue-50/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.highlight ? 'text-blue-700' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Nigerian & British Syllabi</span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Tuned for NERDC, WAEC/NECO, and Cambridge standards from Primary 1 to SS3.
          </p>
        </div>
      </div>
    </aside>
  );
};
