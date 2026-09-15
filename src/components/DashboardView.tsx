import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LessonPlan, DashboardStats } from '../types';
import { fetchStats, fetchLessons } from '../lib/api';
import {
  PlusCircle,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  BookMarked,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string, lessonId?: string) => void;
  onSelectLesson: (lesson: LessonPlan) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectLesson }) => {
  const { teacher } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLessonPlans: 0,
    thisWeek: 0,
    totalQuizzes: 0,
    totalSubjects: 0,
  });
  const [recentLessons, setRecentLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherName = teacher?.name?.trim();
  const teacherSchool = teacher?.school_name?.trim();
  const greetingName = teacherName || 'Teacher';

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, lessonsData] = await Promise.all([
          fetchStats(teacher?.id),
          fetchLessons(teacher?.id ? { teacher_id: teacher.id } : undefined),
        ]);
        setStats(statsData);
        setRecentLessons(lessonsData.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [teacher]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Curriculum Engine Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex flex-wrap items-center gap-2">
            <span>Welcome, {greetingName} 👋</span>
            {!teacherName && (
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="text-xs font-normal text-blue-200 hover:text-white underline underline-offset-2 transition"
                title="Add your name to your profile"
              >
                (Set your name)
              </button>
            )}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed flex flex-wrap items-center gap-1.5">
            <span>
              {teacherSchool
                ? `What would you like to prepare for your classes at ${teacherSchool} today?`
                : 'What would you like to prepare for your classes today?'}
            </span>
            {!teacherSchool && (
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="text-xs text-blue-200 hover:text-white underline underline-offset-2 transition font-medium"
                title="Add your school name to your profile"
              >
                (Add school)
              </button>
            )}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              id="dash-cta-create"
              onClick={() => onNavigate('create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 font-semibold text-sm shadow-md hover:bg-blue-50 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-blue-700" />
              <span>+ Create Lesson Plan</span>
            </button>
            <button
              id="dash-cta-timetable"
              onClick={() => onNavigate('timetable')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700/80 hover:bg-blue-700 text-white font-medium text-sm transition"
            >
              <Calendar className="w-4 h-4" />
              <span>Weekly Timetable</span>
            </button>
          </div>
        </div>

        {/* Decorative ambient background accent */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stats Strip */}
      <section>
        <h2 className="sr-only">Dashboard Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">Total Lesson Plans</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block">
              {loading ? '...' : stats.totalLessonPlans}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">This Week</span>
            <span className="text-2xl sm:text-3xl font-bold text-blue-700 mt-1 block">
              {loading ? '...' : stats.thisWeek}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">Saved Quizzes</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block">
              {loading ? '...' : stats.totalQuizzes}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">Subjects Covered</span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block">
              {loading ? '...' : stats.totalSubjects}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Actions (5 Actions matching PRD & Brief) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Create Lesson */}
          <button
            id="action-card-create"
            onClick={() => onNavigate('create')}
            className="flex flex-col items-start p-4 rounded-2xl bg-blue-50 border border-blue-200/80 hover:border-blue-300 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-800">
              Create Lesson
            </span>
            <span className="text-xs text-slate-500 mt-1 line-clamp-2">
              Generate structured notes in minutes with AI
            </span>
          </button>

          {/* 2. My Lesson Plans */}
          <button
            id="action-card-plans"
            onClick={() => onNavigate('plans')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <BookOpen className="w-5 h-5 text-blue-700" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-800">
              My Lesson Plans
            </span>
            <span className="text-xs text-slate-500 mt-1 line-clamp-2">
              Browse, search, edit, and export saved plans
            </span>
          </button>

          {/* 3. Generate Quiz */}
          <button
            id="action-card-quiz"
            onClick={() => onNavigate('quiz')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <FileQuestion className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-800">
              Generate Quiz
            </span>
            <span className="text-xs text-slate-500 mt-1 line-clamp-2">
              Create MCQs & short tests with answer keys
            </span>
          </button>

          {/* 4. Generate Homework */}
          <button
            id="action-card-homework"
            onClick={() => onNavigate('homework')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-800">
              Generate Homework
            </span>
            <span className="text-xs text-slate-500 mt-1 line-clamp-2">
              Assignments, research tasks & practicals
            </span>
          </button>

          {/* 5. Weekly Timetable */}
          <button
            id="action-card-timetable"
            onClick={() => onNavigate('timetable')}
            className="flex flex-col items-start p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition text-left group col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-800">
              Weekly Timetable
            </span>
            <span className="text-xs text-slate-500 mt-1 line-clamp-2">
              Weekly teaching schedule with conflict alerts
            </span>
          </button>
        </div>
      </section>

      {/* Recent Lesson Plans */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Lesson Plans</h2>
            <p className="text-xs text-slate-500">Pick up right where you left off</p>
          </div>
          <button
            onClick={() => onNavigate('plans')}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800 transition"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">Loading lesson plans...</div>
        ) : recentLessons.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <BookMarked className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">No lesson plans created yet</p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              Get started by creating your first lesson plan. It takes less than 2 minutes!
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Lesson Plan</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLessons.map(plan => (
              <div
                key={plan.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-blue-100">
                    {plan.class_name_snapshot}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-blue-700 transition">
                      {plan.topic}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{plan.subject_name_snapshot}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {plan.duration_minutes_custom || plan.duration_option} mins
                      </span>
                      <span>•</span>
                      <span>{plan.term || 'Term 1'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      onSelectLesson(plan);
                      onNavigate('editor');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 transition"
                  >
                    Open Editor
                  </button>
                  <button
                    onClick={() => {
                      onSelectLesson(plan);
                      onNavigate('quiz');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition hidden sm:inline-block"
                  >
                    Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
