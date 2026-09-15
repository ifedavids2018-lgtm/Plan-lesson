import {
  LessonPlan,
  Quiz,
  Homework,
  TimetableSlot,
  DashboardStats,
  ClassItem,
  SubjectItem,
} from '../types';
import { auth } from './firebase';
import * as firestore from './firestoreService';
import { DEFAULT_CLASSES, DEFAULT_SUBJECTS } from '../data/defaultCurriculum';

const API_BASE = '/api';

/**
 * Returns the authenticated Firebase user UID, or null if not authenticated.
 */
function getAuthUid(): string | null {
  return auth.currentUser?.uid || null;
}

// -------------------------------------------------------------------
// Dashboard Stats
// -------------------------------------------------------------------

export async function fetchStats(teacherId?: string): Promise<DashboardStats> {
  const uid = getAuthUid();
  if (uid) {
    try {
      return await firestore.fetchUserStats(uid);
    } catch (err) {
      console.warn('Firestore fetchStats fallback to local:', err);
    }
  }

  try {
    const q = teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : '';
    const res = await fetch(`${API_BASE}/dashboard/stats${q}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Local fetchStats failed:', err);
  }

  return {
    totalLessonPlans: 0,
    thisWeek: 0,
    totalQuizzes: 0,
    totalSubjects: DEFAULT_SUBJECTS.length,
  };
}

// -------------------------------------------------------------------
// Classes & Subjects
// -------------------------------------------------------------------

export async function fetchClasses(): Promise<ClassItem[]> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const userClasses = await firestore.fetchUserClasses(uid);
      if (userClasses && userClasses.length > 0) {
        return userClasses;
      }
    } catch (err) {
      console.warn('Firestore fetchClasses fallback to local:', err);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/classes`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  return DEFAULT_CLASSES;
}

export async function createCustomClass(name: string, teacherId?: string): Promise<ClassItem> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const created = await firestore.createUserCustomClass(name, uid);
      // Sync to local server
      fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, teacher_id: uid }),
      }).catch(() => {});
      return created;
    } catch (err) {
      console.warn('Firestore createCustomClass fallback to local:', err);
    }
  }

  const res = await fetch(`${API_BASE}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, teacher_id: teacherId || 'teacher-demo-001' }),
  });
  if (!res.ok) {
    return {
      id: `class-${Date.now()}`,
      name,
      is_custom: true,
      created_by: teacherId || 'teacher-demo-001',
    };
  }
  return res.json();
}

export async function fetchSubjects(): Promise<SubjectItem[]> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const userSubjects = await firestore.fetchUserSubjects(uid);
      if (userSubjects && userSubjects.length > 0) {
        return userSubjects;
      }
    } catch (err) {
      console.warn('Firestore fetchSubjects fallback to local:', err);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/subjects`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  return DEFAULT_SUBJECTS;
}

export async function createCustomSubject(name: string, teacherId?: string): Promise<SubjectItem> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const created = await firestore.createUserCustomSubject(name, uid);
      fetch(`${API_BASE}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, teacher_id: uid }),
      }).catch(() => {});
      return created;
    } catch (err) {
      console.warn('Firestore createCustomSubject fallback to local:', err);
    }
  }

  const res = await fetch(`${API_BASE}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, teacher_id: teacherId || 'teacher-demo-001' }),
  });
  if (!res.ok) {
    return {
      id: `subj-${Date.now()}`,
      name,
      is_custom: true,
      created_by: teacherId || 'teacher-demo-001',
    };
  }
  return res.json();
}

// -------------------------------------------------------------------
// Lessons
// -------------------------------------------------------------------

