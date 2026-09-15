import jsPDF from 'jspdf';
import { LessonPlan, TeacherProfile } from '../types';

export function generateLessonPlanPDF(lesson: LessonPlan, teacher?: TeacherProfile | null) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  function checkPageBreak(requiredHeight: number) {
    if (cursorY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      drawHeaderFooter();
    }
  }

  function drawHeaderFooter() {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Official Teaching Record • ${lesson.class_name_snapshot} ${lesson.subject_name_snapshot}`, margin, 10);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 15, pageHeight - 8);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 12, pageWidth - margin, 12);
  }

  // School Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Deep navy blue
  const schoolName = teacher?.school_name || 'FEDERAL REPUBLIC TEACHING SERVICE';
  doc.text(schoolName.toUpperCase(), pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 7;

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('STANDARD LESSON PLAN NOTE', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 8;

  // Metadata Table Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  const col1 = margin + 4;
  const col2 = margin + 55;
  const col3 = margin + 110;

  // Row 1
  doc.text('TEACHER:', col1, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(teacher?.name?.trim() || 'Teacher', col1 + 18, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('CLASS:', col2, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(lesson.class_name_snapshot, col2 + 15, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('SUBJECT:', col3, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(lesson.subject_name_snapshot, col3 + 18, cursorY + 6);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('TOPIC:', col1, cursorY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(lesson.topic, col1 + 18, cursorY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('DURATION:', col2, cursorY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${lesson.duration_minutes_custom || lesson.duration_option} mins`, col2 + 20, cursorY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('TERM / WEEK:', col3, cursorY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${lesson.term || 'Term 1'} • Wk ${lesson.week || '1'}`, col3 + 26, cursorY + 13);

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', col1, cursorY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(lesson.lesson_date || new Date().toISOString().split('T')[0], col1 + 18, cursorY + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('CURRICULUM:', col2, cursorY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(lesson.curriculum_standard || 'NERDC National Standard', col2 + 26, cursorY + 20);

  cursorY += 30;

  function renderSection(title: string, contentLines: string[] | string) {
    checkPageBreak(20);
    // Section Header Banner
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.rect(margin, cursorY, contentWidth, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(title.toUpperCase(), margin + 3, cursorY + 5);
    cursorY += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    if (Array.isArray(contentLines)) {
      contentLines.forEach((item, idx) => {
        const itemText = `${idx + 1}. ${item}`;
        const wrapped = doc.splitTextToSize(itemText, contentWidth - 6);
        checkPageBreak(wrapped.length * 5 + 2);
        doc.text(wrapped, margin + 3, cursorY);
        cursorY += wrapped.length * 5 + 1.5;
      });
    } else {
      const wrapped = doc.splitTextToSize(contentLines || 'Not specified', contentWidth - 6);
      checkPageBreak(wrapped.length * 5 + 2);
      doc.text(wrapped, margin + 3, cursorY);
      cursorY += wrapped.length * 5 + 2;
    }
    cursorY += 4;
  }

  // 1. Learning Objectives
  renderSection('1. Learning Objectives (Behavioral)', lesson.learning_objectives);

  // 2. Previous Knowledge
  renderSection('2. Previous Knowledge', lesson.previous_knowledge);

  // 3. Instructional Materials
  renderSection('3. Instructional Materials & Realia', lesson.instructional_materials);

  // 4. Introduction
  renderSection('4. Introduction & Mental Set', lesson.introduction);

  // 5. Lesson Content
  renderSection('5. Core Lesson Content', lesson.lesson_content);

  // 6. Teaching Activities (Steps)
  if (lesson.teaching_activities && lesson.teaching_activities.length > 0) {
    checkPageBreak(25);
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.rect(margin, cursorY, contentWidth, 7, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text('6. TEACHER PRESENTATION & ACTIVITIES', margin + 3, cursorY + 5);
    cursorY += 11;

    lesson.teaching_activities.forEach(act => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 58, 138);
      const stepHeader = doc.splitTextToSize(act.step_title, contentWidth - 6);
      checkPageBreak(stepHeader.length * 5 + 10);
      doc.text(stepHeader, margin + 3, cursorY);
      cursorY += stepHeader.length * 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const descWrapped = doc.splitTextToSize(act.description, contentWidth - 6);
      checkPageBreak(descWrapped.length * 4.5 + 4);
      doc.text(descWrapped, margin + 3, cursorY);
      cursorY += descWrapped.length * 4.5 + 3.5;
    });
    cursorY += 3;
  }

  // 7. Student Activities
  renderSection('7. Student Activities', lesson.student_activities);

  // 8. Assessment / Evaluation
  renderSection('8. Formative Assessment & Evaluation', lesson.assessment);

  // 9. Conclusion
  renderSection('9. Conclusion & Wrap-Up', lesson.conclusion);

  // 10. Homework
  renderSection('10. Homework Assignment', lesson.homework_summary);

  // Teacher & Principal Sign-off block
  checkPageBreak(30);
  cursorY += 8;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, cursorY, margin + 60, cursorY);
  doc.line(pageWidth - margin - 60, cursorY, pageWidth - margin, cursorY);
  cursorY += 4;
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Teacher's Signature & Date", margin, cursorY);
  doc.text("Principal / HOD Approval Stamp", pageWidth - margin - 60, cursorY);

  drawHeaderFooter();

  // Save PDF file
  const filename = `${lesson.class_name_snapshot}_${lesson.subject_name_snapshot}_${lesson.topic.replace(/[^a-zA-Z0-9]/g, '_')}_LessonPlan.pdf`;
  doc.save(filename);
}
