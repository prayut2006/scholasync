import React from 'react';
import { Role, Student } from '../types/index.ts';
import { ShieldCheck, UserCheck, GraduationCap, ChevronRight, User } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  selectedStudentId: string;
  onSelectStudentId: (id: string) => void;
  students: Student[];
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  selectedStudentId,
  onSelectStudentId,
  students,
}) => {
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  return (
    <div className="bg-slate-50 border-b border-slate-200 text-xs py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Role Details */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            {currentRole === 'admin' && (
              <>
                <ShieldCheck className="w-4 h-4 text-slate-900" />
                <span>Admin View:</span>
                <span className="font-semibold text-slate-900">Dr. Arthur Vance (Principal)</span>
              </>
            )}
            {currentRole === 'teacher' && (
              <>
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Faculty View:</span>
                <span className="font-semibold text-slate-900">Prof. Marcus Chen (Sciences & Physics)</span>
              </>
            )}
            {currentRole === 'student' && (
              <>
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span>Student & Parent Portal:</span>
                <span className="font-semibold text-slate-900">{currentStudent?.name || 'Student'}</span>
              </>
            )}
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Permissions / Scope note */}
          <span className="text-slate-500 hidden md:inline">
            {currentRole === 'admin' && 'Full school administrative access · Student roster · School ledger & billing'}
            {currentRole === 'teacher' && 'Class 10-A register · Assessment grading · Report card generation'}
            {currentRole === 'student' && 'Personal academic transcript · Attendance history · Online fee invoices & receipts'}
          </span>
        </div>

        {/* Right: Switch active student (useful when in Student mode or testing) */}
        {currentRole === 'student' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Viewing Student:
            </span>
            <select
              value={selectedStudentId}
              onChange={(e) => onSelectStudentId(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.gradeLevel}-{s.section})
                </option>
              ))}
            </select>
          </div>
        )}

        {currentRole !== 'student' && (
          <div className="flex items-center gap-2 text-slate-500">
            <span>Academic Year: <strong className="text-slate-800 font-mono">2025–2026</strong></span>
            <span>·</span>
            <span>Term: <strong className="text-slate-800">Spring Term 2</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
