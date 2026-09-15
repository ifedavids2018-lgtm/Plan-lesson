import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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
import { DEFAULT_CLASSES, DEFAULT_SUBJECTS } from '../data/defaultCurriculum';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// -------------------------------------------------------------------
// Teacher Profile
// -------------------------------------------------------------------

export async function getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
  const path = `teachers/${teacherId}`;
  try {
    const docRef = doc(db, 'teachers', teacherId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as TeacherProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveTeacherProfile(profile: TeacherProfile): Promise<TeacherProfile> {
  const path = `teachers/${profile.id}`;
  try {
    const docRef = doc(db, 'teachers', profile.id);
    const clean = sanitizeForFirestore(profile);
    await setDoc(docRef, clean, { merge: true });
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------------
// Lessons
// -------------------------------------------------------------------

export async function fetchUserLessons(
  teacherId: string,
  params?: {
    search?: string;
    subject?: string;
    class?: string;
    term?: string;
  }
): Promise<LessonPlan[]> {
  const path = `teachers/${teacherId}/lessons`;
  try {
    const lessonsCol = collection(db, 'teachers', teacherId, 'lessons');
    const q = query(lessonsCol, orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    let lessons = snap.docs.map(d => ({ ...(d.data() as LessonPlan), id: d.id }));

    // Client-side filtering
    if (params?.search) {
      const term = params.search.toLowerCase();
      lessons = lessons.filter(
        l =>
          l.topic.toLowerCase().includes(term) ||
          l.subject_name_snapshot.toLowerCase().includes(term) ||
          l.class_name_snapshot.toLowerCase().includes(term)
      );
    }
    if (params?.subject && params.subject !== 'all') {
      lessons = lessons.filter(l => l.subject_name_snapshot === params.subject);
    }
    if (params?.class && params.class !== 'all') {
      lessons = lessons.filter(l => l.class_name_snapshot === params.class);
    }
    if (params?.term && params.term !== 'all') {
      lessons = lessons.filter(l => l.term === params.term);
    }

    return lessons;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchUserLessonById(teacherId: string, lessonId: string): Promise<LessonPlan | null> {
  const path = `teachers/${teacherId}/lessons/${lessonId}`;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'lessons', lessonId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { ...(snap.data() as LessonPlan), id: snap.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserLesson(teacherId: string, lesson: Partial<LessonPlan>): Promise<LessonPlan> {
  const lessonId = lesson.id || `lesson-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `teachers/${teacherId}/lessons/${lessonId}`;
  try {
    const now = new Date().toISOString();
    const completeLesson: LessonPlan = {
      id: lessonId,
      teacher_id: teacherId,
      class_name_snapshot: lesson.class_name_snapshot || 'General Class',
      subject_name_snapshot: lesson.subject_name_snapshot || 'General Subject',
      topic: lesson.topic || 'Untitled Lesson',
      duration_option: lesson.duration_option || '40',
      duration_minutes_custom: lesson.duration_minutes_custom ?? null,
      lesson_date: lesson.lesson_date || null,
      term: lesson.term || 'Term 1',
      week: lesson.week ?? 1,
      lesson_number: lesson.lesson_number ?? 1,
      learning_objectives: lesson.learning_objectives || [],
      previous_knowledge: lesson.previous_knowledge || '',
      instructional_materials: lesson.instructional_materials || [],
      introduction: lesson.introduction || '',
      lesson_content: lesson.lesson_content || '',
      teaching_activities: lesson.teaching_activities || [],
      student_activities: lesson.student_activities || [],
      assessment: lesson.assessment || '',
      conclusion: lesson.conclusion || '',
      homework_summary: lesson.homework_summary || '',
      status: lesson.status || 'saved',
      is_ai_generated: lesson.is_ai_generated ?? false,
      created_at: lesson.created_at || now,
      updated_at: now,
      ...lesson,
    };

    const docRef = doc(db, 'teachers', teacherId, 'lessons', lessonId);
    const clean = sanitizeForFirestore(completeLesson);
    await setDoc(docRef, clean, { merge: true });
    return completeLesson;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserLesson(teacherId: string, lessonId: string): Promise<void> {
  const path = `teachers/${teacherId}/lessons/${lessonId}`;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'lessons', lessonId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------
// Quizzes
// -------------------------------------------------------------------

export async function fetchUserQuizzes(teacherId: string): Promise<Quiz[]> {
  const path = `teachers/${teacherId}/quizzes`;
  try {
    const colRef = collection(db, 'teachers', teacherId, 'quizzes');
    const q = query(colRef, orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as Quiz), id: d.id }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveUserQuiz(teacherId: string, quiz: Partial<Quiz>): Promise<Quiz> {
  const quizId = quiz.id || `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `teachers/${teacherId}/quizzes/${quizId}`;
  try {
    const now = new Date().toISOString();
    const completeQuiz: Quiz = {
      id: quizId,
      teacher_id: teacherId,
      title: quiz.title || 'Quiz Assessment',
      topic: quiz.topic || 'Class Assessment',
      class_name: quiz.class_name || 'Class',
      subject_name: quiz.subject_name || 'Subject',
      question_type: quiz.question_type || 'mixed',
      difficulty: quiz.difficulty || 'medium',
      question_count: quiz.question_count || quiz.questions?.length || 5,
      questions: quiz.questions || [],
      created_at: quiz.created_at || now,
      updated_at: now,
      ...quiz,
    };

    const docRef = doc(db, 'teachers', teacherId, 'quizzes', quizId);
    const clean = sanitizeForFirestore(completeQuiz);
    await setDoc(docRef, clean, { merge: true });
    return completeQuiz;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserQuiz(teacherId: string, quizId: string): Promise<void> {
  const path = `teachers/${teacherId}/quizzes/${quizId}`;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'quizzes', quizId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------
// Homework
// -------------------------------------------------------------------

export async function fetchUserHomework(teacherId: string): Promise<Homework[]> {
  const path = `teachers/${teacherId}/homework`;
  try {
    const colRef = collection(db, 'teachers', teacherId, 'homework');
    const q = query(colRef, orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...(d.data() as Homework), id: d.id }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveUserHomework(teacherId: string, hw: Partial<Homework>): Promise<Homework> {
  const hwId = hw.id || `hw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `teachers/${teacherId}/homework/${hwId}`;
  try {
    const now = new Date().toISOString();
    const completeHomework: Homework = {
      id: hwId,
      teacher_id: teacherId,
      title: hw.title || 'Homework Assignment',
      topic: hw.topic || 'Class Assignment',
      class_name: hw.class_name || 'Class',
      subject_name: hw.subject_name || 'Subject',
      homework_type: hw.homework_type || 'questions',
      difficulty: hw.difficulty || 'medium',
      instructions: hw.instructions || '',
      questions: hw.questions || [],
      created_at: hw.created_at || now,
      updated_at: now,
      ...hw,
    };

    const docRef = doc(db, 'teachers', teacherId, 'homework', hwId);
    const clean = sanitizeForFirestore(completeHomework);
    await setDoc(docRef, clean, { merge: true });
    return completeHomework;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserHomework(teacherId: string, hwId: string): Promise<void> {
  const path = `teachers/${teacherId}/homework/${hwId}`;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'homework', hwId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------
// Timetable
// -------------------------------------------------------------------

export async function fetchUserTimetable(teacherId: string): Promise<TimetableSlot[]> {
  const path = `teachers/${teacherId}/timetable`;
  try {
    const colRef = collection(db, 'teachers', teacherId, 'timetable');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ ...(d.data() as TimetableSlot), id: d.id }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveUserTimetableSlot(
  teacherId: string,
  slot: Partial<TimetableSlot>
): Promise<TimetableSlot> {
  const slotId = slot.id || `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `teachers/${teacherId}/timetable/${slotId}`;
  try {
    const now = new Date().toISOString();
    const completeSlot: TimetableSlot = {
      id: slotId,
      teacher_id: teacherId,
      day_of_week: slot.day_of_week || 'monday',
      start_time: slot.start_time || '08:00',
      end_time: slot.end_time || '08:40',
      class_name: slot.class_name || 'Class',
      subject_name: slot.subject_name || 'Subject',
      room: slot.room || null,
      lesson_plan_id: slot.lesson_plan_id || null,
      lesson_title: slot.lesson_title || null,
      created_at: slot.created_at || now,
      updated_at: now,
      ...slot,
    };

    const docRef = doc(db, 'teachers', teacherId, 'timetable', slotId);
    const clean = sanitizeForFirestore(completeSlot);
    await setDoc(docRef, clean, { merge: true });
    return completeSlot;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserTimetableSlot(teacherId: string, slotId: string): Promise<void> {
  const path = `teachers/${teacherId}/timetable/${slotId}`;
  try {
    const docRef = doc(db, 'teachers', teacherId, 'timetable', slotId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------------
// Dashboard Stats
// -------------------------------------------------------------------

export async function fetchUserStats(teacherId: string): Promise<DashboardStats> {
  try {
    const [lessons, quizzes] = await Promise.all([
      fetchUserLessons(teacherId),
      fetchUserQuizzes(teacherId),
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeek = lessons.filter(l => new Date(l.created_at) >= oneWeekAgo).length;
    const uniqueSubjects = new Set(lessons.map(l => l.subject_name_snapshot).filter(Boolean));

    return {
      totalLessonPlans: lessons.length,
      thisWeek,
      totalQuizzes: quizzes.length,
      totalSubjects: Math.max(uniqueSubjects.size, DEFAULT_SUBJECTS.length),
    };
  } catch (error) {
    console.warn('Could not compute Firestore stats, returning zeroed stats', error);
    return {
      totalLessonPlans: 0,
      thisWeek: 0,
      totalQuizzes: 0,
      totalSubjects: DEFAULT_SUBJECTS.length,
    };
  }
}

// -------------------------------------------------------------------
// Classes and Subjects
// -------------------------------------------------------------------

export async function fetchUserClasses(teacherId?: string): Promise<ClassItem[]> {
  if (!teacherId) return DEFAULT_CLASSES;
  const path = `teachers/${teacherId}/classes`;
  try {
    const colRef = collection(db, 'teachers', teacherId, 'classes');
    const snap = await getDocs(colRef);
    const customClasses = snap.docs.map(d => ({ ...(d.data() as ClassItem), id: d.id, is_custom: true }));
    return [...DEFAULT_CLASSES, ...customClasses];
  } catch (error) {
    console.warn('Fallback to default classes:', error);
    return DEFAULT_CLASSES;
  }
}

export async function createUserCustomClass(name: string, teacherId: string): Promise<ClassItem> {
  const classId = `class-custom-${Date.now()}`;
  const path = `teachers/${teacherId}/classes/${classId}`;
  try {
    const newClass: ClassItem = {
      id: classId,
      name,
      is_custom: true,
      created_by: teacherId,
    };
    const docRef = doc(db, 'teachers', teacherId, 'classes', classId);
    await setDoc(docRef, sanitizeForFirestore(newClass));
    return newClass;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserSubjects(teacherId?: string): Promise<SubjectItem[]> {
  if (!teacherId) return DEFAULT_SUBJECTS;
  const path = `teachers/${teacherId}/subjects`;
  try {
    const colRef = collection(db, 'teachers', teacherId, 'subjects');
    const snap = await getDocs(colRef);
    const customSubjects = snap.docs.map(d => ({ ...(d.data() as SubjectItem), id: d.id, is_custom: true }));
    return [...DEFAULT_SUBJECTS, ...customSubjects];
  } catch (error) {
    console.warn('Fallback to default subjects:', error);
    return DEFAULT_SUBJECTS;
  }
}

export async function createUserCustomSubject(name: string, teacherId: string): Promise<SubjectItem> {
  const subjectId = `subj-custom-${Date.now()}`;
  const path = `teachers/${teacherId}/subjects/${subjectId}`;
  try {
    const newSubj: SubjectItem = {
      id: subjectId,
      name,
      is_custom: true,
      created_by: teacherId,
    };
    const docRef = doc(db, 'teachers', teacherId, 'subjects', subjectId);
    await setDoc(docRef, sanitizeForFirestore(newSubj));
    return newSubj;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
