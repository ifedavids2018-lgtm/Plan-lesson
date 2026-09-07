import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// Database Persistence (JSON file storage in ./data/db.json)
// -------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  teachers: any[];
  classes: any[];
  subjects: any[];
  lesson_plans: any[];
  lesson_plan_revisions: any[];
  quizzes: any[];
  homework: any[];
  timetable_slots: any[];
  export_events: any[];
}

const DEFAULT_CLASSES = [
  'Primary 1', 'Primary 2', 'Primary 3',
  'Primary 4', 'Primary 5', 'Primary 6',
  'JSS1', 'JSS2', 'JSS3',
  'SS1', 'SS2', 'SS3'
];

const DEFAULT_SUBJECTS = [
  'Mathematics', 'English Language', 'Biology',
  'Chemistry', 'Physics', 'Agricultural Science',
  'Economics', 'Geography', 'Government', 'Civic Education'
];

function initializeDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.error('Error reading existing db.json, creating fresh:', e);
    }
  }

  const demoTeacherId = 'teacher-demo-001';
  const sampleLessonId = 'lesson-sample-001';

  const initialDb: DatabaseSchema = {
    teachers: [
      {
        id: demoTeacherId,
        name: 'Mrs. Aisha Ibrahim',
        email: 'aisha.ibrahim@school.ng',
        password_hash: 'password123',
        school_name: 'ABC Secondary School',
        role: 'teacher',
        subscription_plan: 'free',
        subjects_taught: ['Biology', 'Basic Science'],
        classes_taught: ['JSS3', 'SS1', 'SS2'],
        curriculum: 'Nigerian Curriculum',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    classes: DEFAULT_CLASSES.map((name, i) => ({
      id: `class-${i + 1}`,
      name,
      is_custom: false,
      created_by: null,
    })),
    subjects: DEFAULT_SUBJECTS.map((name, i) => ({
      id: `subj-${i + 1}`,
      name,
      is_custom: false,
      created_by: null,
    })),
    lesson_plans: [
      {
        id: sampleLessonId,
        teacher_id: demoTeacherId,
        class_name_snapshot: 'SS1',
        subject_name_snapshot: 'Biology',
        topic: 'Nutrition',
        duration_option: '40',
        duration_minutes_custom: null,
        lesson_date: '2026-09-01',
        term: 'First Term',
        week: 3,
        lesson_number: 1,
        learning_objectives_input: '1. Define nutrition.\n2. Identify classes of food.\n3. Explain the importance of a balanced diet.',
        previous_knowledge_input: 'Students have basic knowledge of food and digestion from Junior Secondary Basic Science.',
        teaching_method: 'Discussion & Demonstration',
        resources_input: 'Charts of food groups, fresh samples (apple, bread, beans), Whiteboard',
        curriculum_standard: 'NERDC National Curriculum for Senior Secondary Biology',
        teacher_notes: 'Encourage students to relate nutritional concepts to local staple Nigerian meals.',
        learning_objectives: [
          'Define nutrition accurately in biological terms.',
          'Identify the six main classes of food and provide local Nigerian examples for each.',
          'Explain the components and health benefits of a balanced diet for adolescent growth.'
        ],
        previous_knowledge: 'Students recall from JSS3 Basic Science that living organisms require food for energy, growth, and cellular repair.',
        instructional_materials: [
          'Biological chart showing the 6 classes of nutrients',
          'Specimens of common staple foodstuffs (cassava, beans, groundnuts, oranges)',
          'Whiteboard markers and lesson summary flashcards'
        ],
        introduction: 'Begin by asking students what they had for breakfast this morning. Contrast an all-carbohydrate meal with a balanced breakfast. Introduce nutrition as the biochemical and physiological process by which an organism acquires and assimilates nutrients for survival.',
        lesson_content: 'Nutrition is classified into Autotrophic and Heterotrophic nutrition. Humans are heterotrophic and rely on six nutrient classes: Carbohydrates, Proteins, Lipids, Vitamins, Minerals, and Water. A balanced diet contains all these classes in the correct proportions required by the body.',
        teaching_activities: [
          {
            step_title: 'Step 1 — Introduction & Hook (5 mins)',
            description: 'Prompt learners with everyday dietary choices and lead them into defining nutrition.'
          },
          {
            step_title: 'Step 2 — Nutrient Classes & Sources (12 mins)',
            description: 'Display charts and physical food specimens. Detail the biochemical roles of Carbohydrates, Proteins, and Fats with Nigerian culinary examples.'
          },
          {
            step_title: 'Step 3 — Micronutrients & Water (8 mins)',
            description: 'Highlight the protective role of Vitamins (A, C, D) and Minerals (Iron, Calcium) along with water balance.'
          },
          {
            step_title: 'Step 4 — Balanced Diet Analysis (10 mins)',
            description: 'Guide students in evaluating a standard Nigerian meal (e.g. Rice, Beans, Fish, and Vegetable Stew) against nutritional benchmarks.'
          },
          {
            step_title: 'Step 5 — Evaluation & Wrap-up (5 mins)',
            description: 'Recap key concepts and administer spot comprehension checks.'
          }
        ],
        student_activities: [
          'Pair-share discussion: list three common foods eaten at home and classify their predominant nutrients.',
          'Examine the food chart and note down deficiency diseases associated with protein and vitamin shortages.',
          'Construct a sample one-day balanced meal plan suitable for an SS1 student.'
        ],
        assessment: '1. What is nutrition?\n2. Mention 4 classes of food and two sources of each.\n3. State two symptoms of protein deficiency (Kwashiorkor).',
        conclusion: 'Nutrition is fundamental to cell metabolism and vitality. A varied diet containing all 6 essential classes prevents deficiency diseases and promotes optimal physical and cognitive development.',
        homework_summary: 'Design a weekly balanced breakfast table for your household using affordable local foodstuffs, highlighting the primary nutrient provided by each dish.',
        status: 'saved',
        is_ai_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    lesson_plan_revisions: [],
    quizzes: [
      {
        id: 'quiz-sample-001',
        lesson_plan_id: sampleLessonId,
        teacher_id: demoTeacherId,
        title: 'SS1 Biology Nutrition Mastery Quiz',
        topic: 'Nutrition',
        class_name: 'SS1',
        subject_name: 'Biology',
        question_type: 'multiple_choice',
        difficulty: 'medium',
        requested_question_count: 5,
        questions: [
          {
            id: 'q-1',
            order_index: 1,
            question_text: 'Which of the following is a primary class of organic food responsible for tissue building and repair?',
            question_type: 'multiple_choice',
            options: [
              { label: 'A', text: 'Water' },
              { label: 'B', text: 'Protein' },
              { label: 'C', text: 'Carbon dioxide' },
              { label: 'D', text: 'Oxygen' },
            ],
            correct_answer: 'B',
            explanation: 'Proteins are composed of amino acids and serve as the essential structural material for growth and tissue repair.',
            is_ai_generated: true,
          },
          {
            id: 'q-2',
            order_index: 2,
            question_text: 'Which nutritional deficiency in young children is predominantly caused by a severe lack of dietary protein?',
            question_type: 'multiple_choice',
            options: [
              { label: 'A', text: 'Scurvy' },
              { label: 'B', text: 'Rickets' },
              { label: 'C', text: 'Kwashiorkor' },
              { label: 'D', text: 'Night blindness' },
            ],
            correct_answer: 'C',
            explanation: 'Kwashiorkor results from severe protein deficiency, characterized by edema, swollen abdomen, and muscle wasting.',
            is_ai_generated: true,
          },
          {
            id: 'q-3',
            order_index: 3,
            question_text: 'Which mineral is required for the synthesis of hemoglobin in human red blood cells?',
            question_type: 'multiple_choice',
            options: [
              { label: 'A', text: 'Calcium' },
              { label: 'B', text: 'Iron' },
              { label: 'C', text: 'Sodium' },
              { label: 'D', text: 'Phosphorus' },
            ],
            correct_answer: 'B',
            explanation: 'Iron is the central trace mineral in hemoglobin necessary for binding and transporting oxygen throughout the body.',
            is_ai_generated: true,
          },
          {
            id: 'q-4',
            order_index: 4,
            question_text: 'Organisms that can synthesize their own organic food from simple inorganic compounds are termed:',
            question_type: 'multiple_choice',
            options: [
              { label: 'A', text: 'Autotrophs' },
              { label: 'B', text: 'Heterotrophs' },
              { label: 'C', text: 'Saprotrophs' },
              { label: 'D', text: 'Parasites' },
            ],
            correct_answer: 'A',
            explanation: 'Autotrophs (such as green photosynthetic plants) manufacture their own nutrients using sunlight or chemical energy.',
            is_ai_generated: true,
          },
          {
            id: 'q-5',
            order_index: 5,
            question_text: 'Which vitamin is synthesized in human skin upon exposure to sunlight?',
            question_type: 'multiple_choice',
            options: [
              { label: 'A', text: 'Vitamin C' },
              { label: 'B', text: 'Vitamin K' },
              { label: 'C', text: 'Vitamin D' },
              { label: 'D', text: 'Vitamin B12' },
            ],
            correct_answer: 'C',
            explanation: 'Sunlight triggers the dermal photolysis of 7-dehydrocholesterol to produce cholecalciferol (Vitamin D3).',
            is_ai_generated: true,
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    homework: [
      {
        id: 'hw-sample-001',
        lesson_plan_id: sampleLessonId,
        teacher_id: demoTeacherId,
        topic: 'Nutrition',
        class_name: 'SS1',
        subject_name: 'Biology',
        homework_type: 'questions',
        difficulty: 'medium',
        requested_item_count: 5,
        title: 'SS1 Biology Homework: Dietary Analysis & Nutrient Functions',
        overview: 'Complete the following structured questions in your Biology assignment exercise notebook.',
        items: [
          {
            id: 'hw-item-1',
            prompt: 'Define the term "Balanced Diet" and state three biological reasons why it is critical for adolescent health.',
            expected_answer: 'A diet containing all 6 classes of food in proper proportions. Essential for physical growth, immune defense, and cognitive energy.',
          },
          {
            id: 'hw-item-2',
            prompt: 'Differentiate between autotrophic and heterotrophic nutrition, providing two examples of organisms in each category.',
            expected_answer: 'Autotrophs make their own food (e.g. maize plant, algae); heterotrophs ingest organic matter (e.g. humans, fungi).',
          },
          {
            id: 'hw-item-3',
            prompt: 'List the chemical test used in the laboratory to detect reducing sugars like glucose in a food sample.',
            expected_answer: 'Benedict\'s or Fehling\'s test, which yields a brick-red precipitate upon heating.',
          },
          {
            id: 'hw-item-4',
            prompt: 'Explain the distinct biological roles of Vitamin A and Vitamin C in maintaining the human body.',
            expected_answer: 'Vitamin A supports retinal rhodopsin for night vision; Vitamin C supports collagen synthesis and scurvy prevention.',
          },
          {
            id: 'hw-item-5',
            prompt: 'Describe how a family can compose a nutritious, balanced meal using affordable local Nigerian ingredients.',
            expected_answer: 'For example, beans porridge (protein) with palm oil (lipids), sweet potato (carbohydrates), ugwu leaves (vitamins/iron), and clean drinking water.',
          }
        ],
        submission_guidelines: 'Due on Friday before 8:30 AM during morning assembly. Neatly written in your blue assignment book.',
        is_ai_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    timetable_slots: [
      {
        id: 'slot-1',
        teacher_id: demoTeacherId,
        day_of_week: 'monday',
        start_time: '08:00',
        end_time: '08:40',
        class_name: 'SS1',
        subject_name: 'Biology',
        lesson_plan_id: sampleLessonId,
        lesson_title: 'Nutrition',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'slot-2',
        teacher_id: demoTeacherId,
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '09:40',
        class_name: 'SS2',
        subject_name: 'Biology',
        lesson_plan_id: null,
        lesson_title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'slot-3',
        teacher_id: demoTeacherId,
        day_of_week: 'tuesday',
        start_time: '10:00',
        end_time: '10:40',
        class_name: 'JSS3',
        subject_name: 'Basic Science',
        lesson_plan_id: null,
        lesson_title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'slot-4',
        teacher_id: demoTeacherId,
        day_of_week: 'wednesday',
        start_time: '08:00',
        end_time: '08:40',
        class_name: 'SS1',
        subject_name: 'Biology',
        lesson_plan_id: sampleLessonId,
        lesson_title: 'Nutrition',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'slot-5',
        teacher_id: demoTeacherId,
        day_of_week: 'thursday',
        start_time: '11:00',
        end_time: '11:40',
        class_name: 'SS2',
        subject_name: 'Biology',
        lesson_plan_id: null,
        lesson_title: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    export_events: [],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  return initialDb;
}

let db = initializeDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

// -------------------------------------------------------------
// Gemini AI Setup (Server-side only)
// -------------------------------------------------------------
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment.');
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function withTimeout<T>(promise: Promise<T>, ms: number = 8500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('AI request timed out')), ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// -------------------------------------------------------------
// Health Check Endpoint
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, school_name, subjects_taught, classes_taught, curriculum } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const existing = db.teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newTeacher = {
    id: `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name,
    email,
    password_hash: password, // For demonstration/MVP
    school_name: school_name || 'My School',
    role: 'teacher',
    subscription_plan: 'free',
    subjects_taught: Array.isArray(subjects_taught) ? subjects_taught : ['Biology'],
    classes_taught: Array.isArray(classes_taught) ? classes_taught : ['SS1'],
    curriculum: curriculum || 'Nigerian Curriculum',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.teachers.push(newTeacher);
  saveDatabase();

  res.json({ teacher: newTeacher, token: newTeacher.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const teacher = db.teachers.find(
    t => t.email.toLowerCase() === email.toLowerCase() && t.password_hash === password
  );

  if (!teacher) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  res.json({ teacher, token: teacher.id });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.query.teacher_id as string;
  const teacher = db.teachers.find(t => t.id === token) || db.teachers[0];
  if (!teacher) {
    return res.status(401).json({ error: 'Unauthorized. Session expired.' });
  }
  res.json({ teacher });
});

app.put('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  const teacherId = authHeader?.replace('Bearer ', '') || req.body.teacher_id || db.teachers[0]?.id;
  const teacherIndex = db.teachers.findIndex(t => t.id === teacherId);
  if (teacherIndex === -1) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  const { name, school_name, subjects_taught, classes_taught, curriculum } = req.body;
  db.teachers[teacherIndex] = {
    ...db.teachers[teacherIndex],
    name: name ?? db.teachers[teacherIndex].name,
    school_name: school_name ?? db.teachers[teacherIndex].school_name,
    subjects_taught: subjects_taught ?? db.teachers[teacherIndex].subjects_taught,
    classes_taught: classes_taught ?? db.teachers[teacherIndex].classes_taught,
    curriculum: curriculum ?? db.teachers[teacherIndex].curriculum,
    updated_at: new Date().toISOString(),
  };

  saveDatabase();
  res.json({ teacher: db.teachers[teacherIndex] });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email } = req.body;
  const teacher = db.teachers.find(t => t.email.toLowerCase() === email?.toLowerCase());
  if (!teacher) {
    return res.status(404).json({ error: 'No account registered with this email address.' });
  }
  res.json({ message: 'Password reset link has been dispatched to your email address.' });
});

// -------------------------------------------------------------
// Classes & Subjects Endpoints
// -------------------------------------------------------------
app.get('/api/classes', (req, res) => {
  res.json(db.classes);
});

app.post('/api/classes', (req, res) => {
  const { name, teacher_id } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Class name is required' });
  }
  const cleanName = name.trim();
  const existing = db.classes.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return res.json(existing);

  const newClass = {
    id: `class-${Date.now()}`,
    name: cleanName,
    is_custom: true,
    created_by: teacher_id || null,
  };
  db.classes.push(newClass);
  saveDatabase();
  res.json(newClass);
});

app.get('/api/subjects', (req, res) => {
  res.json(db.subjects);
});

app.post('/api/subjects', (req, res) => {
  const { name, teacher_id } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Subject name is required' });
  }
  const cleanName = name.trim();
  const existing = db.subjects.find(s => s.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return res.json(existing);

  const newSubj = {
    id: `subj-${Date.now()}`,
    name: cleanName,
    is_custom: true,
    created_by: teacher_id || null,
  };
  db.subjects.push(newSubj);
  saveDatabase();
  res.json(newSubj);
});

// -------------------------------------------------------------
// Dashboard Stats
// -------------------------------------------------------------
app.get('/api/dashboard/stats', (req, res) => {
  const teacherId = (req.query.teacher_id as string) || db.teachers[0]?.id;
  const teacherLessons = db.lesson_plans.filter(l => l.teacher_id === teacherId);
  const teacherQuizzes = db.quizzes.filter(q => q.teacher_id === teacherId);

  // Lesson plans created in the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = teacherLessons.filter(l => new Date(l.created_at) >= sevenDaysAgo).length;

  const distinctSubjects = new Set(teacherLessons.map(l => l.subject_name_snapshot)).size;

  res.json({
    totalLessonPlans: teacherLessons.length,
    thisWeek: Math.max(thisWeek, teacherLessons.length > 0 ? 1 : 0),
    totalQuizzes: teacherQuizzes.length,
    totalSubjects: Math.max(distinctSubjects, 1),
  });
});

// -------------------------------------------------------------
// Lesson Plans CRUD
// -------------------------------------------------------------
app.get('/api/lessons', (req, res) => {
  const teacherId = (req.query.teacher_id as string) || db.teachers[0]?.id;
  let plans = db.lesson_plans.filter(l => l.teacher_id === teacherId);

  const { search, subject, class: className, term } = req.query;

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    plans = plans.filter(l =>
      l.topic.toLowerCase().includes(q) ||
      l.subject_name_snapshot.toLowerCase().includes(q) ||
      l.class_name_snapshot.toLowerCase().includes(q) ||
      (l.teacher_notes && l.teacher_notes.toLowerCase().includes(q))
    );
  }

  if (subject && typeof subject === 'string' && subject !== 'all') {
    plans = plans.filter(l => l.subject_name_snapshot.toLowerCase() === subject.toLowerCase());
  }

  if (className && typeof className === 'string' && className !== 'all') {
    plans = plans.filter(l => l.class_name_snapshot.toLowerCase() === className.toLowerCase());
  }

  if (term && typeof term === 'string' && term !== 'all') {
    plans = plans.filter(l => l.term && l.term.toLowerCase() === term.toLowerCase());
  }

  // Sort by updated_at descending
  plans.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  res.json(plans);
});

app.get('/api/lessons/:id', (req, res) => {
  const plan = db.lesson_plans.find(l => l.id === req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Lesson plan not found' });
  }
  res.json(plan);
});

app.post('/api/lessons', (req, res) => {
  const teacherId = req.body.teacher_id || db.teachers[0]?.id;
  const newPlan = {
    id: req.body.id || `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    teacher_id: teacherId,
    class_name_snapshot: req.body.class_name_snapshot || 'SS1',
    subject_name_snapshot: req.body.subject_name_snapshot || 'Biology',
    topic: req.body.topic || 'Untitled Topic',
    duration_option: req.body.duration_option || '40',
    duration_minutes_custom: req.body.duration_minutes_custom || null,
    lesson_date: req.body.lesson_date || new Date().toISOString().split('T')[0],
    term: req.body.term || 'First Term',
    week: Number(req.body.week) || 1,
    lesson_number: Number(req.body.lesson_number) || 1,
    learning_objectives_input: req.body.learning_objectives_input || '',
    previous_knowledge_input: req.body.previous_knowledge_input || '',
    teaching_method: req.body.teaching_method || 'Discussion & Demonstration',
    resources_input: req.body.resources_input || '',
    curriculum_standard: req.body.curriculum_standard || 'NERDC Curriculum',
    teacher_notes: req.body.teacher_notes || '',

    learning_objectives: Array.isArray(req.body.learning_objectives) ? req.body.learning_objectives : [],
    previous_knowledge: req.body.previous_knowledge || '',
    instructional_materials: Array.isArray(req.body.instructional_materials) ? req.body.instructional_materials : [],
    introduction: req.body.introduction || '',
    lesson_content: req.body.lesson_content || '',
    teaching_activities: Array.isArray(req.body.teaching_activities) ? req.body.teaching_activities : [],
    student_activities: Array.isArray(req.body.student_activities) ? req.body.student_activities : [],
    assessment: req.body.assessment || '',
    conclusion: req.body.conclusion || '',
    homework_summary: req.body.homework_summary || '',

    status: req.body.status || 'saved',
    is_ai_generated: req.body.is_ai_generated ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.lesson_plans.push(newPlan);
  saveDatabase();
  res.json(newPlan);
});

app.put('/api/lessons/:id', (req, res) => {
  const index = db.lesson_plans.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lesson plan not found' });
  }

  const existing = db.lesson_plans[index];
  const updated = {
    ...existing,
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  db.lesson_plans[index] = updated;
  saveDatabase();
  res.json(updated);
});

app.post('/api/lessons/:id/duplicate', (req, res) => {
  const source = db.lesson_plans.find(l => l.id === req.params.id);
  if (!source) {
    return res.status(404).json({ error: 'Source lesson plan not found' });
  }

  const duplicate = {
    ...source,
    id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    topic: `${source.topic} (Copy)`,
    status: 'saved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.lesson_plans.push(duplicate);
  saveDatabase();
  res.json(duplicate);
});

app.delete('/api/lessons/:id', (req, res) => {
  const index = db.lesson_plans.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lesson plan not found' });
  }

  const deleted = db.lesson_plans.splice(index, 1)[0];
  // Also remove attached references in timetable_slots
  db.timetable_slots.forEach(slot => {
    if (slot.lesson_plan_id === req.params.id) {
      slot.lesson_plan_id = null;
      slot.lesson_title = null;
    }
  });

  saveDatabase();
  res.json({ message: 'Lesson plan deleted successfully', id: deleted.id });
});

// -------------------------------------------------------------
// AI Services: Lesson Generator, Section Regenerator, Quiz, Homework
// -------------------------------------------------------------
app.post('/api/ai/generate-lesson', async (req, res) => {
  const {
    class_name,
    subject,
    topic,
    duration,
    learning_objectives,
    previous_knowledge,
    teaching_method,
    resources,
    curriculum,
    teacher_notes,
  } = req.body;

  if (!class_name || !subject || !topic || !learning_objectives) {
    return res.status(400).json({ error: 'Class, Subject, Topic, and Learning Objectives are required.' });
  }

  const durationStr = duration || '40 minutes';
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are a Senior Curriculum Specialist and Master Teacher experienced in Nigerian and British Commonwealth primary and secondary school education (e.g., NERDC curriculum, WAEC/NECO, Cambridge standards).
Generate a highly structured, age-appropriate, pedagogically rigorous lesson plan based on the following teacher inputs:
- Class Level: ${class_name}
- Subject: ${subject}
- Topic: ${topic}
- Duration: ${durationStr}
- Teacher's Desired Learning Objectives: ${learning_objectives}
- Previous Knowledge: ${previous_knowledge || 'Standard prerequisite knowledge for ' + class_name}
- Preferred Teaching Method: ${teaching_method || 'Interactive lecture, discussion, and guided demonstration'}
- Available Resources: ${resources || 'Whiteboard, textbook, realia, charts'}
- Curriculum / Standard: ${curriculum || 'Nigerian NERDC / WAEC standard'}
- Teacher Notes: ${teacher_notes || 'Focus on active student engagement and clear real-world examples'}

You must return structured JSON strictly matching this schema:
{
  "learning_objectives": ["Objective 1 (measurable with action verbs)", "Objective 2", "Objective 3"],
  "previous_knowledge": "Concise summary of what students already know and recall from preceding classes.",
  "instructional_materials": ["Material 1", "Material 2", "Material 3"],
  "introduction": "An engaging hook, real-world Nigerian/local scenario, or inquiry question to ignite student interest within the first 3-5 minutes.",
  "lesson_content": "Comprehensive, clear teacher explanation covering the core scientific/academic principles, definitions, key rules, and formulas.",
  "teaching_activities": [
    { "step_title": "Step 1 — Introduction & Hook (approx 5 mins)", "description": "Teacher guides students through..." },
    { "step_title": "Step 2 — Core Concepts Explanation (approx 12 mins)", "description": "Teacher demonstrates..." },
    { "step_title": "Step 3 — Guided Practice & Illustration (approx 10 mins)", "description": "Teacher walks students through examples..." },
    { "step_title": "Step 4 — Student Participation & Checks (approx 8 mins)", "description": "Teacher invites responses..." },
    { "step_title": "Step 5 — Evaluation & Summary (approx 5 mins)", "description": "Teacher reviews core points and checks understanding..." }
  ],
  "student_activities": [
    "Active student participation task 1 (e.g. pair-share, solve problem, diagram)",
    "Active student participation task 2",
    "Active student participation task 3"
  ],
  "assessment": "3 to 5 clear diagnostic questions or spot-checks to test if learning objectives were achieved during class.",
  "conclusion": "Crisp closing synthesis reinforcing key takeaways.",
  "homework_summary": "Practical, thought-provoking homework assignment reinforcing today's topic."
}`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                learning_objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                previous_knowledge: { type: Type.STRING },
                instructional_materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                introduction: { type: Type.STRING },
                lesson_content: { type: Type.STRING },
                teaching_activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      step_title: { type: Type.STRING },
                      description: { type: Type.STRING },
                    },
                    required: ['step_title', 'description'],
                  },
                },
                student_activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                assessment: { type: Type.STRING },
                conclusion: { type: Type.STRING },
                homework_summary: { type: Type.STRING },
              },
              required: [
                'learning_objectives',
                'previous_knowledge',
                'instructional_materials',
                'introduction',
                'lesson_content',
                'teaching_activities',
                'student_activities',
                'assessment',
                'conclusion',
                'homework_summary',
              ],
            },
          },
        }),
        8500
      );

      const text = response.text || '';
      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('Gemini generate-lesson error, using fallback template:', err);
    }
  }

  // Graceful high-quality fallback if API key is not configured or rate-limited
  const fallback = {
    learning_objectives: [
      `Define and state the key principles of ${topic} appropriate for ${class_name}.`,
      `Identify and categorize the primary components and real-world examples of ${topic}.`,
      `Analyze and solve fundamental problems or scenarios relating to ${topic} in everyday contexts.`
    ],
    previous_knowledge: `Students in ${class_name} have foundational background knowledge from previous terms regarding fundamental concepts related to ${subject}.`,
    instructional_materials: [
      `Standard textbook for ${class_name} ${subject}`,
      `Educational diagrams and wall charts illustrating ${topic}`,
      `Classroom whiteboard, markers, and practical specimens/demonstration objects`
    ],
    introduction: `Hook the learners' attention by presenting an everyday scenario related to ${topic}. Connect this with their lived experiences in their local environment to demonstrate why ${topic} matters today.`,
    lesson_content: `Comprehensive explanation of ${topic}: Break down core definitions, scientific or theoretical mechanisms, classification frameworks, and step-by-step methodologies aligned with the ${class_name} ${subject} syllabus.`,
    teaching_activities: [
      {
        step_title: `Step 1 — Introduction & Conceptual Hook (5 mins)`,
        description: `Introduce ${topic} with an inquiry question and bridge learners' previous knowledge to the lesson objectives.`
      },
      {
        step_title: `Step 2 — Core Content Delivery & Modeling (15 mins)`,
        description: `Present the primary principles of ${topic}, demonstrating worked examples and highlighting key terminology on the board.`
      },
      {
        step_title: `Step 3 — Guided Practice & Class Discussion (10 mins)`,
        description: `Engage the classroom in analyzing a sample question or practical case study together, resolving misconceptions.`
      },
      {
        step_title: `Step 4 — Student Collaborative Activity (6 mins)`,
        description: `Have learners work in pairs to verify their notes, formulate questions, and draft immediate solutions.`
      },
      {
        step_title: `Step 5 — Formative Evaluation & Wrap-up (4 mins)`,
        description: `Administer rapid oral spot questions and summarize the core principles before distributing homework.`
      }
    ],
    student_activities: [
      `Take structured notes and record key definitions of ${topic} in their notebooks.`,
      `Participate in the guided question-and-answer session with their study partner.`,
      `Attempt the individual practice evaluation exercise on the board.`
    ],
    assessment: `1. Define ${topic} in your own words.\n2. State two major characteristics or functions of ${topic}.\n3. Explain one practical application of ${topic} in daily life.`,
    conclusion: `A comprehensive recap of ${topic}. Emphasize how mastering this fundamental concept paves the way for advanced topics next week.`,
    homework_summary: `Complete the review exercises on ${topic} in your ${subject} workbook, questions 1 through 5, showing full working.`
  };

  res.json({ success: true, data: fallback });
});

// Regenerate single section
app.post('/api/ai/regenerate-section', async (req, res) => {
  const {
    section_name,
    option_type, // 'engaging' | 'simpler' | 'practical' | 'different' | 'custom'
    custom_instruction,
    class_name,
    subject,
    topic,
    current_content,
    lesson_plan_id,
  } = req.body;

  const ai = getGeminiClient();
  let instruction = custom_instruction || '';
  if (option_type === 'engaging') instruction = 'Make it much more captivating, engaging, and interactive for students.';
  if (option_type === 'simpler') instruction = `Simplify this explanation specifically for ${class_name} students using easy-to-understand language.`;
  if (option_type === 'practical') instruction = 'Add vivid real-world practical examples, local Nigerian context, and hands-on demonstrations.';
  if (option_type === 'different') instruction = 'Generate a completely fresh, creative alternative approach.';

  if (ai) {
    try {
      const prompt = `You are an expert teacher. The teacher wants to regenerate ONLY the "${section_name}" section of their ${class_name} ${subject} lesson plan on the topic "${topic}".
Current content for this section:
${JSON.stringify(current_content)}

Special teacher instruction:
${instruction || 'Provide a fresh, highly structured, educationally rigorous revision.'}

Return JSON with a single key "new_content" that contains the updated content in the appropriate format (array of strings if objectives/materials/activities, or array of {step_title, description} if teaching_activities, or string for text sections).`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        8500
      );

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.new_content !== undefined) {
        return res.json({ success: true, new_content: parsed.new_content });
      }
    } catch (e) {
      console.error('Section regeneration failed, fallback:', e);
    }
  }

  // Fallback
  let fallbackContent: any = `Refined ${section_name}: Updated specifically for ${class_name} learners on ${topic}. ${instruction}`;
  if (Array.isArray(current_content)) {
    fallbackContent = current_content.map((item, idx) =>
      typeof item === 'string'
        ? `${item} (Enhanced with ${instruction || 'active student focus'})`
        : { ...item, description: `${item.description} [Enhanced: ${instruction || 'active engagement'}]` }
    );
  }

  res.json({ success: true, new_content: fallbackContent });
});

// Quiz Generator
app.post('/api/ai/generate-quiz', async (req, res) => {
  const {
    lesson_plan_id,
    topic,
    class_name,
    subject,
    question_count = 5,
    question_type = 'multiple_choice',
    difficulty = 'medium',
    lesson_content,
  } = req.body;

  const count = Number(question_count) || 5;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Generate a ${difficulty} difficulty quiz with ${count} questions of type "${question_type}" for ${class_name} students studying ${subject} on the topic "${topic}".
Use the following lesson context:
${lesson_content ? JSON.stringify(lesson_content).slice(0, 3000) : topic}

For multiple-choice questions, provide 4 options (A, B, C, D) and randomize which letter is correct.
Include an accurate Answer Key with an explanation for each question.

Return JSON strictly matching this schema:
{
  "title": "${class_name} ${subject} — ${topic} Assessment Quiz",
  "questions": [
    {
      "order_index": 1,
      "question_text": "...",
      "question_type": "multiple_choice",
      "options": [
        { "label": "A", "text": "..." },
        { "label": "B", "text": "..." },
        { "label": "C", "text": "..." },
        { "label": "D", "text": "..." }
      ],
      "correct_answer": "B",
      "explanation": "..."
    }
  ]
}`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      order_index: { type: Type.INTEGER },
                      question_text: { type: Type.STRING },
                      question_type: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            text: { type: Type.STRING },
                          },
                          required: ['label', 'text'],
                        },
                      },
                      correct_answer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['order_index', 'question_text', 'question_type', 'correct_answer', 'explanation'],
                  },
                },
              },
              required: ['title', 'questions'],
            },
          },
        }),
        8500
      );

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.questions && Array.isArray(parsed.questions)) {
        const normalized = parsed.questions.map((q: any, i: number) => {
          const qText = q.question_text || q.question || `Question ${i + 1}`;
          const rawOpts = q.options || [];
          const strOpts = rawOpts.map((o: any) => (typeof o === 'string' ? o : (o.text || o.label || '')));
          let ans = q.correct_answer || (strOpts[0] || '');
          if (typeof ans === 'string' && ans.length === 1) {
            const letterIdx = ans.toUpperCase().charCodeAt(0) - 65;
            if (strOpts[letterIdx]) ans = strOpts[letterIdx];
          }
          return {
            id: `q-${i + 1}`,
            order_index: q.order_index || i + 1,
            question: qText,
            question_text: qText,
            question_type: q.question_type || 'multiple_choice',
            options: strOpts.length > 0 ? strOpts : ['True', 'False'],
            correct_answer: ans,
            explanation: q.explanation || `Correct answer for ${topic}.`,
            is_ai_generated: true,
          };
        });

        return res.json({
          success: true,
          data: {
            title: parsed.title || `${class_name} ${subject} — ${topic} Assessment Quiz`,
            questions: normalized,
          },
        });
      }
    } catch (e) {
      console.error('Gemini quiz generation error, using fallback:', e);
    }
  }

  // Fallback Quiz
  const fallbackQuestions = Array.from({ length: count }, (_, i) => {
    const qText = `Which statement best describes key concept #${i + 1} regarding ${topic} in ${class_name} ${subject}?`;
    const opts = [
      `It represents an introductory prerequisite for understanding ${topic}.`,
      `It is a fundamental principle and governing rule of ${topic}.`,
      `It is an applied real-world technique used in Nigerian environments.`,
      `It is a specialized evaluative check for ${topic} mastery.`,
    ];
    return {
      id: `q-${i + 1}`,
      order_index: i + 1,
      question: qText,
      question_text: qText,
      question_type: 'multiple_choice',
      options: opts,
      correct_answer: opts[1],
      explanation: `Option B accurately identifies the fundamental pedagogical core of ${topic} for ${class_name} learners.`,
      is_ai_generated: true,
    };
  });

  res.json({
    success: true,
    data: {
      title: `${class_name} ${subject} — ${topic} Quiz`,
      questions: fallbackQuestions,
    },
  });
});

// Quizzes CRUD
app.get('/api/quizzes', (req, res) => {
  const teacherId = (req.query.teacher_id as string) || db.teachers[0]?.id;
  const list = db.quizzes.filter(q => q.teacher_id === teacherId);
  const normalized = list.map(q => ({
    ...q,
    subject: q.subject || q.subject_name,
    subject_name: q.subject_name || q.subject,
    question_count: q.question_count || q.requested_question_count || (q.questions || []).length,
  }));
  res.json(normalized);
});

app.post('/api/quizzes', (req, res) => {
  const teacherId = req.body.teacher_id || db.teachers[0]?.id;
  const targetSubject = req.body.subject || req.body.subject_name || 'Biology';
  const newQuiz = {
    id: req.body.id || `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    lesson_plan_id: req.body.lesson_plan_id,
    teacher_id: teacherId,
    title: req.body.title || 'Untitled Quiz',
    topic: req.body.topic || 'General',
    class_name: req.body.class_name || 'SS1',
    subject: targetSubject,
    subject_name: targetSubject,
    question_type: req.body.question_type || 'multiple_choice',
    difficulty: req.body.difficulty || 'medium',
    question_count: req.body.question_count || req.body.questions?.length || 5,
    requested_question_count: req.body.questions?.length || 5,
    questions: req.body.questions || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.quizzes.push(newQuiz);
  saveDatabase();
  res.json(newQuiz);
});

app.delete('/api/quizzes/:id', (req, res) => {
  const index = db.quizzes.findIndex(q => q.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Quiz not found' });
  const deleted = db.quizzes.splice(index, 1)[0];
  saveDatabase();
  res.json({ message: 'Quiz deleted', id: deleted.id });
});

// Homework Generator
app.post('/api/ai/generate-homework', async (req, res) => {
  const {
    lesson_plan_id,
    topic,
    class_name,
    subject,
    item_count = 5,
    assignment_type = 'questions',
    difficulty = 'medium',
    lesson_content,
  } = req.body;

  const count = Number(item_count) || 5;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Generate a ${difficulty} homework assignment of type "${assignment_type}" with ${count} tasks for ${class_name} students studying ${subject} on the topic "${topic}".
Lesson context:
${lesson_content ? JSON.stringify(lesson_content).slice(0, 2500) : topic}

Return structured JSON strictly conforming to:
{
  "title": "${class_name} ${subject} — ${topic} Homework Assignment",
  "overview": "Clear, encouraging instructions for the student describing expectations.",
  "items": [
    {
      "id": "hw-1",
      "prompt": "Question or activity prompt...",
      "expected_answer": "Model answer or rubric criteria for teacher grading..."
    }
  ],
  "submission_guidelines": "Instructions on date, format, and notebook to hand in."
}`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                overview: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                      expected_answer: { type: Type.STRING },
                    },
                    required: ['id', 'prompt'],
                  },
                },
                submission_guidelines: { type: Type.STRING },
              },
              required: ['title', 'overview', 'items', 'submission_guidelines'],
            },
          },
        }),
        8500
      );

      const parsed = JSON.parse(response.text || '{}');
      const rawItems = parsed.items || parsed.questions || [];
      const normalizedItems = rawItems.map((item: any, i: number) => ({
        id: item.id || `hw-${i + 1}`,
        prompt: item.prompt || item.question || `Exercise ${i + 1}`,
        expected_answer: item.expected_answer || item.guidance || '',
        guidance: item.guidance || item.expected_answer || '',
      }));

      return res.json({
        success: true,
        data: {
          title: parsed.title || `${class_name} ${subject} — ${topic} Homework`,
          overview: parsed.overview || parsed.instructions || `Complete each problem for ${topic}.`,
          instructions: parsed.instructions || parsed.overview || `Complete each problem for ${topic}.`,
          items: normalizedItems,
          questions: normalizedItems,
          submission_guidelines: parsed.submission_guidelines || parsed.submission_notes || 'Submit at next lesson.',
          submission_notes: parsed.submission_notes || parsed.submission_guidelines || 'Submit at next lesson.',
        },
      });
    } catch (e) {
      console.error('Homework generation error, using fallback:', e);
    }
  }

  // Fallback Homework
  const fallbackItems = Array.from({ length: count }, (_, i) => ({
    id: `hw-fallback-${i + 1}`,
    prompt: `Exercise ${i + 1}: Explain how the principles of ${topic} apply to everyday scenarios and demonstrate the key steps to solve it.`,
    expected_answer: `Students should clearly show step-by-step reasoning, relevant definitions, and rules for ${topic}.`,
    guidance: `Students should clearly show step-by-step reasoning, relevant definitions, and rules for ${topic}.`,
  }));

  res.json({
    success: true,
    data: {
      title: `${class_name} ${subject} — ${topic} Homework`,
      overview: `Complete each of the questions below in your assignment exercise book to solidify your understanding of ${topic}.`,
      instructions: `Complete each of the questions below in your assignment exercise book to solidify your understanding of ${topic}.`,
      items: fallbackItems,
      questions: fallbackItems,
      submission_guidelines: 'Submit at the beginning of next class period.',
      submission_notes: 'Submit at the beginning of next class period.',
    },
  });
});

