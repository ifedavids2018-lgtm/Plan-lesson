import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Quiz, QuizQuestion, LessonPlan } from '../types';
import { generateQuizAI, saveQuiz, fetchLessons, fetchQuizzes, deleteQuiz } from '../lib/api';
import {
  FileQuestion,
  Sparkles,
  Save,
  Printer,
  Trash2,
  Plus,
  CheckCircle2,
  HelpCircle,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface QuizGeneratorViewProps {
  initialLessonId?: string;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const QuizGeneratorView: React.FC<QuizGeneratorViewProps> = ({
  initialLessonId,
  onShowToast,
}) => {
  const { teacher } = useAuth();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId || '');

  // Form parameters
  const [topic, setTopic] = useState('Nutrition and Balanced Diet');
  const [className, setClassName] = useState('SS1');
  const [subject, setSubject] = useState('Biology');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('medium');

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnswerKeys, setShowAnswerKeys] = useState(true);

  // Saved quizzes tab/list
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [viewTab, setViewTab] = useState<'create' | 'saved'>('create');

  useEffect(() => {
    async function loadData() {
      if (!teacher) return;
      try {
        const [lList, qList] = await Promise.all([
          fetchLessons({ teacher_id: teacher.id }),
          fetchQuizzes(teacher.id),
        ]);
        setLessons(lList);
        setSavedQuizzes(qList);

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
      onShowToast('Please enter a quiz topic.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedLesson = lessons.find(l => l.id === selectedLessonId);
      const data = await generateQuizAI({
        lesson_plan_id: selectedLessonId || undefined,
        topic: topic.trim(),
        class_name: className,
        subject: subject,
        question_count: questionCount,
        question_type: questionType,
        difficulty: difficulty,
        lesson_content: selectedLesson ? selectedLesson.lesson_content : undefined,
      });

      const rawQuestions = data.questions || [];
      const normalizedQuestions = rawQuestions.map((q: any, i: number) => {
        const qText = q.question || q.question_text || `Question ${i + 1}`;
        const rawOpts = q.options || [];
        const strOpts = rawOpts.map((o: any) => (typeof o === 'string' ? o : (o.text || o.label || '')));
        const correct = typeof q.correct_answer === 'object' && q.correct_answer !== null
          ? (q.correct_answer.text || q.correct_answer.label || '')
          : String(q.correct_answer || (strOpts[0] || ''));
        return {
          id: q.id || `q-${i + 1}`,
          order_index: q.order_index || i + 1,
          question: qText,
          question_text: qText,
          options: strOpts,
          correct_answer: correct,
          explanation: q.explanation || '',
        };
      });

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        teacher_id: teacher?.id || 'demo-teacher',
        lesson_plan_id: selectedLessonId || undefined,
        title: data.title || `${className} ${subject} Quiz: ${topic}`,
        topic: topic.trim(),
        class_name: className,
        subject: subject,
        subject_name: subject,
        question_count: normalizedQuestions.length || questionCount,
        question_type: questionType,
        difficulty: difficulty,
        questions: normalizedQuestions,
        created_at: new Date().toISOString(),
      };

      // Automatically persist to backend library
      try {
        const saved = await saveQuiz(newQuiz);
        setActiveQuiz(saved);
        setSavedQuizzes(prev => [saved, ...prev.filter(q => q.id !== saved.id)]);
        onShowToast('Quiz generated and saved to your library!', 'success');
      } catch (saveErr) {
        setActiveQuiz(newQuiz);
        onShowToast('Quiz generated successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Failed to generate quiz. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!activeQuiz) return;
    try {
      const saved = await saveQuiz(activeQuiz);
      setSavedQuizzes(prev => [saved, ...prev]);
      onShowToast('Quiz saved to your library.', 'success');
    } catch (e) {
      onShowToast('Failed to save quiz.', 'error');
    }
  };

  const handleDeleteSavedQuiz = async (id: string) => {
    try {
      await deleteQuiz(id);
      setSavedQuizzes(prev => prev.filter(q => q.id !== id));
      if (activeQuiz?.id === id) setActiveQuiz(null);
      onShowToast('Quiz deleted.', 'info');
    } catch (e) {
      onShowToast('Failed to delete quiz.', 'error');
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
            <FileQuestion className="w-6 h-6 text-amber-600" />
            <span>AI Quiz Generator</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate classroom tests, continuous assessment quizzes, and answer keys.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewTab('create')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewTab === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Quiz
          </button>
          <button
            onClick={() => setViewTab('saved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewTab === 'saved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saved Quizzes ({savedQuizzes.length})
          </button>
        </div>
      </div>

      {viewTab === 'saved' ? (
        <div className="space-y-4">
          {savedQuizzes.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <FileQuestion className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No saved quizzes yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Generate a quiz from the Create tab and click Save to store it here.
              </p>
            </div>
          ) : (
            savedQuizzes.map(q => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {q.class_name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {q.subject}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {q.questions.length} questions • {q.difficulty}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{q.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveQuiz(q);
                      setViewTab('create');
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteSavedQuiz(q.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete quiz"
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
          {/* Quiz Configuration Form */}
          <form
            onSubmit={handleGenerate}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4"
          >
            {/* Link to existing lesson plan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link to an Existing Lesson Plan (Optional)
              </label>
              <select
                value={selectedLessonId}
                onChange={e => handleLessonSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium"
              >
                <option value="">-- Custom Topic / Standalone Quiz --</option>
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
                  placeholder="e.g. SS1, Primary 5"
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
                  placeholder="e.g. Biology, Mathematics"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Number of Questions</label>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value={5}>5 Questions (Quick Check)</option>
                  <option value={10}>10 Questions (Standard Quiz)</option>
                  <option value={15}>15 Questions (Test)</option>
                  <option value={20}>20 Questions (Exam Prep)</option>
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
                placeholder="e.g. Photosynthesis, Quadratic Equations"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question Type</label>
                <select
                  value={questionType}
                  onChange={e => setQuestionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value="mcq">Multiple Choice Questions (A, B, C, D)</option>
                  <option value="short_answer">Short Answer / Fill in the Blanks</option>
                  <option value="true_false">True / False</option>
                  <option value="mixed">Mixed Format</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value="easy">Easy (Recall & Definition)</option>
                  <option value="medium">Medium (Application & Understanding)</option>
                  <option value="challenging">Challenging (Higher Order Thinking)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm shadow-md hover:bg-amber-700 transition active:scale-95 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{isGenerating ? 'Generating Quiz Questions...' : '✨ Generate Quiz with AI'}</span>
            </button>
          </form>

          {/* Active Quiz Output */}
          {activeQuiz && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Class Assessment
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{activeQuiz.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeQuiz.class_name} • {activeQuiz.subject} • {activeQuiz.questions.length} Questions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  >
                    {showAnswerKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showAnswerKeys ? 'Hide Answers' : 'Show Answers'}</span>
                  </button>

                  <button
                    onClick={handleSaveQuiz}
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

              {/* Questions List */}
              <div className="space-y-6">
                {activeQuiz.questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="font-semibold text-sm text-slate-900 leading-snug">
                        {q.question || (q as any).question_text}
                      </p>
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                        {q.options.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrect =
                            showAnswerKeys &&
                            (q.correct_answer === opt ||
                              q.correct_answer === letter ||
                              opt.toLowerCase().startsWith(q.correct_answer.toLowerCase()));
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg border text-xs font-medium ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="mr-2 font-bold text-slate-400">
                                {letter}.
                              </span>
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {showAnswerKeys && (
                      <div className="pl-8 pt-1 text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 space-y-1">
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Correct Answer: {q.correct_answer}</span>
                        </p>
                        {q.explanation && (
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
