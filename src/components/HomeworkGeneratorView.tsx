import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Homework, LessonPlan } from '../types';
import { generateHomeworkAI, saveHomework, fetchLessons, fetchHomework, deleteHomework } from '../lib/api';
import {
  GraduationCap,
  Sparkles,
  Save,
  Printer,
  Trash2,
  BookOpen,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface HomeworkGeneratorViewProps {
  initialLessonId?: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const HomeworkGeneratorView: React.FC<HomeworkGeneratorViewProps> = ({
  initialLessonId,
  onShowToast,
}) => {
  const { teacher } = useAuth();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId || '');

  // Form parameters
  const [topic, setTopic] = useState('Nutrition and Deficiency Diseases');
  const [className, setClassName] = useState('SS1');
  const [subject, setSubject] = useState('Biology');
  const [itemCount, setItemCount] = useState<number>(5);
  const [assignmentType, setAssignmentType] = useState('standard');
  const [difficulty, setDifficulty] = useState('standard');

  // Active homework state
  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Saved homework list
  const [savedHomeworkList, setSavedHomeworkList] = useState<Homework[]>([]);
  const [viewTab, setViewTab] = useState<'create' | 'saved'>('create');

  useEffect(() => {
    async function loadData() {
      if (!teacher) return;
      try {
        const [lList, hList] = await Promise.all([
          fetchLessons({ teacher_id: teacher.id }),
          fetchHomework(teacher.id),
        ]);
        setLessons(lList);
        setSavedHomeworkList(hList);

        if (initialLessonId) {
          const match = lList.find(l => l.id === initialLessonId);
          if (match) {
            setSelectedLessonId(match.id);
            setTopic(match.topic);
            setClassName(match.class_name_snapshot);
            setSubject(match.subject_name_snapshot);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, [teacher, initialLessonId]);

  const handleLessonSelect = (id: string) => {
    setSelectedLessonId(id);
    const match = lessons.find(l => l.id === id);
    if (match) {
      setTopic(match.topic);
      setClassName(match.class_name_snapshot);
      setSubject(match.subject_name_snapshot);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      onShowToast('Please enter a homework topic.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedLesson = lessons.find(l => l.id === selectedLessonId);
      const data = await generateHomeworkAI({
        lesson_plan_id: selectedLessonId || undefined,
        topic: topic.trim(),
        class_name: className,
        subject: subject,
        item_count: itemCount,
        assignment_type: assignmentType,
        difficulty: difficulty,
        lesson_content: selectedLesson ? selectedLesson.lesson_content : undefined,
      });

      const rawQuestions = data.questions || data.items || [];
      const normalizedQuestions = rawQuestions.map((q: any, i: number) => ({
        id: q.id || `hw-${i + 1}`,
        prompt: q.prompt || q.question || `Exercise ${i + 1}`,
        guidance: q.guidance || q.expected_answer || '',
        expected_answer: q.expected_answer || q.guidance || '',
      }));

      const newHw: Homework = {
        id: `hw-${Date.now()}`,
        teacher_id: teacher?.id || 'demo-teacher',
        lesson_plan_id: selectedLessonId || undefined,
        title: data.title || `${className} ${subject} Homework: ${topic}`,
        topic: topic.trim(),
        class_name: className,
        subject: subject,
        instructions: data.instructions || data.overview || 'Answer all questions carefully in your homework notebook.',
        questions: normalizedQuestions,
        submission_notes: data.submission_notes || data.submission_guidelines || 'Due next lesson. To be submitted at the start of class.',
        created_at: new Date().toISOString(),
      };

      // Automatically persist to backend library
      try {
        const saved = await saveHomework(newHw);
        setActiveHomework(saved);
        setSavedHomeworkList(prev => [saved, ...prev.filter(h => h.id !== saved.id)]);
        onShowToast('Homework created and saved to your library!', 'success');
      } catch (saveErr) {
        setActiveHomework(newHw);
        onShowToast('Homework assignment generated successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Failed to generate homework.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!activeHomework) return;
    try {
      const saved = await saveHomework(activeHomework);
      setSavedHomeworkList(prev => [saved, ...prev]);
      onShowToast('Homework saved to your archive.', 'success');
    } catch (e) {
      onShowToast('Failed to save homework.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHomework(id);
      setSavedHomeworkList(prev => prev.filter(h => h.id !== id));
      if (activeHomework?.id === id) setActiveHomework(null);
      onShowToast('Homework assignment removed.', 'info');
    } catch (e) {
      onShowToast('Failed to delete homework.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto pb-28 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            <span>Homework Generator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create structured home assignments, inquiry tasks, and revision exercises.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewTab('create')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewTab === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Homework
          </button>
          <button
            onClick={() => setViewTab('saved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewTab === 'saved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Assignments ({savedHomeworkList.length})
          </button>
        </div>
      </div>

      {viewTab === 'saved' ? (
        <div className="space-y-4">
          {savedHomeworkList.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No saved homework assignments yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Generate an assignment and save it to review or print anytime.
              </p>
            </div>
          ) : (
            savedHomeworkList.map(h => (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {h.class_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {h.subject}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {h.questions.length} tasks
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{h.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveHomework(h);
                      setViewTab('create');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete homework"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <form
            onSubmit={handleGenerate}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link to Lesson Plan (Optional)
              </label>
              <select
                value={selectedLessonId}
                onChange={e => handleLessonSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium"
              >
                <option value="">-- Custom Assignment / Standalone Topic --</option>
                {lessons.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.class_name_snapshot} {l.subject_name_snapshot}: {l.topic}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class Level</label>
                <input
                  type="text"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  placeholder="e.g. SS1, JSS2"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  placeholder="e.g. Biology"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Number of Tasks</label>
                <select
                  value={itemCount}
                  onChange={e => setItemCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value={3}>3 Tasks (Short)</option>
                  <option value={5}>5 Tasks (Standard)</option>
                  <option value={8}>8 Tasks (Comprehensive)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                placeholder="e.g. Nutrient cycles, Soil conservation"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Type</label>
                <select
                  value={assignmentType}
                  onChange={e => setAssignmentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value="standard">Standard Revision Questions</option>
                  <option value="research">Take-Home Research & Inquiry</option>
                  <option value="practical">Practical Home Experiment / Activity</option>
                  <option value="essay">Short Analytical Essay / Discussion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value="standard">Standard</option>
                  <option value="challenging">Extension / Challenging</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow-md hover:bg-emerald-800 transition active:scale-95 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>{isGenerating ? 'Drafting Homework Assignment...' : '✨ Generate Homework with AI'}</span>
            </button>
          </form>

          {/* Active Homework Output */}
          {activeHomework && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Student Homework Sheet
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{activeHomework.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeHomework.class_name} • {activeHomework.subject}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 font-medium">
                <strong>General Instructions:</strong> {activeHomework.instructions}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {activeHomework.questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900 leading-relaxed">{q.prompt}</p>
                        {q.guidance && (
                          <p className="text-xs text-slate-500 mt-1 italic">
                            Tip / Guidance: {q.guidance}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submission Notes */}
              {activeHomework.submission_notes && (
                <div className="pt-2 text-xs text-slate-500 border-t border-slate-100">
                  <strong>Submission Note:</strong> {activeHomework.submission_notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
