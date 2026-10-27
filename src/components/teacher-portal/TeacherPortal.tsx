import React, { useState, useEffect } from 'react';
import {
  Teacher,
  Student,
  GradeRecord,
  AttendanceEntry,
  LeaveApplication,
  Assignment,
  AssignmentSubmission,
  ExamSchedule,
  TimetableSlot
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { GradeTracker } from '../grades/GradeTracker.tsx';
import { AttendanceRegister } from '../attendance/AttendanceRegister.tsx';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  Award,
  Users,
  FileCheck,
  BookOpen,
  Calendar,
  Plus,
  FileText,
  Send,
  Eye,
  CheckSquare
} from 'lucide-react';

interface TeacherPortalProps {
  teacher: Teacher;
  students: Student[];
  grades: GradeRecord[];
  attendanceRecords: AttendanceEntry[];
  onSaveGradeRecord: (record: GradeRecord) => Promise<void>;
  onSaveAttendance: (entries: AttendanceEntry[]) => Promise<void>;
  onOpenReportCard: (student: Student, gradeRecord: GradeRecord) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  teacher,
  students,
  grades,
  attendanceRecords,
  onSaveGradeRecord,
  onSaveAttendance,
  onOpenReportCard,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'grades' | 'assignments' | 'leaves' | 'exams' | 'timetable' | 'roster'>('attendance');
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [isUpdatingLeave, setIsUpdatingLeave] = useState<string | null>(null);

