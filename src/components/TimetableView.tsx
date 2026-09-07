import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimetableSlot, LessonPlan } from '../types';
import { fetchTimetable, saveTimetableSlot, deleteTimetableSlot, fetchLessons } from '../lib/api';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  BookOpen,
  Trash2,
  Edit2,
  AlertTriangle,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TimetableViewProps {
  onNavigate: (view: string, lessonId?: string) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TimetableView: React.FC<TimetableViewProps> = ({ onNavigate, onShowToast }) => {
  const { teacher } = useAuth();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Active day for mobile view
  const [activeDay, setActiveDay] = useState('Monday');

  // Modal for adding/editing slot
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot> | null>(null);

  // Form fields
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:45');
  const [className, setClassName] = useState('SS1');
  const [subject, setSubject] = useState('Biology');
  const [room, setRoom] = useState('Lab 2');
  const [linkedLessonId, setLinkedLessonId] = useState('');

  // Conflict state
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const loadData = async () => {
    if (!teacher) return;
    try {
      setLoading(true);
      const [tList, lList] = await Promise.all([
        fetchTimetable(teacher.id),
        fetchLessons({ teacher_id: teacher.id }),
      ]);
      setSlots(tList);
      setLessons(lList);
    } catch (e) {
      console.error(e);
      onShowToast('Failed to load timetable.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teacher]);

  const handleOpenAdd = (presetDay?: string) => {
    setEditingSlot(null);
    setDay(presetDay || activeDay);
    setStartTime('08:00');
    setEndTime('08:45');
    setClassName(teacher?.classes_taught?.[0] || 'SS1');
    setSubject(teacher?.subjects_taught?.[0] || 'Biology');
    setRoom('');
    setLinkedLessonId('');
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setDay(slot.day_of_week);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setClassName(slot.class_name);
    setSubject(slot.subject);
    setRoom(slot.room || '');
    setLinkedLessonId(slot.lesson_plan_id || '');
    setConflictWarning(null);
    setIsModalOpen(true);
  };

  // Real-time conflict checking while typing in modal
  useEffect(() => {
    if (!isModalOpen) return;
    const startMins = toMinutes(startTime);
    const endMins = toMinutes(endTime);

    if (startMins >= endMins) {
      setConflictWarning('End time must be after start time.');
      return;
    }

    const overlap = slots.find(s => {
      if (editingSlot?.id && s.id === editingSlot.id) return false;
      if (s.day_of_week !== day) return false;
      const sStart = toMinutes(s.start_time);
      const sEnd = toMinutes(s.end_time);
      return Math.max(startMins, sStart) < Math.min(endMins, sEnd);
    });

    if (overlap) {
      setConflictWarning(`Conflict: overlaps with ${overlap.class_name} ${overlap.subject} (${overlap.start_time} - ${overlap.end_time})`);
    } else {
      setConflictWarning(null);
    }
  }, [day, startTime, endTime, isModalOpen, editingSlot, slots]);

  function toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slotData: Partial<TimetableSlot> = {
        id: editingSlot?.id,
        teacher_id: teacher?.id || 'demo-teacher',
        day_of_week: day as any,
        start_time: startTime,
        end_time: endTime,
        class_name: className,
        subject: subject,
        subject_name: subject,
        room: room || undefined,
        lesson_plan_id: linkedLessonId || undefined,
      };

      const saved = await saveTimetableSlot(slotData);
      setSlots(prev => {
        const filtered = prev.filter(s => s.id !== saved.id);
        return [...filtered, saved].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
      });
      setIsModalOpen(false);
      onShowToast('Timetable slot saved.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save timetable slot.', 'error');
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      await deleteTimetableSlot(id);
      setSlots(prev => prev.filter(s => s.id !== id));
      onShowToast('Slot deleted from schedule.', 'info');
    } catch (e) {
      onShowToast('Failed to delete slot.', 'error');
    }
  };

  const daySlots = slots.filter(s => s.day_of_week === activeDay);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-600" />
            <span>Weekly Teaching Timetable</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize your periods, classrooms, and attached lesson plans.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-md hover:bg-blue-800 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Period</span>
          </button>
        </div>
      </div>

      {/* Day Tabs (Visible on mobile and tablet) */}
      <div className="flex rounded-2xl bg-white border border-slate-200 p-1.5 shadow-2xs overflow-x-auto gap-1">
        {DAYS.map(d => {
          const count = slots.filter(s => s.day_of_week === d).length;
          const isActive = activeDay === d;
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`flex-1 min-w-[75px] py-2 px-3 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{d.slice(0, 3)}</span>
              <span className={`text-[10px] font-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                {count} {count === 1 ? 'period' : 'periods'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Daily Cards View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">{activeDay}'s Schedule</h2>
          <button
            onClick={() => handleOpenAdd(activeDay)}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800"
          >
            + Add to {activeDay}
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading timetable...</div>
        ) : daySlots.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No classes scheduled for {activeDay}</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "+ Add Period" to schedule a class session.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daySlots.map(slot => {
              const linkedPlan = lessons.find(l => l.id === slot.lesson_plan_id);
              return (
                <div
                  key={slot.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="px-3 py-2 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex flex-col items-center justify-center shrink-0">
                      <span>{slot.start_time}</span>
                      <span className="text-[10px] text-blue-600 font-normal">to {slot.end_time}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{slot.subject || (slot as any).subject_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          {slot.class_name}
                        </span>
                        {slot.room && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {slot.room}
                          </span>
                        )}
                      </div>

                      {linkedPlan ? (
                        <button
                          onClick={() => onNavigate('editor', linkedPlan.id)}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 font-semibold"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Linked Note: {linkedPlan.topic}</span>
                        </button>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          No lesson note attached
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenEdit(slot)}
                      className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-white"
                      title="Edit slot"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Weekly Overview Table */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Complete 5-Day Weekly View</h2>
        <div className="grid grid-cols-5 gap-3">
          {DAYS.map(d => {
            const dSlots = slots.filter(s => s.day_of_week === d);
            return (
              <div key={d} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3 space-y-2">
                <div className="text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
                  {d}
                </div>
                {dSlots.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-4 text-center">No periods</p>
                ) : (
                  dSlots.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleOpenEdit(s)}
                      className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-blue-400 cursor-pointer text-xs transition"
                    >
                      <span className="text-[10px] font-semibold text-blue-700 block">
                        {s.start_time} - {s.end_time}
                      </span>
                      <strong className="text-slate-800 font-bold block">{s.subject || (s as any).subject_name}</strong>
                      <span className="text-[10px] text-slate-500">{s.class_name} {s.room ? `• ${s.room}` : ''}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add or Edit Period */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingSlot ? 'Edit Period Slot' : 'Add Teaching Period'}
            </h3>

            {conflictWarning && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{conflictWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Day of the Week</label>
                <select
                  value={day}
                  onChange={e => setDay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
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
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room / Venue (Optional)</label>
                <input
                  type="text"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  placeholder="e.g. Lab 2, Hall A, Room 104"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link to Lesson Plan Note (Optional)
                </label>
                <select
                  value={linkedLessonId}
                  onChange={e => setLinkedLessonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                >
                  <option value="">-- None --</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.class_name_snapshot} {l.subject_name_snapshot}: {l.topic}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 shadow-sm"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
