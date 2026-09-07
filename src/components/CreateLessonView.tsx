import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DurationOption, LessonPlan } from '../types';
import { fetchClasses, fetchSubjects, createCustomClass, createCustomSubject, generateLessonAI, saveLesson } from '../lib/api';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CreateLessonViewProps {
  onLessonGenerated: (lesson: LessonPlan) => void;
  onNavigate: (view: string, lessonId?: string) => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CreateLessonView: React.FC<CreateLessonViewProps> = ({ onLessonGenerated, onNavigate, onShowToast }) => {
  const { teacher } = useAuth();

  // Reference data
  const [classList, setClassList] = useState<{ id: string; name: string }[]>([]);
  const [subjectList, setSubjectList] = useState<{ id: string; name: string }[]>([]);

  // Form Fields - Required
  const [selectedClass, setSelectedClass] = useState('SS1');
  const [selectedSubject, setSelectedSubject] = useState('Biology');
  const [topic, setTopic] = useState('Nutrition');
  const [durationOption, setDurationOption] = useState<DurationOption>('40');
  const [customDuration, setCustomDuration] = useState<number>(40);
  const [objectives, setObjectives] = useState<string[]>([
    'Define nutrition in biological terms.',
    'Identify the six main classes of food with local examples.',
    'Explain the importance of a balanced diet.',
  ]);

  // Custom inline addition
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Form Fields - Optional (Collapsed by default)
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [term, setTerm] = useState('First Term');
  const [week, setWeek] = useState<number>(3);
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [previousKnowledge, setPreviousKnowledge] = useState('Students recall basic concepts of food and health from Junior Secondary Basic Science.');
  const [teachingMethod, setTeachingMethod] = useState('Discussion & Demonstration');
  const [resources, setResources] = useState('Charts of food groups, physical food specimens, whiteboard markers');
  const [curriculum, setCurriculum] = useState('NERDC National Curriculum for Senior Secondary Biology');
  const [teacherNotes, setTeacherNotes] = useState('Connect nutrients with affordable local Nigerian market ingredients.');

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    class?: string;
    subject?: string;
    topic?: string;
    objectives?: string;
  }>({});

  useEffect(() => {
    async function loadRefs() {
      try {
        const [cList, sList] = await Promise.all([fetchClasses(), fetchSubjects()]);
        setClassList(cList);
        setSubjectList(sList);
      } catch (e) {
        console.error('Failed to load class/subject lists:', e);
      }
    }
    loadRefs();
  }, []);

  const handleAddObjective = () => {
    setObjectives(prev => [...prev, '']);
  };

  const handleUpdateObjective = (index: number, val: string) => {
    setObjectives(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveObjective = (index: number) => {
    if (objectives.length <= 1) return;
    setObjectives(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateCustomClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const created = await createCustomClass(newClassName.trim(), teacher?.id);
      setClassList(prev => [...prev, created]);
      setSelectedClass(created.name);
      setNewClassName('');
      setShowAddClass(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCustomSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const created = await createCustomSubject(newSubjectName.trim(), teacher?.id);
      setSubjectList(prev => [...prev, created]);
      setSelectedSubject(created.name);
      setNewSubjectName('');
      setShowAddSubject(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Precise validation with field-level attribution
    const errors: { class?: string; subject?: string; topic?: string; objectives?: string } = {};
    const cleanObjectives = objectives.filter(o => o.trim().length > 0);

    if (!selectedClass) {
      errors.class = 'Please choose or enter a class level.';
    }
    if (!selectedSubject) {
      errors.subject = 'Please choose or enter a subject.';
    }
    if (!topic.trim()) {
      errors.topic = 'Please enter a lesson topic.';
    }
    if (cleanObjectives.length === 0) {
      errors.objectives = 'Please enter at least one learning objective.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const msg = 'Please fill in all required fields indicated below.';
      setErrorMessage(msg);
      onShowToast?.(msg, 'error');

      // Scroll to first invalid field
      const firstTargetId = errors.class
        ? 'select-class'
        : errors.subject
        ? 'select-subject'
        : errors.topic
        ? 'input-topic'
        : 'input-objective-0';
      const el = document.getElementById(firstTargetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    setFieldErrors({});
    const durationText = durationOption === 'custom' ? `${customDuration} minutes` : `${durationOption} minutes`;

    setIsGenerating(true);
    try {
      // 1. Generate with AI
      const aiData = await generateLessonAI({
        class_name: selectedClass,
        subject: selectedSubject,
        topic: topic.trim(),
        duration: durationText,
        learning_objectives: cleanObjectives.join('\n'),
        previous_knowledge: previousKnowledge,
        teaching_method: teachingMethod,
        resources: resources,
        curriculum: curriculum,
        teacher_notes: teacherNotes,
      });

      // 2. Build complete LessonPlan object
      const newLesson: Partial<LessonPlan> = {
        teacher_id: teacher?.id || 'teacher-demo-001',
        class_name_snapshot: selectedClass,
        subject_name_snapshot: selectedSubject,
        topic: topic.trim(),
        duration_option: durationOption,
        duration_minutes_custom: durationOption === 'custom' ? customDuration : null,
        lesson_date: new Date().toISOString().split('T')[0],
        term,
        week: Number(week) || 1,
        lesson_number: Number(lessonNumber) || 1,
        learning_objectives_input: cleanObjectives.join('\n'),
        previous_knowledge_input: previousKnowledge,
        teaching_method: teachingMethod,
        resources_input: resources,
        curriculum_standard: curriculum,
        teacher_notes: teacherNotes,

        learning_objectives: aiData.learning_objectives || cleanObjectives,
        previous_knowledge: aiData.previous_knowledge || previousKnowledge,
        instructional_materials: aiData.instructional_materials || [resources || 'Textbook, whiteboard'],
        introduction: aiData.introduction || '',
        lesson_content: aiData.lesson_content || '',
        teaching_activities: aiData.teaching_activities || [],
        student_activities: aiData.student_activities || [],
        assessment: aiData.assessment || '',
        conclusion: aiData.conclusion || '',
        homework_summary: aiData.homework_summary || '',

        status: 'saved',
        is_ai_generated: true,
      };

      // 3. Save initial draft to DB
      const saved = await saveLesson(newLesson);
      onLessonGenerated(saved);
      onShowToast?.('Lesson plan created successfully! You can now review and refine any section.', 'success');
      onNavigate('editor', saved.id);
    } catch (err: any) {
      console.error('Generation error:', err);
      const msg = err.message || 'We could not generate your lesson plan. Please check your connection and try again.';
      setErrorMessage(msg);
      onShowToast?.(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsDraftFallback = async () => {
    const cleanObjectives = objectives.filter(o => o.trim().length > 0);
    const fallbackLesson: Partial<LessonPlan> = {
      teacher_id: teacher?.id || 'teacher-demo-001',
      class_name_snapshot: selectedClass || 'SS1',
      subject_name_snapshot: selectedSubject || 'Biology',
      topic: topic.trim() || 'Untitled Topic',
      duration_option: durationOption,
      duration_minutes_custom: durationOption === 'custom' ? customDuration : null,
      lesson_date: new Date().toISOString().split('T')[0],
      term,
      week: Number(week) || 1,
      lesson_number: Number(lessonNumber) || 1,
      learning_objectives_input: cleanObjectives.join('\n'),
      previous_knowledge_input: previousKnowledge,
      teaching_method: teachingMethod,
      resources_input: resources,
      curriculum_standard: curriculum,
      teacher_notes: teacherNotes,
      learning_objectives: cleanObjectives.length > 0 ? cleanObjectives : ['State key definitions and principles of the topic.'],
      previous_knowledge: previousKnowledge || 'Foundational prerequisite knowledge from previous term.',
      instructional_materials: [resources || 'Standard textbook, whiteboard, and charts'],
      introduction: `Introduce ${topic || 'the topic'} with real-world examples and check students' previous knowledge.`,
      lesson_content: `Teacher explains the foundational concepts and methodologies of ${topic || 'the topic'}.`,
      teaching_activities: [
        { step_title: 'Step 1 — Introduction (5 mins)', description: 'Hook learners attention with an inquiry question.' },
        { step_title: 'Step 2 — Core Content Delivery (15 mins)', description: 'Explain main definitions and work through examples on the board.' },
        { step_title: 'Step 3 — Class Discussion & Assessment (10 mins)', description: 'Evaluate learner comprehension with diagnostic spot questions.' }
      ],
      student_activities: ['Take comprehensive notes in student workbooks.', 'Participate in classroom question-and-answer discussion.'],
      assessment: '1. State the main points covered today.\n2. Solve the exercise on the board.',
      conclusion: 'Recap core takeaways and distribute homework assignment.',
      homework_summary: 'Answer review questions 1 to 5 in the subject workbook.',
      status: 'saved',
      is_ai_generated: false,
    };

    try {
      const saved = await saveLesson(fallbackLesson);
      onLessonGenerated(saved);
      onShowToast?.('Lesson draft saved. Opening editor...', 'success');
      onNavigate('editor', saved.id);
    } catch (e: any) {
      onShowToast?.('Failed to save lesson draft.', 'error');
    }
  };

  const durationOptions: DurationOption[] = ['30', '40', '45', '60', '90', 'custom'];

  return (
    <div className="max-w-2xl mx-auto pb-28 animate-in fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Create New Lesson Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide basic details and let the AI build your structured Nigerian / British-style lesson note.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Submission Notice</p>
              <p className="mt-0.5 text-xs text-rose-700">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveAsDraftFallback}
            className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap transition"
          >
            Save as Draft Instead
          </button>
        </div>
      )}

      <form id="create-lesson-form" onSubmit={handleSubmit} className="space-y-6 pb-28 lg:pb-8">
        {/* Card: Required Core Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
          {/* Class Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="select-class" className="block text-xs sm:text-sm font-bold text-slate-800">
                Class Level <span className="text-rose-500">*</span>
              </label>
              {!showAddClass && (
                <button
                  type="button"
                  onClick={() => setShowAddClass(true)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  + Add Custom Class
                </button>
              )}
            </div>

            {showAddClass ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Nursery 2, Year 7"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateCustomClass}
                  className="px-3.5 py-2 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                id="select-class"
                value={selectedClass}
                onChange={e => {
                  setSelectedClass(e.target.value);
                  if (fieldErrors.class) setFieldErrors(prev => ({ ...prev, class: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium ${
                  fieldErrors.class ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              >
                {classList.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.class && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.class}</p>
            )}
          </div>

          {/* Subject Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="select-subject" className="block text-xs sm:text-sm font-bold text-slate-800">
                Subject <span className="text-rose-500">*</span>
              </label>
              {!showAddSubject && (
                <button
                  type="button"
                  onClick={() => setShowAddSubject(true)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  + Add Custom Subject
                </button>
              )}
            </div>

            {showAddSubject ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Further Mathematics, Yoruba"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateCustomSubject}
                  className="px-3.5 py-2 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                id="select-subject"
                value={selectedSubject}
                onChange={e => {
                  setSelectedSubject(e.target.value);
                  if (fieldErrors.subject) setFieldErrors(prev => ({ ...prev, subject: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium ${
                  fieldErrors.subject ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              >
                {subjectList.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.subject && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.subject}</p>
            )}
          </div>

          {/* Topic */}
          <div>
            <label htmlFor="input-topic" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Topic <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-topic"
              type="text"
              placeholder="e.g. Nutrition, Quadratic Equations, Simple Past Tense"
              value={topic}
              onChange={e => {
                setTopic(e.target.value);
                if (fieldErrors.topic) setFieldErrors(prev => ({ ...prev, topic: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium ${
                fieldErrors.topic ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
              required
            />
            {fieldErrors.topic && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{fieldErrors.topic}</p>
            )}
          </div>

          {/* Duration (Pill selector pattern per UI/UX Brief) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Duration <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDurationOption(opt)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 ${
                    durationOption === opt
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt === 'custom' ? 'Custom' : `${opt} mins`}
                </button>
              ))}
            </div>

            {durationOption === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={customDuration}
                  onChange={e => setCustomDuration(Number(e.target.value))}
                  className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  placeholder="Minutes"
                />
                <span className="text-xs text-slate-500 font-medium">minutes</span>
              </div>
            )}
          </div>

          {/* Learning Objectives */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                Learning Objectives <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddObjective}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Objective</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              By the end of the lesson, students should be able to:
            </p>

            <div className="space-y-2">
              {objectives.map((obj, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <input
                    id={`input-objective-${index}`}
                    type="text"
                    placeholder={`Objective ${index + 1} (e.g. Define nutrition)`}
                    value={obj}
                    onChange={e => {
                      handleUpdateObjective(index, e.target.value);
                      if (fieldErrors.objectives) setFieldErrors(prev => ({ ...prev, objectives: undefined }));
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      fieldErrors.objectives && index === 0 ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  {objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove objective"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {fieldErrors.objectives && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{fieldErrors.objectives}</p>
            )}
          </div>
        </div>

        {/* Collapsible "Add more details" section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm text-slate-800 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>Add More Curriculum Details (Optional)</span>
            </div>
            {showMoreDetails ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showMoreDetails && (
            <div className="p-5 sm:p-6 border-t border-slate-100 space-y-4 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
                  <select
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Week</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={week}
                    onChange={e => setWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Number</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonNumber}
                    onChange={e => setLessonNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Students' Previous Knowledge
                </label>
                <textarea
                  rows={2}
                  placeholder="What students already know from preceding classes..."
                  value={previousKnowledge}
                  onChange={e => setPreviousKnowledge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Teaching Method
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discussion & Demonstration, Inquiry Method"
                  value={teachingMethod}
                  onChange={e => setTeachingMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Teaching Resources & Realia
                </label>
                <input
                  type="text"
                  placeholder="e.g. Charts, Models, Textbook, Whiteboard"
                  value={resources}
                  onChange={e => setResources(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Curriculum / Standard
                </label>
                <input
                  type="text"
                  placeholder="e.g. NERDC National Curriculum, WAEC Syllabus"
                  value={curriculum}
                  onChange={e => setCurriculum(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teacher's Special Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any particular points or emphasis..."
                  value={teacherNotes}
                  onChange={e => setTeacherNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Error notification at bottom of form so user sees it right above submit */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Unable to Submit Form</p>
                <p className="mt-0.5 text-xs text-rose-700">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveAsDraftFallback}
              className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap transition"
            >
              Save as Draft Instead
            </button>
          </div>
        )}

        {/* In-flow Action Buttons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            id="btn-create-lesson"
            form="create-lesson-form"
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-700 text-white font-bold text-sm shadow-md hover:bg-blue-800 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Creating lesson plan...' : '✨ Create Lesson Plan'}</span>
          </button>
        </div>

        {/* Sticky CTA docked above mobile bottom nav so it is never obscured */}
        <div className="fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-xl lg:hidden">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="btn-generate-lesson"
              form="create-lesson-form"
              disabled={isGenerating}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs shadow-md hover:bg-blue-800 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Creating...' : '✨ Create Lesson Plan'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Loading Modal / Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 mx-auto flex items-center justify-center">
              <Sparkles className="w-7 h-7 animate-pulse text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Generating Lesson Plan...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Structuring pedagogical objectives, teaching activities, and assessments for {selectedClass} {selectedSubject}.
              </p>
            </div>
            {/* Calm progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-[11px] text-slate-400">
              Usually completes within 3–6 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
