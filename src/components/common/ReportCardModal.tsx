import React from 'react';
import { Student, GradeRecord } from '../../types/index.ts';
import { Printer, X, Award, School, CheckCircle2 } from 'lucide-react';

interface ReportCardModalProps {
  student: Student | null;
  gradeRecord: GradeRecord | null;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  student,
  gradeRecord,
  onClose,
}) => {
  if (!student || !gradeRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDistinction = gradeRecord.overallPercentage >= 90;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 no-print">
          <div className="text-xs text-slate-500 font-mono">
            Marksheet Ref: CBSE-2026-{student.admissionNo}-{gradeRecord.term.replace(/[^a-zA-Z0-9]/g, '')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Marksheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 text-sm font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Marksheet Body */}
        <div className="mt-6 space-y-6 text-slate-800" id="report-card-print-area">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <School className="w-6 h-6 text-slate-900" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                ScholaSync Public School
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
              Affiliated to Central Board of Secondary Education (CBSE), New Delhi
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              CBSE Affiliation No. 2130894 · School Code: 71204
            </p>
            <div className="mt-2 inline-block bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold uppercase tracking-wider">
              Continuous & Comprehensive Evaluation Progress Report · {gradeRecord.term}
            </div>
          </div>

          {/* Student Profile Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Student Name</span>
              <strong className="text-slate-900 text-sm">{student.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Scholar / Admission ID</span>
              <span className="font-mono text-slate-800 font-bold">{student.admissionNo}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Class & Roll No</span>
              <span className="text-slate-800 font-semibold">{student.gradeLevel} - {student.section} (Roll #{student.rollNo})</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">CBSE Attendance</span>
              <span className="font-mono text-emerald-700 font-bold">{student.attendanceRate.toFixed(1)}% (Eligible)</span>
            </div>
          </div>

          {/* Subject Marks Table */}
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-semibold text-slate-700">
                  <th className="py-2.5 px-3">Subject & Teacher</th>
                  <th className="py-2.5 px-3 text-right">Periodic Test</th>
                  <th className="py-2.5 px-3 text-right">Portfolio</th>
                  <th className="py-2.5 px-3 text-right">Half-Yearly</th>
                  <th className="py-2.5 px-3 text-right">Pre-Board</th>
                  <th className="py-2.5 px-3 text-right">Marks (100)</th>
                  <th className="py-2.5 px-3 text-center">CBSE Grade</th>
                  <th className="py-2.5 px-3 text-right">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {gradeRecord.subjects.map((sub) => (
                  <tr key={sub.subject}>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      <div>{sub.subject}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{sub.teacherName}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{sub.quizScore}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{sub.assignmentScore}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{sub.midtermScore}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{sub.finalExamScore}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{sub.totalScore}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{sub.letterGrade}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">{sub.gradePoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aggregate Marks Strip */}
          <div className="grid grid-cols-3 gap-4 bg-slate-900 text-white p-4 rounded-lg text-center font-mono tabular-nums">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                Aggregate Percentage
              </span>
              <span className="text-xl font-bold">{gradeRecord.overallPercentage}%</span>
            </div>
            <div className="border-x border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                Cumulative CGPA (10.0 Scale)
              </span>
              <span className="text-xl font-bold text-emerald-400">{gradeRecord.overallGpa.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                Class Cohort Standing
              </span>
              <span className="text-xl font-bold">Rank #{gradeRecord.classRank || student.rollNo}</span>
            </div>
          </div>

          {/* Distinction Banner */}
          {isDistinction && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-xs text-emerald-900">
              <Award className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Merit Citation: </strong>
                Awarded CBSE Grade A1 Distinction for exceptional aggregate academic performance exceeding 90%.
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-[11px] text-slate-800">
                Prof. Marcus Verma
              </div>
              <div className="text-slate-500">Class Teacher (10-A)</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-[11px] text-slate-800">
                Mrs. Shanti Ramanathan
              </div>
              <div className="text-slate-500">Academic Dean</div>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-[11px] text-slate-800">
                Dr. Rajeshwar Sharma
              </div>
              <div className="text-slate-500">Principal & Official Seal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