export async function fetchLessons(params?: {
  teacher_id?: string;
  search?: string;
  subject?: string;
  class?: string;
  term?: string;
}): Promise<LessonPlan[]> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const cloudLessons = await firestore.fetchUserLessons(uid, params);
      if (cloudLessons.length > 0) {
        return cloudLessons;
      }
    } catch (err) {
      console.warn('Firestore fetchLessons fallback to local:', err);
    }
  }

  const query = new URLSearchParams();
  if (params?.teacher_id) query.set('teacher_id', params.teacher_id);
  if (params?.search) query.set('search', params.search);
  if (params?.subject) query.set('subject', params.subject);
  if (params?.class) query.set('class', params.class);
  if (params?.term) query.set('term', params.term);

  try {
    const res = await fetch(`${API_BASE}/lessons?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn('Local fetchLessons failed:', err);
  }
  return [];
}

export async function fetchLessonById(id: string): Promise<LessonPlan> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const lesson = await firestore.fetchUserLessonById(uid, id);
      if (lesson) return lesson;
    } catch (err) {
      console.warn('Firestore fetchLessonById fallback to local:', err);
    }
  }

  const res = await fetch(`${API_BASE}/lessons/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Lesson plan not found');
  return res.json();
}

export async function saveLesson(lesson: Partial<LessonPlan>): Promise<LessonPlan> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const saved = await firestore.saveUserLesson(uid, {
        ...lesson,
        teacher_id: uid,
      });
      // Fire-and-forget sync to local server
      fetch(`${API_BASE}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch(() => {});
      return saved;
    } catch (err) {
      console.warn('Firestore saveLesson failed, falling back to local backend:', err);
    }
  }

  // Fallback to local server
  const fallbackPayload = {
    ...lesson,
    teacher_id: lesson.teacher_id || 'teacher-demo-001',
  };

  try {
    const res = await fetch(`${API_BASE}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackPayload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Local saveLesson failed:', err);
  }

  // In-memory fallback if even local server request had issues
  const fallbackId = lesson.id || `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    ...(fallbackPayload as any),
    id: fallbackId,
    created_at: lesson.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function duplicateLesson(id: string): Promise<LessonPlan> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const original = await firestore.fetchUserLessonById(uid, id);
      if (original) {
        const copyData: Partial<LessonPlan> = {
          ...original,
          id: undefined,
          topic: `${original.topic} (Copy)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return await firestore.saveUserLesson(uid, copyData);
      }
    } catch (err) {
      console.warn('Firestore duplicateLesson fallback to local:', err);
    }
  }

  const res = await fetch(`${API_BASE}/lessons/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to duplicate lesson plan');
  return res.json();
}

export async function deleteLesson(id: string): Promise<void> {
  const uid = getAuthUid();
  if (uid) {
    try {
      await firestore.deleteUserLesson(uid, id);
    } catch (err) {
      console.warn('Firestore deleteLesson fallback to local:', err);
    }
  }

  await fetch(`${API_BASE}/lessons/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

// -------------------------------------------------------------------
// Quizzes
// -------------------------------------------------------------------

export async function fetchQuizzes(teacherId?: string): Promise<Quiz[]> {
  const uid = getAuthUid();
  if (uid) {
    try {
      return await firestore.fetchUserQuizzes(uid);
    } catch (err) {
      console.warn('Firestore fetchQuizzes fallback to local:', err);
    }
  }

  try {
    const q = teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : '';
    const res = await fetch(`${API_BASE}/quizzes${q}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn('Local fetchQuizzes failed:', err);
  }
  return [];
}

export async function saveQuiz(quiz: Partial<Quiz>): Promise<Quiz> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const saved = await firestore.saveUserQuiz(uid, {
        ...quiz,
        teacher_id: uid,
      });
      fetch(`${API_BASE}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch(() => {});
      return saved;
    } catch (err) {
      console.warn('Firestore saveQuiz fallback to local:', err);
    }
  }

  const fallbackPayload = {
    ...quiz,
    teacher_id: quiz.teacher_id || 'teacher-demo-001',
  };

  try {
    const res = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackPayload),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Local saveQuiz failed:', err);
  }

  const id = quiz.id || `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    ...(fallbackPayload as any),
    id,
    created_at: quiz.created_at || new Date().toISOString(),
  };
}

export async function deleteQuiz(id: string): Promise<void> {
  const uid = getAuthUid();
  if (uid) {
    try {
      await firestore.deleteUserQuiz(uid, id);
    } catch (err) {
      console.warn('Firestore deleteQuiz fallback to local:', err);
    }
  }

  await fetch(`${API_BASE}/quizzes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

// -------------------------------------------------------------------
// Homework
// -------------------------------------------------------------------

export async function fetchHomework(teacherId?: string): Promise<Homework[]> {
  const uid = getAuthUid();
  if (uid) {
    try {
      return await firestore.fetchUserHomework(uid);
    } catch (err) {
      console.warn('Firestore fetchHomework fallback to local:', err);
    }
  }

  try {
    const q = teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : '';
    const res = await fetch(`${API_BASE}/homework${q}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn('Local fetchHomework failed:', err);
  }
  return [];
}

export async function saveHomework(hw: Partial<Homework>): Promise<Homework> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const saved = await firestore.saveUserHomework(uid, {
        ...hw,
        teacher_id: uid,
      });
      fetch(`${API_BASE}/homework`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch(() => {});
      return saved;
    } catch (err) {
      console.warn('Firestore saveHomework fallback to local:', err);
    }
  }

  const fallbackPayload = {
    ...hw,
    teacher_id: hw.teacher_id || 'teacher-demo-001',
  };

  try {
    const res = await fetch(`${API_BASE}/homework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackPayload),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Local saveHomework failed:', err);
  }

  const id = hw.id || `hw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    ...(fallbackPayload as any),
    id,
    created_at: hw.created_at || new Date().toISOString(),
  };
}

export async function deleteHomework(id: string): Promise<void> {
  const uid = getAuthUid();
  if (uid) {
    try {
      await firestore.deleteUserHomework(uid, id);
    } catch (err) {
      console.warn('Firestore deleteHomework fallback to local:', err);
    }
  }

  await fetch(`${API_BASE}/homework/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

// -------------------------------------------------------------------
// Timetable
// -------------------------------------------------------------------

export async function fetchTimetable(teacherId?: string): Promise<TimetableSlot[]> {
  const uid = getAuthUid();
  if (uid) {
    try {
      return await firestore.fetchUserTimetable(uid);
    } catch (err) {
      console.warn('Firestore fetchTimetable fallback to local:', err);
    }
  }

  try {
    const q = teacherId ? `?teacher_id=${encodeURIComponent(teacherId)}` : '';
    const res = await fetch(`${API_BASE}/timetable${q}`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn('Local fetchTimetable failed:', err);
  }
  return [];
}

export async function saveTimetableSlot(slot: Partial<TimetableSlot>): Promise<TimetableSlot> {
  const uid = getAuthUid();
  if (uid) {
    try {
      const saved = await firestore.saveUserTimetableSlot(uid, {
        ...slot,
        teacher_id: uid,
      });
      fetch(`${API_BASE}/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      }).catch(() => {});
      return saved;
    } catch (err) {
      console.warn('Firestore saveTimetableSlot fallback to local:', err);
    }
  }

  const fallbackPayload = {
    ...slot,
    teacher_id: slot.teacher_id || 'teacher-demo-001',
  };

  try {
    const res = await fetch(`${API_BASE}/timetable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackPayload),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Local saveTimetableSlot failed:', err);
  }

  const id = slot.id || `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    ...(fallbackPayload as any),
    id,
  };
}

export async function deleteTimetableSlot(id: string): Promise<void> {
  const uid = getAuthUid();
  if (uid) {
    try {
      await firestore.deleteUserTimetableSlot(uid, id);
    } catch (err) {
      console.warn('Firestore deleteTimetableSlot fallback to local:', err);
    }
  }

  await fetch(`${API_BASE}/timetable/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
}

// -------------------------------------------------------------------
// AI Generation (Kept Server-Side with Gemini API Proxy)
// -------------------------------------------------------------------

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

export async function logExportEvent(lesson_plan_id: string, export_type: 'pdf' | 'print'): Promise<void> {
  await fetch(`${API_BASE}/export-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lesson_plan_id, export_type }),
  }).catch(() => {});
}
