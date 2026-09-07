import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LessonPlan } from '../types';
import { fetchLessons, duplicateLesson, deleteLesson } from '../lib/api';
import { generateLessonPlanPDF } from '../lib/pdf';
import {
  Search,
  PlusCircle,
  Clock,
  Calendar,
  FileDown,
  Copy,
  Trash2,
  BookOpen,
  Filter,
  MoreVertical,
  BookMarked,
  Sparkles,
} from 'lucide-react';

interface LessonLibraryViewProps {
  onSelectLesson: (lesson: LessonPlan) => void;
  onNavigate: (view: string, lessonId?: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const LessonLibraryView: React.FC<LessonLibraryViewProps> = ({
  onSelectLesson,
  onNavigate,
  onShowToast,
}) => {
  const { teacher } = useAuth();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterTerm, setFilterTerm] = useState('all');

  // Deletion modal
  const [lessonToDelete, setLessonToDelete] = useState<LessonPlan | null>(null);

  const loadLessons = async () => {
    if (!teacher) return;
    try {
      setLoading(true);
      const data = await fetchLessons({
        teacher_id: teacher.id,
        search: searchQuery,
        subject: filterSubject,
        class: filterClass,
        term: filterTerm,
      });
      setLessons(data);
    } catch (err) {
      console.error(err);
      onShowToast('Failed to load lesson plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [teacher, filterSubject, filterClass, filterTerm]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLessons();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicated = await duplicateLesson(id);
      setLessons(prev => [duplicated, ...prev]);
      onShowToast('Lesson plan duplicated.', 'success');
    } catch (err) {
      onShowToast('Could not duplicate lesson.', 'error');
    }
  };

  const handleExportPDF = (lesson: LessonPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    generateLessonPlanPDF(lesson, teacher);
    onShowToast('PDF exported successfully.', 'success');
  };

  const handleConfirmDelete = async () => {
    if (!lessonToDelete) return;
    try {
      await deleteLesson(lessonToDelete.id);
      setLessons(prev => prev.filter(l => l.id !== lessonToDelete.id));
      onShowToast('Lesson plan deleted.', 'info');
    } catch (err) {
      onShowToast('Failed to delete lesson plan.', 'error');
    } finally {
      setLessonToDelete(null);
    }
  };

  const uniqueSubjects = Array.from(new Set(lessons.map(l => l.subject_name_snapshot))).filter(Boolean);
  const uniqueClasses = Array.from(new Set(lessons.map(l => l.class_name_snapshot))).filter(Boolean);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Lesson Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your archive of lesson plans, teaching notes, and syllabus materials.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md hover:bg-blue-800 transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Create Lesson</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by topic, learning objectives, or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">All Subjects</option>
            {uniqueSubjects.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filterTerm}
            onChange={e => setFilterTerm(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
          >
            <option value="all">All Terms</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>

          {(filterSubject !== 'all' || filterClass !== 'all' || filterTerm !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterSubject('all');
                setFilterClass('all');
                setFilterTerm('all');
                setSearchQuery('');
              }}
              className="text-xs text-blue-700 hover:text-blue-800 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Lesson List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading lessons...</div>
      ) : lessons.length === 0 ? (
        <div className="py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No lesson plans found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || filterSubject !== 'all' || filterClass !== 'all'
              ? 'Try changing your search or filter keywords.'
              : 'Get started by creating your first lesson plan.'}
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Lesson Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map(plan => (
            <div
              key={plan.id}
              onClick={() => {
                onSelectLesson(plan);
                onNavigate('editor');
              }}
              className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                      {plan.class_name_snapshot}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                      {plan.subject_name_snapshot}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {plan.duration_minutes_custom || plan.duration_option}m
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
                  {plan.topic}
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {plan.learning_objectives && plan.learning_objectives.length > 0
                    ? plan.learning_objectives[0]
                    : plan.introduction || 'Standard syllabus lesson note.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">
                  {plan.term || 'Term 1'} • Wk {plan.week || 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={e => handleExportPDF(plan, e)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                    title="Export PDF"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={e => handleDuplicate(plan.id, e)}
                    className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setLessonToDelete(plan);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {lessonToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Delete Lesson Plan?</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <strong>"{lessonToDelete.topic}"</strong>? This will permanently remove this lesson plan and cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setLessonToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