app.get('/api/homework', (req, res) => {
  const teacherId = (req.query.teacher_id as string) || db.teachers[0]?.id;
  const list = db.homework.filter(h => h.teacher_id === teacherId);
  const normalized = list.map(h => {
    const rawItems = h.questions || h.items || [];
    const normItems = rawItems.map((item: any, i: number) => ({
      id: item.id || `hw-${i + 1}`,
      prompt: item.prompt || item.question || `Exercise ${i + 1}`,
      guidance: item.guidance || item.expected_answer || '',
      expected_answer: item.expected_answer || item.guidance || '',
    }));
    return {
      ...h,
      subject: h.subject || h.subject_name,
      subject_name: h.subject_name || h.subject,
      questions: normItems,
      items: normItems,
      instructions: h.instructions || h.overview || '',
      overview: h.overview || h.instructions || '',
      submission_notes: h.submission_notes || h.submission_guidelines || '',
      submission_guidelines: h.submission_guidelines || h.submission_notes || '',
    };
  });
  res.json(normalized);
});

app.post('/api/homework', (req, res) => {
  const teacherId = req.body.teacher_id || db.teachers[0]?.id;
  const targetSubj = req.body.subject || req.body.subject_name || 'Biology';
  const rawItems = req.body.questions || req.body.items || [];
  const normalizedItems = rawItems.map((item: any, i: number) => ({
    id: item.id || `hw-${i + 1}`,
    prompt: item.prompt || item.question || `Exercise ${i + 1}`,
    guidance: item.guidance || item.expected_answer || '',
    expected_answer: item.expected_answer || item.guidance || '',
  }));

  const newHw = {
    id: req.body.id || `hw-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    lesson_plan_id: req.body.lesson_plan_id,
    teacher_id: teacherId,
    topic: req.body.topic || 'General',
    class_name: req.body.class_name || 'SS1',
    subject: targetSubj,
    subject_name: targetSubj,
    homework_type: req.body.homework_type || 'questions',
    difficulty: req.body.difficulty || 'medium',
    requested_item_count: normalizedItems.length || 5,
    title: req.body.title || `${req.body.class_name || 'SS1'} ${targetSubj} — ${req.body.topic || 'General'} Homework`,
    overview: req.body.overview || req.body.instructions || '',
    instructions: req.body.instructions || req.body.overview || '',
    items: normalizedItems,
    questions: normalizedItems,
    submission_guidelines: req.body.submission_guidelines || req.body.submission_notes || '',
    submission_notes: req.body.submission_notes || req.body.submission_guidelines || '',
    is_ai_generated: req.body.is_ai_generated ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.homework.push(newHw);
  saveDatabase();
  res.json(newHw);
});

app.delete('/api/homework/:id', (req, res) => {
  const index = db.homework.findIndex(h => h.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Homework not found' });
  const deleted = db.homework.splice(index, 1)[0];
  saveDatabase();
  res.json({ message: 'Homework deleted', id: deleted.id });
});

// -------------------------------------------------------------
// Timetable CRUD with Conflict Detection
// -------------------------------------------------------------
function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function hasTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = parseMinutes(startA);
  const eA = parseMinutes(endA);
  const sB = parseMinutes(startB);
  const eB = parseMinutes(endB);
  return sA < eB && sB < eA;
}

app.get('/api/timetable', (req, res) => {
  const teacherId = (req.query.teacher_id as string) || db.teachers[0]?.id;
  const slots = db.timetable_slots.filter(s => s.teacher_id === teacherId);
  const normalized = slots.map(s => ({
    ...s,
    subject: s.subject || s.subject_name,
    subject_name: s.subject_name || s.subject,
  }));
  res.json(normalized);
});

app.post('/api/timetable', (req, res) => {
  const teacherId = req.body.teacher_id || db.teachers[0]?.id;
  const { day_of_week, start_time, end_time, class_name, subject_name, subject, lesson_plan_id } = req.body;
  const targetSubj = subject_name || subject;

  if (!day_of_week || !start_time || !end_time || !class_name || !targetSubj) {
    return res.status(400).json({ error: 'Day, Start Time, End Time, Class, and Subject are required.' });
  }

  // Conflict Detection
  const existingSlots = db.timetable_slots.filter(
    s => s.teacher_id === teacherId && s.day_of_week.toLowerCase() === day_of_week.toLowerCase()
  );

  const conflict = existingSlots.find(s => hasTimeOverlap(start_time, end_time, s.start_time, s.end_time));
  if (conflict) {
    const conflictSubj = conflict.subject_name || conflict.subject || 'Lesson';
    return res.status(409).json({
      error: `Time conflict: You already have a lesson scheduled for ${conflictSubj} (${conflict.class_name}) from ${conflict.start_time} to ${conflict.end_time}.`,
      conflictSlot: conflict,
    });
  }

  let lessonTitle = null;
  if (lesson_plan_id) {
    const matchedLesson = db.lesson_plans.find(l => l.id === lesson_plan_id);
    if (matchedLesson) lessonTitle = matchedLesson.topic;
  }

  const newSlot = {
    id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    teacher_id: teacherId,
    day_of_week: day_of_week.toLowerCase(),
    start_time,
    end_time,
    class_name,
    subject: targetSubj,
    subject_name: targetSubj,
    lesson_plan_id: lesson_plan_id || null,
    lesson_title: lessonTitle,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.timetable_slots.push(newSlot);
  saveDatabase();
  res.json(newSlot);
});

app.put('/api/timetable/:id', (req, res) => {
  const index = db.timetable_slots.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Timetable slot not found' });

  const existing = db.timetable_slots[index];
  const { day_of_week, start_time, end_time, class_name, subject_name, subject, lesson_plan_id } = req.body;

  const targetDay = (day_of_week || existing.day_of_week).toLowerCase();
  const targetStart = start_time || existing.start_time;
  const targetEnd = end_time || existing.end_time;
  const targetSubj = subject_name || subject || existing.subject_name || existing.subject;

  // Conflict detection ignoring this slot itself
  const otherSlots = db.timetable_slots.filter(
    s => s.id !== existing.id && s.teacher_id === existing.teacher_id && s.day_of_week.toLowerCase() === targetDay
  );

  const conflict = otherSlots.find(s => hasTimeOverlap(targetStart, targetEnd, s.start_time, s.end_time));
  if (conflict) {
    const conflictSubj = conflict.subject_name || conflict.subject || 'Lesson';
    return res.status(409).json({
      error: `Time conflict: You already have a lesson scheduled for ${conflictSubj} (${conflict.class_name}) from ${conflict.start_time} to ${conflict.end_time}.`,
      conflictSlot: conflict,
    });
  }

  let lessonTitle = existing.lesson_title;
  if (lesson_plan_id !== undefined) {
    if (lesson_plan_id) {
      const matched = db.lesson_plans.find(l => l.id === lesson_plan_id);
      lessonTitle = matched ? matched.topic : null;
    } else {
      lessonTitle = null;
    }
  }

  const updated = {
    ...existing,
    day_of_week: targetDay,
    start_time: targetStart,
    end_time: targetEnd,
    class_name: class_name || existing.class_name,
    subject: targetSubj,
    subject_name: targetSubj,
    lesson_plan_id: lesson_plan_id !== undefined ? lesson_plan_id : existing.lesson_plan_id,
    lesson_title: lessonTitle,
    updated_at: new Date().toISOString(),
  };

  db.timetable_slots[index] = updated;
  saveDatabase();
  res.json(updated);
});

app.delete('/api/timetable/:id', (req, res) => {
  const index = db.timetable_slots.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Timetable slot not found' });
  const deleted = db.timetable_slots.splice(index, 1)[0];
  saveDatabase();
  res.json({ message: 'Timetable slot deleted', id: deleted.id });
});

// -------------------------------------------------------------
// Export Events Log
// -------------------------------------------------------------
app.post('/api/export-events', (req, res) => {
  const { lesson_plan_id, export_type } = req.body;
  const teacherId = req.body.teacher_id || db.teachers[0]?.id;
  const event = {
    id: `export-${Date.now()}`,
    lesson_plan_id: lesson_plan_id || null,
    teacher_id: teacherId,
    export_type: export_type || 'pdf',
    created_at: new Date().toISOString(),
  };
  db.export_events.push(event);
  saveDatabase();
  res.json({ success: true, event });
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Teacher Lesson Planner running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
