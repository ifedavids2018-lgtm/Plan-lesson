export type DurationOption = '30' | '40' | '45' | '60' | '90' | 'custom';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'mixed';
export type DifficultyLevel = 'easy' | 'medium' | 'difficult' | 'mixed';
export type HomeworkType = 'questions' | 'short_assignment' | 'research_assignment' | 'practical_activity' | 'mixed';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  school_id?: string | null;
  school_name: string;
  role: 'teacher' | 'admin';
  subscription_plan: 'free' | 'pro' | 'school';
  subjects_taught: string[];
  classes_taught: string[];
  curriculum: string;
  created_at: string;
  updated_at: string;
}

export interface ClassItem {
  id: string;
  name: string;
  is_custom: boolean;
  school_id?: string | null;
  created_by?: string | null;
}

export interface SubjectItem {
  id: string;
  name: string;
  is_custom: boolean;
  school_id?: string | null;
  created_by?: string | null;
}

export interface TeachingActivity {
  step_title: string;
  description: string;
}

export interface LessonPlan {
  id: string;
  teacher_id: string;
  class_id?: string | null;
  class_name_snapshot: string;
  subject_id?: string | null;
  subject_name_snapshot: string;
  topic: string;
  duration_option: DurationOption;
  duration_minutes_custom?: number | null;
  lesson_date?: string | null;
  term?: string | null;
  week?: number | null;
  lesson_number?: number | null;

  // Form inputs feeding AI
  learning_objectives_input?: string;
  previous_knowledge_input?: string;
  teaching_method?: string;
  resources_input?: string;
  curriculum_standard?: string;
  teacher_notes?: string;

  // Sections A-J
  learning_objectives: string[];
  previous_knowledge: string;
  instructional_materials: string[];
  introduction: string;
  lesson_content: string;
  teaching_activities: TeachingActivity[];
  student_activities: string[];
  assessment: string;
  conclusion: string;
  homework_summary: string;

  status: 'draft' | 'saved';
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id?: string;
  order_index?: number;
  question: string;
  question_text?: string;
  question_type?: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  is_ai_generated?: boolean;
}

export interface Quiz {
  id: string;
  lesson_plan_id?: string | null;
  teacher_id: string;
  title: string;
  topic: string;
  class_name: string;
  subject?: string;
  subject_name?: string;
  question_type?: string;
  difficulty?: string;
  question_count?: number;
  requested_question_count?: number;
  questions: QuizQuestion[];
  created_at: string;
  updated_at?: string;
}

export interface HomeworkItem {
  id?: string;
  prompt: string;
  guidance?: string;
  expected_answer?: string;
  instructions?: string;
}

export interface Homework {
  id: string;
  lesson_plan_id?: string | null;
  teacher_id: string;
  title: string;
  topic: string;
  class_name: string;
  subject?: string;
  subject_name?: string;
  homework_type?: string;
  difficulty?: string;
  instructions?: string;
  overview?: string;
  questions: HomeworkItem[];
  items?: HomeworkItem[];
  submission_notes?: string;
  submission_guidelines?: string;
  is_ai_generated?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TimetableSlot {
  id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string; // e.g. "08:00"
  end_time: string;   // e.g. "08:40"
  class_name: string;
  subject?: string;
  subject_name?: string;
  room?: string | null;
  lesson_plan_id?: string | null;
  lesson_title?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LessonPlanRevision {
  id: string;
  lesson_plan_id: string;
  section_name: string;
  previous_content: string | string[] | TeachingActivity[];
  changed_by?: string;
  change_type: 'manual_edit' | 'ai_regenerate' | 'ai_simplify' | 'ai_expand';
  created_at: string;
}

export interface ExportEvent {
  id: string;
  lesson_plan_id: string;
  teacher_id: string;
  export_type: 'pdf' | 'print';
  created_at: string;
}

export interface DashboardStats {
  totalLessonPlans: number;
  thisWeek: number;
  totalQuizzes: number;
  totalSubjects: number;
}
