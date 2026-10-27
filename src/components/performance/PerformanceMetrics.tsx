import React, { useState } from 'react';
import { Student, GradeRecord, Role } from '../../types/index.ts';
import {
  TrendingUp,
  Award,
  BookOpen,
  Target,
  BarChart2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface PerformanceMetricsProps {
  students: Student[];
  grades: GradeRecord[];
  selectedStudentId: string;
  onSelectStudentId: (id: string) => void;
  onOpenReportCard: (student: Student, gradeRecord: GradeRecord) => void;
  currentRole: Role;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  students,
  grades,
  selectedStudentId,
  onSelectStudentId,
  onOpenReportCard,
  currentRole,
}) => {
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentGrades = grades.filter((g) => g.studentId === currentStudent?.id);
  const currentGradeRecord = studentGrades[0] || null;

  // Class benchmarks (calculated class average scores)
  const classAverages: Record<string, number> = {
    Mathematics: 82,
    Physics: 80,
    'English Literature': 84,
    'Computer Science': 88,
    Chemistry: 78,
    'World History': 81,
  };

  const gpaTrajectory = [
    { term: 'Term 1 (Half-Yearly)', gpa: Number((currentStudent.gpa - 0.2).toFixed(1)), classAvg: 8.2 },
    { term: 'Term 2 (Pre-Board)', gpa: currentStudent.gpa, classAvg: 8.5 },
    { term: 'Annual Board Exam (Target)', gpa: Math.min(10, Number((currentStudent.gpa + 0.2).toFixed(1))), classAvg: 8.7 },
  ];

  const percentile = Math.min(99, Math.round(currentStudent.percentage));

  return (
    <div className="space-y-6">
      {/* Header and Student Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Student Performance Metrics & Academic Trajectories
          </h1>
          <p className="text-xs text-slate-500">
            Multi-subject mastery analytics, benchmark comparisons, and historical term trends
          </p>
        </div>

        {/* Student Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Select Student:</span>
          <select
            value={currentStudent?.id}
            onChange={(e) => onSelectStudentId(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 font-medium"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.gradeLevel}-{s.section} · Roll #{s.rollNo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cumulative GPA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Cumulative GPA</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {currentStudent.gpa.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Scale of 10.0 · {currentStudent.gpa >= 9.0 ? 'CBSE Grade A1 Merit' : 'Good Standing'}
          </div>
        </div>

        {/* Class Percentile */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Class Percentile</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700 font-mono tabular-nums">
            {percentile}th %ile
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Higher than {percentile}% of grade cohort
          </div>
        </div>

        {/* Attendance Compliance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Attendance Rate</span>
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {currentStudent.attendanceRate.toFixed(1)}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {currentStudent.attendanceRate >= 75 ? (
              <span className="text-emerald-700 font-medium">Eligible for examinations</span>
            ) : (
              <span className="text-rose-600 font-medium">Below statutory 75% limit</span>
            )}
          </div>
        </div>

        {/* Report Card Action */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="text-xs text-slate-500">Official Documentation</div>
          <div className="my-2">
            <button
              onClick={() => {
                if (currentGradeRecord) onOpenReportCard(currentStudent, currentGradeRecord);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Official Transcript</span>
            </button>
          </div>
          <div className="text-[11px] text-slate-400 text-center">
            Signed by Academic Council
          </div>
        </div>
      </div>

      {/* Main Analysis: Subject Mastery vs Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Mastery Comparison Bars (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Subject Mastery vs. Class Benchmark
              </h2>
              <p className="text-xs text-slate-500">
                Comparing student composite marks with cohort averages
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-900 rounded-xs" />
                {currentStudent.name.split(' ')[0]}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-slate-300 rounded-xs" />
                Class Avg
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {(currentGradeRecord?.subjects || []).map((sub) => {
              const classAvg = classAverages[sub.subject] || 80;
              const delta = sub.totalScore - classAvg;

              return (
                <div key={sub.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{sub.subject}</span>
                    <div className="flex items-center gap-3 text-slate-500 font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{sub.totalScore}%</span>
                      <span>·</span>
                      <span className="text-slate-500">Avg: {classAvg}%</span>
                      <span>·</span>
                      <span className={delta >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                        {delta >= 0 ? `+${delta}%` : `${delta}%`}
                      </span>
                    </div>
                  </div>

                  {/* Dual comparison bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                    {/* Class average marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                      style={{ left: `${classAvg}%` }}
                      title={`Class average: ${classAvg}%`}
                    />
                    {/* Student progress bar */}
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${sub.totalScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Teacher Remarks Feed */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-900 mb-3">Faculty Subject Evaluations</h3>
            <div className="space-y-2 text-xs">
              {(currentGradeRecord?.subjects || []).slice(0, 3).map((sub) => (
                <div key={sub.subject} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{sub.subject}</span>
                    <span className="text-slate-500 text-[11px]">{sub.teacherName}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    "{sub.remarks}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GPA Trajectory & Growth Areas (1 Col) */}
        <div className="space-y-6">
          {/* Term GPA Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Term-by-Term GPA</h2>
                <p className="text-xs text-slate-500">Academic trajectory across school year</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-4">
              {gpaTrajectory.map((point) => (
                <div key={point.term} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{point.term}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {point.gpa.toFixed(1)} CGPA
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${(point.gpa / 10.0) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Strengths & Recommendations */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-xs space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Academic Strengths
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Demonstrates high analytical problem-solving in Computer Science & Mathematics. Consistently submits lab assignments ahead of deadlines.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                Growth Recommendations
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Recommend participating in Science Olympiad tutoring and continuing consistent attendance to maintain Dean's List eligibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
