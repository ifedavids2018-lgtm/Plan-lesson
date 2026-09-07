import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, School, BookOpen, GraduationCap, Save, LogOut, CheckCircle2 } from 'lucide-react';

interface ProfileViewProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onShowToast, onOpenAuth }) => {
  const { teacher, updateProfile, logout, loginDemoUser } = useAuth();

  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [subjectsTaught, setSubjectsTaught] = useState('');
  const [classesTaught, setClassesTaught] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '');
      setSchoolName(teacher.school_name || '');
      setCurriculum(teacher.curriculum || 'NERDC National Curriculum');
      setSubjectsTaught((teacher.subjects_taught || []).join(', '));
      setClassesTaught((teacher.classes_taught || []).join(', '));
    }
  }, [teacher]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    try {
      setIsSaving(true);
      await updateProfile({
        name: name.trim(),
        school_name: schoolName.trim(),
        curriculum: curriculum.trim(),
        subjects_taught: subjectsTaught.split(',').map(s => s.trim()).filter(Boolean),
        classes_taught: classesTaught.split(',').map(c => c.trim()).filter(Boolean),
      });
      onShowToast('Teacher profile updated successfully.', 'success');
    } catch (err) {
      onShowToast('Failed to save profile changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!teacher) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Not Logged In</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Log in or create a teacher account to customize your school name and curriculum settings.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-28 animate-in fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Teacher Profile & School Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your profile metadata automatically stamps lesson notes and customized PDFs.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
            {name.charAt(0) || 'T'}
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">{name || 'Teacher'}</h2>
            <p className="text-xs text-slate-500">{teacher.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Teacher Full Name & Title</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
            placeholder="e.g. Mrs. Aisha Ibrahim"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">School / Institution Name</label>
          <input
            type="text"
            value={schoolName}
            onChange={e => setSchoolName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
            placeholder="e.g. Government Secondary School, Garki, Abuja"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            This name will be displayed at the top header of all exported lesson notes.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Primary Teaching Curriculum</label>
          <input
            type="text"
            value={curriculum}
            onChange={e => setCurriculum(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
            placeholder="e.g. NERDC National Curriculum, WAEC Syllabus, Cambridge"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Default Subjects Taught (comma-separated)
          </label>
          <input
            type="text"
            value={subjectsTaught}
            onChange={e => setSubjectsTaught(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            placeholder="Biology, Chemistry, Basic Science"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Default Classes Taught (comma-separated)
          </label>
          <input
            type="text"
            value={classesTaught}
            onChange={e => setClassesTaught(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            placeholder="SS1, SS2, JSS3"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs shadow-md hover:bg-blue-800 transition active:scale-95 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
