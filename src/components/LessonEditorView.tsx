import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LessonPlan, TeachingActivity } from '../types';
import { saveLesson, regenerateSectionAI, logExportEvent } from '../lib/api';
import { generateLessonPlanPDF } from '../lib/pdf';
import {
  Edit3,
  Sparkles,
  Save,
  Copy,
  Printer,
  FileDown,
  FileQuestion,
  GraduationCap,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Clock,
  BookOpen,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LessonEditorViewProps {
  lesson: LessonPlan;
  onLessonUpdated: (lesson: LessonPlan) => void;
  onNavigate: (view: string, lessonId?: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const LessonEditorView: React.FC<LessonEditorViewProps> = ({
  lesson: initialLesson,
  onLessonUpdated,
  onNavigate,
  onShowToast,
}) => {
  const { teacher } = useAuth();
  const [lesson, setLesson] = useState<LessonPlan>(initialLesson);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<any>(null);

  // Regeneration modal state
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [regenOption, setRegenOption] = useState<string>('engaging');
  const [customRegenPrompt, setCustomRegenPrompt] = useState<string>('');
  const [isSectionLoading, setIsSectionLoading] = useState<string | null>(null);

  // Autosave status
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Collapsible section state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLesson(initialLesson);
    if (initialLesson.updated_at) {
      const d = new Date(initialLesson.updated_at);
      setLastSavedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [initialLesson]);

  const toggleCollapse = (sectionKey: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleStartEdit = (sectionKey: string, currentValue: any) => {
    setEditingSection(sectionKey);
    setEditingValue(JSON.parse(JSON.stringify(currentValue)));
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditingValue(null);
  };

  const handleSaveSection = async (sectionKey: string) => {
    const updatedLesson = {
      ...lesson,
      [sectionKey]: editingValue,
      updated_at: new Date().toISOString(),
    };

    setLesson(updatedLesson);
    setEditingSection(null);
    setEditingValue(null);

    try {
      setIsSaving(true);
      const saved = await saveLesson(updatedLesson);
      onLessonUpdated(saved);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      onShowToast('Section updated and saved.', 'success');
    } catch (e) {
      console.error(e);
      onShowToast('Failed to autosave changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRegenerate = (sectionKey: string) => {
    setRegeneratingSection(sectionKey);
    setRegenOption('engaging');
    setCustomRegenPrompt('');
  };

  const handleConfirmRegenerate = async () => {
    if (!regeneratingSection) return;
    const targetSection = regeneratingSection;
    setRegeneratingSection(null);
    setIsSectionLoading(targetSection);

    try {
      const currentContent = (lesson as any)[targetSection];
      const newContent = await regenerateSectionAI({
        section_name: targetSection,
        option_type: regenOption,
        custom_instruction: customRegenPrompt,
        class_name: lesson.class_name_snapshot,
        subject: lesson.subject_name_snapshot,
        topic: lesson.topic,
        current_content: currentContent,
        lesson_plan_id: lesson.id,
      });

      const updated = {
        ...lesson,
        [targetSection]: newContent,
        updated_at: new Date().toISOString(),
      };

      setLesson(updated);
      const saved = await saveLesson(updated);
      onLessonUpdated(saved);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      onShowToast(`Regenerated ${targetSection.replace(/_/g, ' ')} successfully.`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to regenerate section. Please try again.', 'error');
    } finally {
      setIsSectionLoading(null);
    }
  };

  const handleSaveWholeLesson = async () => {
    try {
      setIsSaving(true);
      const updated = {
        ...lesson,
        status: 'saved' as const,
        updated_at: new Date().toISOString(),
      };
      const saved = await saveLesson(updated);
      setLesson(saved);
      onLessonUpdated(saved);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);
      onShowToast('Lesson plan saved successfully.', 'success');
    } catch (e) {
      onShowToast('Could not save lesson plan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    try {
      setIsSaving(true);
      const clone = {
        ...lesson,
        id: undefined,
        topic: `${lesson.topic} (Copy)`,
        status: 'saved' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const saved = await saveLesson(clone);
      setLesson(saved);
      onLessonUpdated(saved);
      onShowToast('Saved as a new lesson plan.', 'success');
    } catch (e) {
      onShowToast('Could not duplicate lesson.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    logExportEvent(lesson.id, 'print');
    window.print();
  };

  const handleExportPDF = () => {
    logExportEvent(lesson.id, 'pdf');
    generateLessonPlanPDF(lesson, teacher);
    onShowToast('Lesson plan PDF exported.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in">
      {/* Top Header & Meta */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                {lesson.class_name_snapshot}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                {lesson.subject_name_snapshot}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {lesson.duration_minutes_custom || lesson.duration_option} mins
              </span>
              {lesson.is_ai_generated && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  AI-generated • edit as needed
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              {lesson.topic}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lesson.term || 'First Term'} • Week {lesson.week || 1} • {lesson.curriculum_standard || 'NERDC Standard'}
            </p>
          </div>

          {/* Autosave status indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isSaving ? 'Saving changes...' : lastSavedTime ? `Saved at ${lastSavedTime}` : 'All changes saved'}</span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveWholeLesson}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-700 text-white hover:bg-blue-800 transition active:scale-95 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleSaveAsNew}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Save as New</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition active:scale-95"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            onClick={() => onNavigate('quiz', lesson.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition active:scale-95"
          >
            <FileQuestion className="w-3.5 h-3.5 text-amber-600" />
            <span>Generate Quiz</span>
          </button>

          <button
            onClick={() => onNavigate('homework', lesson.id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100 transition active:scale-95"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Generate Homework</span>
          </button>

          <button
            onClick={() => onNavigate('timetable')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-900 border border-purple-200/80 hover:bg-purple-100 transition active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Add to Timetable</span>
          </button>
        </div>
      </div>

      {/* Sections List matching PRD Sections A to J */}
      <div className="space-y-4">
        {/* 1. Learning Objectives */}
        <SectionCard
          title="1. Learning Objectives (Behavioral)"
          sectionKey="learning_objectives"
          isEditing={editingSection === 'learning_objectives'}
          isLoading={isSectionLoading === 'learning_objectives'}
          isCollapsed={collapsedSections['learning_objectives']}
          onToggleCollapse={() => toggleCollapse('learning_objectives')}
          onEdit={() => handleStartEdit('learning_objectives', lesson.learning_objectives)}
          onRegenerate={() => handleOpenRegenerate('learning_objectives')}
        >
          {editingSection === 'learning_objectives' ? (
            <div className="space-y-3">
              {Array.isArray(editingValue) &&
                editingValue.map((obj: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={obj}
                      onChange={e => {
                        const next = [...editingValue];
                        next[i] = e.target.value;
                        setEditingValue(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingValue(editingValue.filter((_: any, idx: number) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              <button
                type="button"
                onClick={() => setEditingValue([...editingValue, ''])}
                className="text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                + Add Another Objective
              </button>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSaveSection('learning_objectives')}
                  className="px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
                >
                  Save Section
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <ul className="list-decimal list-inside space-y-1.5 text-sm text-slate-800">
              {lesson.learning_objectives.map((obj, i) => (
                <li key={i} className="leading-relaxed">
                  {obj}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* 2. Previous Knowledge */}
        <SectionCard
          title="2. Students' Previous Knowledge"
          sectionKey="previous_knowledge"
          isEditing={editingSection === 'previous_knowledge'}
          isLoading={isSectionLoading === 'previous_knowledge'}
          isCollapsed={collapsedSections['previous_knowledge']}
          onToggleCollapse={() => toggleCollapse('previous_knowledge')}
          onEdit={() => handleStartEdit('previous_knowledge', lesson.previous_knowledge)}
          onRegenerate={() => handleOpenRegenerate('previous_knowledge')}
        >
          {editingSection === 'previous_knowledge' ? (
            <TextEditor
              value={editingValue}
              onChange={setEditingValue}
              onSave={() => handleSaveSection('previous_knowledge')}
              onCancel={handleCancelEdit}
            />
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed">{lesson.previous_knowledge}</p>
          )}
        </SectionCard>

        {/* 3. Instructional Materials */}
        <SectionCard
          title="3. Instructional Materials & Realia"
          sectionKey="instructional_materials"
          isEditing={editingSection === 'instructional_materials'}
          isLoading={isSectionLoading === 'instructional_materials'}
          isCollapsed={collapsedSections['instructional_materials']}
          onToggleCollapse={() => toggleCollapse('instructional_materials')}
          onEdit={() => handleStartEdit('instructional_materials', lesson.instructional_materials)}
          onRegenerate={() => handleOpenRegenerate('instructional_materials')}
        >
          {editingSection === 'instructional_materials' ? (
            <div className="space-y-3">
              {Array.isArray(editingValue) &&
                editingValue.map((mat: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mat}
                      onChange={e => {
                        const next = [...editingValue];
                        next[i] = e.target.value;
                        setEditingValue(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingValue(editingValue.filter((_: any, idx: number) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              <button
                type="button"
                onClick={() => setEditingValue([...editingValue, ''])}
                className="text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                + Add Material
              </button>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSaveSection('instructional_materials')}
                  className="px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
                >
                  Save Section
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
              {lesson.instructional_materials.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* 4. Introduction */}
        <SectionCard
          title="4. Introduction / Set Induction"
          sectionKey="introduction"
          isEditing={editingSection === 'introduction'}
          isLoading={isSectionLoading === 'introduction'}
          isCollapsed={collapsedSections['introduction']}
          onToggleCollapse={() => toggleCollapse('introduction')}
          onEdit={() => handleStartEdit('introduction', lesson.introduction)}
          onRegenerate={() => handleOpenRegenerate('introduction')}
        >
          {editingSection === 'introduction' ? (
            <TextEditor
              value={editingValue}
              onChange={setEditingValue}
              onSave={() => handleSaveSection('introduction')}
              onCancel={handleCancelEdit}
            />
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{lesson.introduction}</p>
          )}
        </SectionCard>

        {/* 5. Lesson Content */}
        <SectionCard
          title="5. Core Lesson Content"
          sectionKey="lesson_content"
          isEditing={editingSection === 'lesson_content'}
          isLoading={isSectionLoading === 'lesson_content'}
          isCollapsed={collapsedSections['lesson_content']}
          onToggleCollapse={() => toggleCollapse('lesson_content')}
          onEdit={() => handleStartEdit('lesson_content', lesson.lesson_content)}
          onRegenerate={() => handleOpenRegenerate('lesson_content')}
        >
          {editingSection === 'lesson_content' ? (
            <TextEditor
              value={editingValue}
              onChange={setEditingValue}
              onSave={() => handleSaveSection('lesson_content')}
              onCancel={handleCancelEdit}
              rows={6}
            />
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{lesson.lesson_content}</p>
          )}
        </SectionCard>

        {/* 6. Teaching Activities (Step 1 to Step 5) */}
        <SectionCard
          title="6. Teacher Activities & Presentation Steps"
          sectionKey="teaching_activities"
          isEditing={editingSection === 'teaching_activities'}
          isLoading={isSectionLoading === 'teaching_activities'}
          isCollapsed={collapsedSections['teaching_activities']}
          onToggleCollapse={() => toggleCollapse('teaching_activities')}
          onEdit={() => handleStartEdit('teaching_activities', lesson.teaching_activities)}
          onRegenerate={() => handleOpenRegenerate('teaching_activities')}
        >
          {editingSection === 'teaching_activities' ? (
            <div className="space-y-4">
              {Array.isArray(editingValue) &&
                editingValue.map((act: TeachingActivity, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <input
                      type="text"
                      placeholder="Step Title (e.g. Step 1 — Introduction)"
                      value={act.step_title}
                      onChange={e => {
                        const next = [...editingValue];
                        next[i] = { ...next[i], step_title: e.target.value };
                        setEditingValue(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs sm:text-sm text-blue-900"
                    />
                    <textarea
                      rows={2}
                      placeholder="Activity Description"
                      value={act.description}
                      onChange={e => {
                        const next = [...editingValue];
                        next[i] = { ...next[i], description: e.target.value };
                        setEditingValue(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800"
                    />
                  </div>
                ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSaveSection('teaching_activities')}
                  className="px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
                >
                  Save Section
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lesson.teaching_activities.map((step, i) => (
                <div key={i} className="border-l-3 border-blue-600 pl-3 py-0.5">
                  <h4 className="font-bold text-xs sm:text-sm text-blue-900">{step.step_title}</h4>
                  <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 7. Student Activities */}
        <SectionCard
          title="7. Student Participation & Activities"
          sectionKey="student_activities"
          isEditing={editingSection === 'student_activities'}
          isLoading={isSectionLoading === 'student_activities'}
          isCollapsed={collapsedSections['student_activities']}
          onToggleCollapse={() => toggleCollapse('student_activities')}
          onEdit={() => handleStartEdit('student_activities', lesson.student_activities)}
          onRegenerate={() => handleOpenRegenerate('student_activities')}
        >
          {editingSection === 'student_activities' ? (
            <div className="space-y-3">
              {Array.isArray(editingValue) &&
                editingValue.map((act: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={act}
                      onChange={e => {
                        const next = [...editingValue];
                        next[i] = e.target.value;
                        setEditingValue(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingValue(editingValue.filter((_: any, idx: number) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              <button
                type="button"
                onClick={() => setEditingValue([...editingValue, ''])}
                className="text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                + Add Student Activity
              </button>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSaveSection('student_activities')}
                  className="px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
                >
                  Save Section
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-800">
              {lesson.student_activities.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* 8. Assessment */}
        <SectionCard
          title="8. Formative Assessment & Evaluation"
          sectionKey="assessment"
          isEditing={editingSection === 'assessment'}
          isLoading={isSectionLoading === 'assessment'}
          isCollapsed={collapsedSections['assessment']}
          onToggleCollapse={() => toggleCollapse('assessment')}
          onEdit={() => handleStartEdit('assessment', lesson.assessment)}
          onRegenerate={() => handleOpenRegenerate('assessment')}
        >
          {editingSection === 'assessment' ? (
            <TextEditor
              value={editingValue}
              onChange={setEditingValue}
              onSave={() => handleSaveSection('assessment')}
              onCancel={handleCancelEdit}
            />
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{lesson.assessment}</p>
          )}
        </SectionCard>

        {/* 9. Conclusion */}
        <SectionCard
          title="9. Conclusion & Synthesis"
          sectionKey="conclusion"
          isEditing={editingSection === 'conclusion'}
          isLoading={isSectionLoading === 'conclusion'}
          isCollapsed={collapsedSections['conclusion']}
          onToggleCollapse={() => toggleCollapse('conclusion')}
          onEdit={() => handleStartEdit('conclusion', lesson.conclusion)}
          onRegenerate={() => handleOpenRegenerate('conclusion')}
        >
          {editingSection === 'conclusion' ? (
            <TextEditor
              value={editingValue}
              onChange={setEditingValue}
              onSave={() => handleSaveSection('conclusion')}
              onCancel={handleCancelEdit}
            />
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{lesson.conclusion}</p>
          )}
        </SectionCard>

        {/* 10. Homework */}
        <SectionCard
          title="10. Homework Assignment"
          sectionKey="homework_summary"
          isEditing={editingSection === 'homework_summary'}
          isLoading={isSectionLoading === 'homework_summary'}
          isCollapsed={collapsedSections['homework_summary']}
          onToggleCollapse={() => toggleCollapse('homework_summary')}
          onEdit={() => handleStartEdit('homework_summary', lesson.homework_summary)}
          onRegenerate={() => handleOpenRegenerate('homework_summary')}
        >
          {editingSection === 'homework_summary' ? (
            <TextEditor
              value={editingValue}
              onChange={setEditingValue}
              onSave={() => handleSaveSection('homework_summary')}
              onCancel={handleCancelEdit}
            />
          ) : (
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{lesson.homework_summary}</p>
          )}
        </SectionCard>
      </div>

      {/* AI Regenerate Modal */}
      {regeneratingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Regenerate {regeneratingSection.replace(/_/g, ' ')}
              </h3>
              <button
                onClick={() => setRegeneratingSection(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500">
                What would you like the AI to improve for this section?
              </p>

              <div className="space-y-2">
                {[
                  { id: 'engaging', label: 'Make it more engaging & interactive' },
                  { id: 'simpler', label: `Make it simpler for ${lesson.class_name_snapshot} students` },
                  { id: 'practical', label: 'Add practical local Nigerian examples & realia' },
                  { id: 'different', label: 'Generate a completely different alternative' },
                  { id: 'custom', label: 'Custom prompt / instruction' },
                ].map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition ${
                      regenOption === opt.id
                        ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="regenOption"
                      value={opt.id}
                      checked={regenOption === opt.id}
                      onChange={() => setRegenOption(opt.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              {regenOption === 'custom' && (
                <div className="mt-2">
                  <textarea
                    rows={2}
                    placeholder="e.g. Focus specifically on autotrophic vs heterotrophic modes with local cassava examples..."
                    value={customRegenPrompt}
                    onChange={e => setCustomRegenPrompt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setRegeneratingSection(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegenerate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Regenerate Section</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Section Card with inline action buttons
interface SectionCardProps {
  title: string;
  sectionKey: string;
  isEditing: boolean;
  isLoading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  sectionKey,
  isEditing,
  isLoading,
  isCollapsed,
  onToggleCollapse,
  onEdit,
  onRegenerate,
  children,
}) => {
  return (
    <div
      id={`section-${sectionKey}`}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition hover:border-slate-300"
    >
      <div className="flex items-center justify-between p-4 bg-slate-50/70 border-b border-slate-100">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-800 hover:text-blue-800 transition text-left"
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
          <span>{title}</span>
        </button>

        {!isEditing && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/60 transition"
              title="Edit section"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Edit</span>
            </button>
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition"
              title="Regenerate this section with AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden xs:inline">Regenerate</span>
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                <span>Regenerating section with AI...</span>
              </div>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

// Generic Text Editor inside card
const TextEditor: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  onCancel: () => void;
  rows?: number;
}> = ({ value, onChange, onSave, onCancel, rows = 3 }) => {
  return (
    <div className="space-y-3">
      <textarea
        rows={rows}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="px-3.5 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
        >
          Save Section
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
