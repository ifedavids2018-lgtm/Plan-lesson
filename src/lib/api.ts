import {
  LessonPlan,
  Quiz,
  Homework,
  TimetableSlot,
  TeacherProfile,
  DashboardStats,
  ClassItem,
  SubjectItem,
} from '../types';

const API_BASE = '/api';

export async function fetchStats(teacherId?: string): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats${teacherId ? `?teacher_id=${teacherId}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchClasses(): Promise<ClassItem[]> {
  const res = await fetch(`${API_BASE}/classes`);
  if (!res.ok) throw new Error('Failed to fetch classes');
  return res.json();
}

export async function createCustomClass(name: string, teacherId?: string): Promise<ClassItem> {
  const res = await fetch(`${API_BASE}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, teacher_id: teacherId }),
  });
  if (!res.ok) throw new Error('Failed to create custom class');
  return res.json();
}

export async function fetchSubjects(): Promise<SubjectItem[]> {
  const res = await fetch(`${API_BASE}/subjects`);
  if (!res.ok) throw new Error('Failed to fetch subjects');
  return res.json();
}

export async function createCustomSubject(name: string, teacherId?: string): Promise<SubjectItem> {
  const res = await fetch(`${API_BASE}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, teacher_id: teacherId }),
  });
  if (!res.ok) throw new Error('Failed to create custom subject');
  return res.json();
}

export async function fetchLessons(params?: {
  teacher_id?: string;
  search?: string;
  subject?: string;
  class?: string;
  term?: string;
}): Promise<LessonPlan[]> {
  const query = new URLSearchParams();
  if (params?.teacher_id) query.set('teacher_id', params.teacher_id);
  if (params?.search) query.set('search', params.search);
  if (params?.subject && params.subject !== 'all') query.set('subject', params.subject);
  if (params?.class && params.class !== 'all') query.set('class', params.class);
  if (params?.term && params.term !== 'all') query.set('term', params.term);

  const res = await fetch(`${API_BASE}/lessons?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch lesson plans');
  return res.json();
}

export async function fetchLessonById(id: string): Promise<LessonPlan> {
  const res = await fetch(`${API_BASE}/lessons/${id}`);
  if (!res.ok) throw new Error('Failed to fetch lesson');
  return res.json();
}

export async function saveLesson(lesson: Partial<LessonPlan>): Promise<LessonPlan> {
  const isExisting = Boolean(lesson.id);
  const url = isExisting ? `${API_BASE}/lessons/${lesson.id}` : `${API_BASE}/lessons`;
  const method = isExisting ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lesson),
  });
  if (!res.ok) throw new Error('Failed to save lesson plan');
  return res.json();
}

export async function duplicateLesson(id: string): Promise<LessonPlan> {
  const res = await fetch(`${API_BASE}/lessons/${id}/duplicate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to duplicate lesson plan');
  return res.json();
}

export async function deleteLesson(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lessons/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete lesson plan');
}

export async function generateLessonAI(data: {
  class_name: string;
  subject: string;
  topic: string;
  duration: string;
  learning_objectives: string;
  previous_knowledge?: string;
  teaching_method?: string;
  resources?: string;
  curriculum?: string;
  teacher_notes?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/generate-lesson`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate lesson plan with AI');
  }
  const result = await res.json();
  return result.data;
}

export async function regenerateSectionAI(data: {
  section_name: string;
  option_type: string;
  custom_instruction?: string;
  class_name: string;
  subject: string;
  topic: string;
  current_content: any;
  lesson_plan_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/regenerate-section`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to regenerate section');
  const result = await res.json();
  return result.new_content;
}

export async function generateQuizAI(data: {
  lesson_plan_id?: string;
  topic: string;
  class_name: string;
  subject: string;
  question_count: number;
  question_type: string;
  difficulty: string;
  lesson_content?: any;
}): Promise<{ title: string; questions: any[] }> {
  const res = await fetch(`${API_BASE}/ai/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to generate quiz');
  const result = await res.json();
  return result.data;
}

export async function fetchQuizzes(teacherId?: string): Promise<Quiz[]> {
  const res = await fetch(`${API_BASE}/quizzes${teacherId ? `?teacher_id=${teacherId}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  return res.json();
}

export async function saveQuiz(quiz: Partial<Quiz>): Promise<Quiz> {
  const res = await fetch(`${API_BASE}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quiz),
  });
  if (!res.ok) throw new Error('Failed to save quiz');
  return res.json();
}

export async function deleteQuiz(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/quizzes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete quiz');
}

export async function generateHomeworkAI(data: {
  lesson_plan_id?: string;
  topic: string;
  class_name: string;
  subject: string;
  item_count: number;
  assignment_type: string;
  difficulty: string;
  lesson_content?: any;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/generate-homework`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to generate homework');
  const result = await res.json();
  return result.data;
}

export async function fetchHomework(teacherId?: string): Promise<Homework[]> {
  const res = await fetch(`${API_BASE}/homework${teacherId ? `?teacher_id=${teacherId}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch homework');
  return res.json();
}

export async function saveHomework(hw: Partial<Homework>): Promise<Homework> {
  const res = await fetch(`${API_BASE}/homework`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hw),
  });
  if (!res.ok) throw new Error('Failed to save homework');
  return res.json();
}

export async function deleteHomework(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/homework/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete homework');
}

export async function fetchTimetable(teacherId?: string): Promise<TimetableSlot[]> {
  const res = await fetch(`${API_BASE}/timetable${teacherId ? `?teacher_id=${teacherId}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch timetable');
  return res.json();
}

export async function saveTimetableSlot(slot: Partial<TimetableSlot>): Promise<TimetableSlot> {
  const isExisting = Boolean(slot.id);
  const url = isExisting ? `${API_BASE}/timetable/${slot.id}` : `${API_BASE}/timetable`;
  const method = isExisting ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slot),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save timetable slot');
  }
  return res.json();
}

export async function deleteTimetableSlot(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/timetable/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete timetable slot');
}

export async function logExportEvent(lesson_plan_id: string, export_type: 'pdf' | 'print'): Promise<void> {
  await fetch(`${API_BASE}/export-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lesson_plan_id, export_type }),
  }).catch(() => {});
}
