import React, { useState, useEffect } from 'react';
import { AttendanceEntry, Student, Role, AttendanceStatus } from '../../types/index.ts';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  Save,
  Users,
  Search,
  CheckCheck,
  Download,
  FileSpreadsheet
} from 'lucide-react';

interface AttendanceRegisterProps {
  students: Student[];
  attendanceRecords: AttendanceEntry[];
  currentRole: Role;
  onSaveAttendance: (entries: AttendanceEntry[]) => Promise<void>;
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({
  students,
  attendanceRecords,
  currentRole,
  onSaveAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-10-27');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [currentEntries, setCurrentEntries] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState(false);

  // Helper to safely format CSV cells with escaping
  const formatCSVCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Export attendance log to CSV for official CBSE school record-keeping
  const handleExportCSV = (scope: 'current' | 'all' = 'current') => {
    setIsExporting(true);
    try {
      const rows: string[] = [];
      const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      // 1. Institutional CBSE Header
      rows.push(formatCSVCell('SCHOLASYNC PUBLIC SCHOOL - OFFICIAL STATUTORY ATTENDANCE REGISTER'));
      rows.push(formatCSVCell('CBSE Affiliation No: 2130894 | School Code: 71204'));
      rows.push(formatCSVCell(`Export Timestamp: ${timestamp} IST`));
      rows.push(formatCSVCell(`Export Authorized By: ${currentRole === 'admin' ? 'School Administrator (Principal Office)' : 'Faculty In-Charge'}`));

      if (scope === 'current') {
        rows.push(formatCSVCell(`Target Class & Section: ${selectedGradeLevel} - Section ${selectedSection} | Session Date: ${selectedDate}`));
        rows.push(formatCSVCell(`Roster Strength: ${total} | Present: ${presents} | Absent: ${absents} | Late: ${lates} | Excused: ${excused} | Session Compliance Rate: ${dayRate}%`));
        rows.push(''); // Blank separator row

        // Column Headers
        rows.push([
          formatCSVCell('Roll No'),
          formatCSVCell('Scholar / Admission No'),
          formatCSVCell('Student Full Name'),
          formatCSVCell('Class Level'),
          formatCSVCell('Section'),
          formatCSVCell('Attendance Date'),
          formatCSVCell('Attendance Status'),
          formatCSVCell('Cumulative Aggregate Rate'),
          formatCSVCell('CBSE Exam Eligibility (Min 75%)'),
          formatCSVCell('Faculty Remarks / Medical Excuse'),
          formatCSVCell('Parent / Guardian Name'),
          formatCSVCell('Emergency Contact Phone'),
          formatCSVCell('Parent Email'),
          formatCSVCell('Residential Address'),
        ].join(','));

        // Student Data Rows
        classStudents.forEach((student) => {
          const entry = currentEntries[student.id];
          const status = entry?.status || 'present';
          const remarks = entry?.remarks || '';
          const isEligible = student.attendanceRate >= 75;

          rows.push([
            formatCSVCell(student.rollNo),
            formatCSVCell(student.admissionNo),
            formatCSVCell(student.name),
            formatCSVCell(student.gradeLevel),
            formatCSVCell(student.section),
            formatCSVCell(selectedDate),
            formatCSVCell(status.toUpperCase()),
            formatCSVCell(`${student.attendanceRate.toFixed(1)}%`),
            formatCSVCell(isEligible ? 'ELIGIBLE' : 'CRITICAL DEFICIT (< 75% WARNING)'),
            formatCSVCell(remarks),
            formatCSVCell(student.parentName),
            formatCSVCell(student.parentPhone),
            formatCSVCell(student.parentEmail),
            formatCSVCell(student.address),
          ].join(','));
        });
      } else {
        // Complete historical attendance log across all stored dates
        rows.push(formatCSVCell('Scope: Full Historical Cumulative Log of Recorded Sessions'));
        rows.push(formatCSVCell(`Total Log Records Count: ${attendanceRecords.length}`));
        rows.push(''); // Blank separator row

        rows.push([
          formatCSVCell('Record ID'),
          formatCSVCell('Date'),
          formatCSVCell('Class Level'),
          formatCSVCell('Section'),
          formatCSVCell('Roll No'),
          formatCSVCell('Student Name'),
          formatCSVCell('Student ID'),
          formatCSVCell('Attendance Status'),
          formatCSVCell('Official Remarks'),
          formatCSVCell('Recorded By'),
        ].join(','));

        attendanceRecords.forEach((rec) => {
          rows.push([
            formatCSVCell(rec.id),
            formatCSVCell(rec.date),
            formatCSVCell(rec.gradeLevel),
            formatCSVCell(rec.section),
            formatCSVCell(rec.rollNo),
            formatCSVCell(rec.studentName),
            formatCSVCell(rec.studentId),
            formatCSVCell(rec.status.toUpperCase()),
            formatCSVCell(rec.remarks || ''),
            formatCSVCell(rec.markedBy || 'School Faculty'),
          ].join(','));
        });
      }

      // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
      const csvContent = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const safeGrade = selectedGradeLevel.replace(/\s+/g, '_');
      const filename = scope === 'current'
        ? `Attendance_${safeGrade}_Sec${selectedSection}_${selectedDate}.csv`
        : `Attendance_All_Historical_Logs_${selectedDate}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMsg(true);
      setTimeout(() => setExportSuccessMsg(false), 3500);
    } catch (err) {
      console.error('Failed to generate CSV export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter students in the selected class
  const classStudents = students.filter(
    (s) => s.gradeLevel === selectedGradeLevel && s.section === selectedSection
  );

  // Initialize or load attendance entries for selectedDate and class
  useEffect(() => {
    const map: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    classStudents.forEach((student) => {
      const existing = attendanceRecords.find(
        (a) => a.studentId === student.id && a.date === selectedDate
      );
      if (existing) {
        map[student.id] = { status: existing.status, remarks: existing.remarks || '' };
      } else {
        // Default to present
        map[student.id] = { status: 'present', remarks: '' };
      }
    });

    setCurrentEntries(map);
  }, [selectedDate, selectedGradeLevel, selectedSection, attendanceRecords]);

  // Handle status toggle
  const handleToggleStatus = (studentId: string, status: AttendanceStatus) => {
    setCurrentEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setCurrentEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // Shortcut: Mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = { status: 'present', remarks: '' };
    });
    setCurrentEntries(updated);
  };

  // Save register
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(false);
    try {
      const payload: AttendanceEntry[] = classStudents.map((s) => ({
        id: `att-${s.id}-${selectedDate}`,
        studentId: s.id,
        studentName: s.name,
        rollNo: s.rollNo,
        gradeLevel: selectedGradeLevel,
        section: selectedSection,
        date: selectedDate,
        status: currentEntries[s.id]?.status || 'present',
        remarks: currentEntries[s.id]?.remarks || '',
        markedBy: currentRole === 'teacher' ? 'Prof. Marcus Chen' : 'School Administrator',
      }));

      await onSaveAttendance(payload);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Compute daily metrics
  const total = classStudents.length;
  const presents = Object.values(currentEntries).filter((e) => e.status === 'present').length;
  const absents = Object.values(currentEntries).filter((e) => e.status === 'absent').length;
  const lates = Object.values(currentEntries).filter((e) => e.status === 'late').length;
  const excused = Object.values(currentEntries).filter((e) => e.status === 'excused').length;
  const effectivePresent = presents + excused + lates;
  const dayRate = total > 0 ? Number(((effectivePresent / total) * 100).toFixed(1)) : 100;

  // Identify students below 75% attendance threshold
  const criticalStudents = classStudents.filter((s) => s.attendanceRate < 75);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Daily Attendance Register & Roll Call
          </h1>
          <p className="text-xs text-slate-500">
            Real-time session recording with automatic statutory attendance compliance checking
          </p>
        </div>

        {/* Date and Class Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 font-mono text-xs focus:outline-none"
            />
          </div>

          {/* Grade Level */}
          <select
            value={selectedGradeLevel}
            onChange={(e) => setSelectedGradeLevel(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-800 font-medium"
          >
            <option value="Class 10">Class 10</option>
            <option value="Class 11">Class 11</option>
            <option value="Class 12">Class 12</option>
          </select>

          {/* Section */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-800 font-medium"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="Science">Section Science</option>
          </select>
        </div>
      </div>

      {/* Daily Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="text-center p-2">
          <div className="text-slate-500 text-xs">Roster Strength</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {total}
          </div>
        </div>

        <div className="text-center p-2 border-l border-slate-100">
          <div className="text-emerald-700 text-xs font-medium">Present (P)</div>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
            {presents}
          </div>
        </div>

        <div className="text-center p-2 border-l border-slate-100">
          <div className="text-rose-700 text-xs font-medium">Absent (A)</div>
          <div className="text-xl font-bold text-rose-700 font-mono tabular-nums mt-0.5">
            {absents}
          </div>
        </div>

        <div className="text-center p-2 border-l border-slate-100">
          <div className="text-amber-700 text-xs font-medium">Late (L)</div>
          <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-0.5">
            {lates}
          </div>
        </div>

        <div className="text-center p-2 border-l border-slate-100 col-span-2 sm:col-span-1">
          <div className="text-slate-700 text-xs font-medium">Day Attendance</div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {dayRate}%
          </div>
        </div>
      </div>

      {/* Critical Alert Banner if students < 75% */}
      {criticalStudents.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h3 className="font-bold text-rose-900">
              Statutory Low Attendance Warning ({criticalStudents.length} Student Alert)
            </h3>
            <p className="text-rose-700 mt-1 leading-relaxed">
              The following student(s) have fallen below the 75% attendance threshold required for final term examination clearance:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {criticalStudents.map((s) => (
                <span
                  key={s.id}
                  className="font-medium text-rose-900 bg-white border border-rose-300 rounded px-2 py-0.5 font-mono tabular-nums"
                >
                  {s.name} ({s.attendanceRate.toFixed(1)}%) · Parent: {s.parentPhone}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark All Present</span>
          </button>

          {/* Export to CSV Buttons for Administrators & Institutional Record-Keeping */}
          <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleExportCSV('current')}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Download official CSV attendance dossier for current session"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating CSV...' : 'Export to CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV('all')}
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title="Export complete cumulative attendance logs across all dates in database"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">All Logs</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {exportSuccessMsg && (
            <span className="text-xs text-emerald-800 font-medium flex items-center gap-1 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md animate-fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Official CSV Export Downloaded!
            </span>
          )}

          {saveSuccessMsg && (
            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Attendance register recorded!
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Recording Register...' : 'Save Attendance Register'}</span>
          </button>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                <th className="py-3 px-4 w-16 text-center">Roll No</th>
                <th className="py-3 px-4">Student Name & ID</th>
                <th className="py-3 px-4 text-center">Aggregate Attendance</th>
                <th className="py-3 px-4 text-center">Status for {selectedDate}</th>
                <th className="py-3 px-4">Remarks & Excuses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {classStudents.map((student) => {
                const currentStatus = currentEntries[student.id]?.status || 'present';
                const currentRemarks = currentEntries[student.id]?.remarks || '';
                const isWarning = student.attendanceRate < 75;

                return (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Roll No */}
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-800">
                      #{student.rollNo}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {student.admissionNo} · {student.parentPhone}
                      </div>
                    </td>

                    {/* Aggregate Rate */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`font-mono tabular-nums font-bold ${
                            isWarning ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {student.attendanceRate.toFixed(1)}%
                        </span>
                        {isWarning && (
                          <span className="text-[10px] text-rose-700 bg-rose-50 px-1 py-0.5 rounded font-medium">
                            Warning
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Attendance Toggle Buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(student.id, 'present')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Mark Present"
                        >
                          P
                        </button>

                        {/* Absent */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(student.id, 'absent')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Mark Absent"
                        >
                          A
                        </button>

                        {/* Late */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(student.id, 'late')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                            currentStatus === 'late'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Mark Late"
                        >
                          L
                        </button>

                        {/* Excused */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(student.id, 'excused')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                            currentStatus === 'excused'
                              ? 'bg-slate-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Mark Excused"
                        >
                          E
                        </button>
                      </div>
                    </td>

                    {/* Remarks Input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={currentRemarks}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        placeholder="e.g. Medical doctor slip / Late bus arrival..."
                        className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