  // Assignment Modal
  const [isAsgModalOpen, setIsAsgModalOpen] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgSubject, setAsgSubject] = useState(teacher.subjects[0] || 'Physics');
  const [asgClass, setAsgClass] = useState('Class 10');
  const [asgSection, setAsgSection] = useState('A');
  const [asgDueDate, setAsgDueDate] = useState('2026-11-08');
  const [asgMaxMarks, setAsgMaxMarks] = useState(25);
  const [isCreatingAsg, setIsCreatingAsg] = useState(false);

  // Grading Modal
  const [activeSubmission, setActiveSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(20);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const loadTeacherData = async () => {
    try {
      const [lRes, aRes, eRes, tRes] = await Promise.all([
        api.getLeaves(),
        api.getAssignments({ teacherId: teacher.id }),
        api.getExams(),
        api.getTimetable('Class 10-A'),
      ]);
      setLeaves(lRes);
      setAssignments(aRes);
      setExams(eRes);
      setTimetable(tRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, [teacher.id]);

  const handleLeaveDecision = async (leaveId: string, status: 'approved' | 'rejected') => {
    setIsUpdatingLeave(leaveId);
    try {
      const updated = await api.updateLeaveStatus(leaveId, status, teacher.name);
      setLeaves((prev) => prev.map((l) => (l.id === leaveId ? updated : l)));
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingLeave(null);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle || !asgSubject) return;

    setIsCreatingAsg(true);
    try {
      await api.createAssignment({
        title: asgTitle,
        description: asgDesc,
        subject: asgSubject,
        gradeLevel: asgClass,
        section: asgSection,
        dueDate: asgDueDate,
        maxMarks: Number(asgMaxMarks),
      });
      setIsAsgModalOpen(false);
      setAsgTitle('');
      setAsgDesc('');
      await loadTeacherData();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setIsCreatingAsg(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setIsGrading(true);
    try {
      await api.gradeSubmission(activeSubmission.id, Number(gradeMarks), gradeFeedback);
      setActiveSubmission(null);
      await loadTeacherData();
    } catch (err: any) {
      alert(err.message || 'Failed to grade submission');
    } finally {
      setIsGrading(false);
    }
  };

  const myClassStudents = students.filter((s) => s.gradeLevel === 'Class 10' && s.section === 'A');
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Faculty Profile Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold text-xl shrink-0">
              {teacher.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
                <span>Faculty & Class Teacher Console</span>
                <span>·</span>
                <span className="font-mono">{teacher.employeeId}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{teacher.name}</h1>
              <div className="mt-1 text-xs text-slate-300">
                {teacher.designation} · Assigned: {teacher.assignedClasses.join(', ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 text-xs font-mono shrink-0">
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">Class 10-A Strength</span>
              <strong className="text-white text-base font-bold">{myClassStudents.length} Students</strong>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <span className="text-slate-400 text-[10px] block font-sans">Pending Leaves</span>
              <strong className={`text-base font-bold ${pendingLeaves.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pendingLeaves.length} To Review
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 text-xs font-semibold">
        {[
          { id: 'attendance', label: 'Attendance Register', icon: CalendarCheck },
          { id: 'grades', label: 'Marks & Gradebook', icon: Award },
          { id: 'assignments', label: `Homework & Assignments (${assignments.length})`, icon: BookOpen },
          { id: 'leaves', label: `Leave Approvals (${pendingLeaves.length})`, icon: FileCheck },
          { id: 'exams', label: 'Examination Dates', icon: Calendar },
          { id: 'timetable', label: 'My Timetable', icon: Clock },
          { id: 'roster', label: 'Class Roll Call', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <AttendanceRegister
          students={students}
          attendanceRecords={attendanceRecords}
          currentRole="teacher"
          onSaveAttendance={onSaveAttendance}
        />
      )}

      {/* Tab: Grades */}
      {activeTab === 'grades' && (
        <GradeTracker
          grades={grades}
          students={students}
          currentRole="teacher"
          onSaveGradeRecord={onSaveGradeRecord}
          onOpenReportCard={onOpenReportCard}
        />
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Homework & Class Assignments</h2>
              <p className="text-xs text-slate-500">
                Publish homework assignments, set submission deadlines, and evaluate student work.
              </p>
            </div>
            <button
              onClick={() => setIsAsgModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Publish Assignment
            </button>
          </div>

          <div className="p-6 space-y-6">
            {assignments.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No assignments published yet. Click "Publish Assignment" to assign homework.
              </div>
            ) : (
              assignments.map((asg) => (
                <div key={asg.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                          {asg.subject}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {asg.gradeLevel}-{asg.section}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{asg.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{asg.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">Max Marks: {asg.maxMarks}</div>
                      <div className="text-[11px] text-slate-500">Due: {asg.dueDate}</div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        {asg.submissions?.length || 0} Submissions
                      </div>
                    </div>
                  </div>

                  {/* Submissions List */}
                  {asg.submissions && asg.submissions.length > 0 && (
                    <div className="pt-3 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-800 mb-2">Student Submissions:</h4>
                      <div className="space-y-2">
                        {asg.submissions.map((sub) => (
                          <div
                            key={sub.id}
                            className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{sub.studentName}</div>
                              <div className="text-[11px] text-slate-500">
                                Submitted: {sub.submittedAt.slice(0, 10)}
                              </div>
                              {sub.content && (
                                <p className="text-[11px] text-slate-600 mt-0.5 italic">"{sub.content}"</p>
                              )}
                            </div>

                            <div className="text-right flex items-center gap-3">
                              {sub.status === 'graded' ? (
                                <div>
                                  <span className="text-emerald-700 font-bold">
                                    {sub.marksObtained} / {asg.maxMarks}
                                  </span>
                                  <div className="text-[10px] text-slate-400">Graded</div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveSubmission(sub);
                                    setGradeMarks(asg.maxMarks);
                                    setGradeFeedback('');
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                                >
                                  Evaluate & Grade
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Student Leave Requests */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Absence Applications & Slips</h2>
              <p className="text-xs text-slate-500">
                Review submitted leave requests from Class 10-A students for medical or family reasons
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              {pendingLeaves.length} Pending Actions
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaves.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No leave applications submitted.
              </div>
            ) : (
              leaves.map((l) => (
                <div key={l.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{l.studentName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-600">{l.gradeLevel}-{l.section} (Roll #{l.rollNo})</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500">Applied: {l.appliedAt}</span>
                    </div>
                    <div className="font-semibold text-slate-700">
                      Duration: {l.fromDate} to {l.toDate}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed max-w-2xl">
                      "{l.reason}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {l.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleLeaveDecision(l.id, 'approved')}
                          disabled={isUpdatingLeave === l.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleLeaveDecision(l.id, 'rejected')}
                          disabled={isUpdatingLeave === l.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                        l.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {l.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Examination Dates */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">CBSE Examination Schedules & Date Sheets</h2>
            <p className="text-xs text-slate-500">Official scheduled dates for Periodic Tests, Half-Yearly, and Pre-Board exams.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4 text-right">Max Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{ex.subject}</td>
                    <td className="py-3 px-4 text-slate-700">{ex.term}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{ex.date}</td>
                    <td className="py-3 px-4 text-slate-600">{ex.time}</td>
                    <td className="py-3 px-4 text-slate-700">{ex.room}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{ex.maxMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Timetable */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daily Teaching Timetable (Class 10-A)</h2>
            <p className="text-xs text-slate-500">Weekly schedule of periods, laboratory practicals, and classrooms.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timetable.map((slot) => (
              <div key={slot.period} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-bold text-slate-800">Period {slot.period}</span>
                  <span>{slot.time}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{slot.subject}</h4>
                <div className="text-xs text-emerald-700 font-medium mt-1">{slot.room}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Class Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">Class 10-A Student Dossiers</h3>
            <p className="text-xs text-slate-500">32 Enrolled scholars in your designated homeroom</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Roll</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Admission No</th>
                  <th className="py-2.5 px-4">Attendance %</th>
                  <th className="py-2.5 px-4">Term 1 %</th>
                  <th className="py-2.5 px-4">CGPA</th>
                  <th className="py-2.5 px-4">Parent Phone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myClassStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.rollNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{s.admissionNo}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${s.attendanceRate >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {s.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.percentage}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.gpa}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.parentPhone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH ASSIGNMENT */}
      {isAsgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Class Assignment</h3>
            <p className="text-slate-500 mb-4">Assign homework or practical portfolio work.</p>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={asgTitle}
                  onChange={(e) => setAsgTitle(e.target.value)}
                  placeholder="e.g. Electromagnetic Induction Practical Journal"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description / Problem Set</label>
                <textarea
                  rows={3}
                  required
                  value={asgDesc}
                  onChange={(e) => setAsgDesc(e.target.value)}
                  placeholder="Specify problem questions, lab diagram guidelines, or textbook pages..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={asgSubject}
                    onChange={(e) => setAsgSubject(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    {teacher.subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Class</label>
                  <select
                    value={asgClass}
                    onChange={(e) => setAsgClass(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={asgDueDate}
                    onChange={(e) => setAsgDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={100}
                    value={asgMaxMarks}
                    onChange={(e) => setAsgMaxMarks(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAsgModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAsg}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isCreatingAsg ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GRADE SUBMISSION */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Evaluate Student Submission</h3>
            <p className="text-slate-500 mb-4">
              Scoring assignment submission for <strong>{activeSubmission.studentName}</strong>.
            </p>

            <form onSubmit={handleGradeSubmission} className="space-y-3.5">
              {activeSubmission.content && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Scholar Answer / Journal Note:</span>
                  <p className="text-xs text-slate-700">{activeSubmission.content}</p>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Marks Awarded</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Educator Feedback / Remarks</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Constructive feedback for the scholar..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGrading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isGrading ? 'Saving...' : 'Save Grade & Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
