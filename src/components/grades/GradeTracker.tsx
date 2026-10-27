import React, { useState } from 'react';
import { GradeRecord, Student, SubjectGrade, Role } from '../../types/index.ts';
import {
  Award,
  BookOpen,
  Edit3,
  FileText,
  Sliders,
  Check,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';

interface GradeTrackerProps {
  grades: GradeRecord[];
  students: Student[];
  currentRole: Role;
  onSaveGradeRecord: (record: GradeRecord) => Promise<void>;
  onOpenReportCard: (student: Student, gradeRecord: GradeRecord) => void;
}

export const GradeTracker: React.FC<GradeTrackerProps> = ({
  grades,
  students,
  currentRole,
  onSaveGradeRecord,
  onOpenReportCard,
}) => {
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedTerm, setSelectedTerm] = useState<'Half-Yearly (Term 1)' | 'Pre-Board / Term 2' | 'Annual Board Exam'>('Pre-Board / Term 2');
  const [activeEditingRecord, setActiveEditingRecord] = useState<GradeRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter students and their grade records
  const classStudents = students.filter(
    (s) => s.gradeLevel === selectedGradeLevel && s.section === selectedSection
  );

  const getRecordForStudent = (studentId: string): GradeRecord => {
    const existing = grades.find(
      (g) => g.studentId === studentId && g.term === selectedTerm
    );
    if (existing) return existing;

    // Default template record if student doesn't have one yet
    const student = students.find((s) => s.id === studentId);
    return {
      id: `grd-${studentId}-${selectedTerm.toLowerCase().replace(' ', '')}`,
      studentId,
      academicYear: '2025-2026',
      term: selectedTerm,
      gradeLevel: selectedGradeLevel,
      section: selectedSection,
      overallGpa: student?.gpa || 3.5,
      overallPercentage: Math.round((student?.gpa || 3.5) * 23.5),
      classRank: 1,
      totalStudentsInClass: classStudents.length,
      updatedAt: new Date().toISOString().split('T')[0],
      subjects: [
        {
          subject: 'Mathematics',
          teacherName: 'Dr. Rebecca Hastings',
          credits: 4,
          quizScore: 85,
          assignmentScore: 88,
          midtermScore: 86,
          finalExamScore: 89,
          totalScore: 87,
          letterGrade: 'B+',
          gradePoint: 3.3,
          remarks: 'Good progress and consistent homework.',
        },
        {
          subject: 'Physics',
          teacherName: 'Prof. Marcus Chen',
          credits: 4,
          quizScore: 88,
          assignmentScore: 90,
          midtermScore: 87,
          finalExamScore: 91,
          totalScore: 89,
          letterGrade: 'A-',
          gradePoint: 3.7,
          remarks: 'Strong comprehension in lab experiments.',
        },
        {
          subject: 'English Literature',
          teacherName: 'Julian Sterling',
          credits: 3,
          quizScore: 90,
          assignmentScore: 92,
          midtermScore: 88,
          finalExamScore: 92,
          totalScore: 91,
          letterGrade: 'A',
          gradePoint: 4.0,
          remarks: 'Insightful textual analysis and writing.',
        },
        {
          subject: 'Computer Science',
          teacherName: 'Priya Sundaram',
          credits: 3,
          quizScore: 94,
          assignmentScore: 96,
          midtermScore: 92,
          finalExamScore: 95,
          totalScore: 94,
          letterGrade: 'A',
          gradePoint: 4.0,
          remarks: 'Excellent algorithms and clean code submission.',
        },
      ],
    };
  };

  // Helper to calculate composite score and letter grade
  const computeComposite = (quiz: number, assignment: number, midterm: number, finalExam: number) => {
    // Weighted formula: Quiz (15%) + Assignment (15%) + Midterm (30%) + Final (40%)
    const composite = Math.round(
      quiz * 0.15 + assignment * 0.15 + midterm * 0.3 + finalExam * 0.4
    );

    let letterGrade = 'F';
    let gradePoint = 0.0;

    if (composite >= 95) {
      letterGrade = 'A+';
      gradePoint = 4.0;
    } else if (composite >= 90) {
      letterGrade = 'A';
      gradePoint = 4.0;
    } else if (composite >= 85) {
      letterGrade = 'A-';
      gradePoint = 3.7;
    } else if (composite >= 80) {
      letterGrade = 'B+';
      gradePoint = 3.3;
    } else if (composite >= 75) {
      letterGrade = 'B';
      gradePoint = 3.0;
    } else if (composite >= 70) {
      letterGrade = 'C+';
      gradePoint = 2.3;
    } else if (composite >= 65) {
      letterGrade = 'C';
      gradePoint = 2.0;
    } else if (composite >= 60) {
      letterGrade = 'D';
      gradePoint = 1.0;
    } else {
      letterGrade = 'F';
      gradePoint = 0.0;
    }

    return { composite, letterGrade, gradePoint };
  };

  const handleScoreChange = (
    subjectIndex: number,
    field: 'quizScore' | 'assignmentScore' | 'midtermScore' | 'finalExamScore',
    val: number
  ) => {
    if (!activeEditingRecord) return;
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    const updatedSubjects = [...activeEditingRecord.subjects];
    const sub = { ...updatedSubjects[subjectIndex], [field]: clamped };

    const { composite, letterGrade, gradePoint } = computeComposite(
      field === 'quizScore' ? clamped : sub.quizScore,
      field === 'assignmentScore' ? clamped : sub.assignmentScore,
      field === 'midtermScore' ? clamped : sub.midtermScore,
      field === 'finalExamScore' ? clamped : sub.finalExamScore
    );

    sub.totalScore = composite;
    sub.letterGrade = letterGrade;
    sub.gradePoint = gradePoint;
    updatedSubjects[subjectIndex] = sub;

    // Recalculate overall GPA and percentage
    const totalCredits = updatedSubjects.reduce((acc, s) => acc + s.credits, 0);
    const totalWeightedPoints = updatedSubjects.reduce((acc, s) => acc + s.gradePoint * s.credits, 0);
    const overallGpa = Number((totalWeightedPoints / totalCredits).toFixed(2));
    const overallPercentage = Math.round(
      updatedSubjects.reduce((acc, s) => acc + s.totalScore, 0) / updatedSubjects.length
    );

    setActiveEditingRecord({
      ...activeEditingRecord,
      subjects: updatedSubjects,
      overallGpa,
      overallPercentage,
    });
  };

  const handleSaveMarks = async () => {
    if (!activeEditingRecord) return;
    setIsSaving(true);
    try {
      await onSaveGradeRecord(activeEditingRecord);
      setActiveEditingRecord(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Academic Gradebook & Evaluation Ledger</h1>
          <p className="text-xs text-slate-500">
            Weighted assessment system: Quizzes 15% · Assignments 15% · Mid-Term 30% · Comprehensive Exam 40%
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Cohort */}
          <select
            value={selectedGradeLevel}
            onChange={(e) => setSelectedGradeLevel(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 font-medium"
          >
            <option value="Class 10">Class 10</option>
            <option value="Class 11">Class 11</option>
            <option value="Class 12">Class 12</option>
          </select>

          {/* Section */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 font-medium"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="Science">Section Science</option>
          </select>

          {/* Term */}
          <select
            value={selectedTerm}
            onChange={(e: any) => setSelectedTerm(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 font-medium"
          >
            <option value="Half-Yearly (Term 1)">Half-Yearly (Term 1)</option>
            <option value="Pre-Board / Term 2">Pre-Board / Term 2</option>
            <option value="Annual Board Exam">Annual Board Exam</option>
          </select>
        </div>
      </div>

      {/* Main Gradebook Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                <th className="py-3 px-4">Student Name & Roll</th>
                <th className="py-3 px-4 text-center">Class Rank</th>
                <th className="py-3 px-4">Subject Highlights</th>
                <th className="py-3 px-4 text-right">Composite %</th>
                <th className="py-3 px-4 text-right">Term GPA (4.0)</th>
                <th className="py-3 px-4 text-center">Academic Standing</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {classStudents.map((student) => {
                const record = getRecordForStudent(student.id);
                const gpa = record.overallGpa;
                const isDeanList = gpa >= 3.8;
                const isAtRisk = gpa < 2.5;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Roll */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        Roll #{student.rollNo} · {student.admissionNo}
                      </div>
                    </td>

                    {/* Class Rank */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono tabular-nums font-bold text-slate-800">
                        #{record.classRank || student.rollNo}
                      </span>
                      <span className="text-[10px] text-slate-400 block">of {classStudents.length}</span>
                    </td>

                    {/* Subject scores summary */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {record.subjects.slice(0, 4).map((sub) => (
                          <div
                            key={sub.subject}
                            className="text-slate-600 font-mono tabular-nums bg-slate-100 px-2 py-0.5 rounded"
                          >
                            <span className="text-slate-500 font-sans mr-1">{sub.subject.slice(0, 4)}:</span>
                            <strong>{sub.totalScore}</strong>
                            <span className="text-slate-400 ml-0.5">({sub.letterGrade})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Composite % */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-800">
                      {record.overallPercentage}%
                    </td>

                    {/* Term GPA */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 text-sm">
                      {gpa.toFixed(2)}
                    </td>

                    {/* Academic Standing */}
                    <td className="py-3 px-4 text-center">
                      {isDeanList && (
                        <span className="text-emerald-700 font-medium">
                          Principal's List
                        </span>
                      )}
                      {!isDeanList && !isAtRisk && (
                        <span className="text-slate-600 font-medium">
                          Good Standing
                        </span>
                      )}
                      {isAtRisk && (
                        <span className="text-rose-600 font-semibold flex items-center justify-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Remedial Focus
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveEditingRecord(record)}
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          title="Enter / Edit Marks"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Enter Marks</span>
                        </button>
                        <button
                          onClick={() => onOpenReportCard(student, record)}
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          title="Generate & Print Report Card"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Report Card</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Marks Modal */}
      {activeEditingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Update Subject Assessments · {activeEditingRecord.term}
                </h2>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  Student ID: {activeEditingRecord.studentId} · Academic Year 2025–2026
                </div>
              </div>
              <button
                onClick={() => setActiveEditingRecord(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Overall calculated metrics preview */}
            <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Calculated Term GPA: </span>
                <strong className="text-slate-900 font-mono text-sm ml-1">
                  {activeEditingRecord.overallGpa.toFixed(2)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Composite Average: </span>
                <strong className="text-slate-900 font-mono text-sm ml-1">
                  {activeEditingRecord.overallPercentage}%
                </strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Formula: (Quiz×0.15) + (HW×0.15) + (Mid×0.3) + (Final×0.4)
              </div>
            </div>

            {/* Subject Marks Breakdown Inputs */}
            <div className="space-y-4">
              {activeEditingRecord.subjects.map((sub, idx) => (
                <div
                  key={sub.subject}
                  className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{sub.subject}</span>
                      <span className="text-slate-500 text-[11px] ml-2">({sub.credits} Credits · {sub.teacherName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-slate-700 font-bold">
                        Total: {sub.totalScore}%
                      </span>
                      <span className="bg-slate-900 text-white font-mono px-2 py-0.5 rounded text-[11px] font-semibold">
                        Grade {sub.letterGrade} ({sub.gradePoint.toFixed(1)})
                      </span>
                    </div>
                  </div>

                  {/* Inputs Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Quizzes (15%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.quizScore}
                        onChange={(e) => handleScoreChange(idx, 'quizScore', parseInt(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1 font-mono tabular-nums text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Assignments (15%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.assignmentScore}
                        onChange={(e) => handleScoreChange(idx, 'assignmentScore', parseInt(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1 font-mono tabular-nums text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Mid-Term (30%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.midtermScore}
                        onChange={(e) => handleScoreChange(idx, 'midtermScore', parseInt(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1 font-mono tabular-nums text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Final Exam (40%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={sub.finalExamScore}
                        onChange={(e) => handleScoreChange(idx, 'finalExamScore', parseInt(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1 font-mono tabular-nums text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Faculty Remarks
                    </label>
                    <input
                      type="text"
                      value={sub.remarks}
                      onChange={(e) => {
                        const updated = [...activeEditingRecord.subjects];
                        updated[idx].remarks = e.target.value;
                        setActiveEditingRecord({ ...activeEditingRecord, subjects: updated });
                      }}
                      placeholder="Feedback on analytical performance or lab conduct..."
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={() => setActiveEditingRecord(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveMarks}
                className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isSaving ? 'Recalculating & Saving...' : 'Save & Publish Marks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
