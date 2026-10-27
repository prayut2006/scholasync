import React, { useState, useEffect } from 'react';
import { Student, GradeRecord, AttendanceEntry, Invoice, Announcement, LeaveApplication, TimetableSlot, Assignment, AssignmentSubmission } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  GraduationCap,
  Calendar,
  CreditCard,
  Award,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  Bell,
  Clock4,
  QrCode,
  Smartphone,
  Plus,
  Send,
  Ticket
} from 'lucide-react';

interface MyStudentPortalProps {
  student: Student;
  gradeRecord: GradeRecord | null;
  attendanceRecords: AttendanceEntry[];
  invoices: Invoice[];
  announcements: Announcement[];
  onOpenReportCard: (student: Student, gradeRecord: GradeRecord) => void;
  onOpenReceipt: (invoice: Invoice) => void;
  onOpenAdmitCard: (student: Student) => void;
  onPayInvoice: (invoiceId: string, paymentMethod: string, amount?: number, upiVpa?: string) => Promise<Invoice>;
}

export const MyStudentPortal: React.FC<MyStudentPortalProps> = ({
  student,
  gradeRecord,
  attendanceRecords,
  invoices,
  announcements,
  onOpenReportCard,
  onOpenReceipt,
  onOpenAdmitCard,
  onPayInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'attendance' | 'fees' | 'notices' | 'timetable' | 'assignments'>('overview');
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeSubmitAsg, setActiveSubmitAsg] = useState<Assignment | null>(null);
  const [submitContent, setSubmitContent] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [isApplyingLeave, setIsApplyingLeave] = useState(false);
  const [leaveFromDate, setLeaveFromDate] = useState('2026-10-28');
  const [leaveToDate, setLeaveToDate] = useState('2026-10-29');
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // UPI Payment states
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [upiVpa, setUpiVpa] = useState('parent.sharma@okhdfcbank');
  const [paymentMode, setPaymentMode] = useState<'upi_qr' | 'upi_vpa' | 'netbanking'>('upi_qr');
  const [isPaying, setIsPaying] = useState(false);

  const loadStudentData = () => {
    api.getTimetable(`${student.gradeLevel}-${student.section}`).then(setTimetable);
    api.getLeaves(student.id).then(setLeaves);
    api.getAssignments({ gradeLevel: student.gradeLevel, section: student.section }).then(setAssignments);
  };

  useEffect(() => {
    loadStudentData();
  }, [student.id, student.gradeLevel, student.section]);

  const studentAttendance = attendanceRecords.filter((a) => a.studentId === student.id);
  const studentInvoices = invoices.filter((i) => i.studentId === student.id);
  const pendingInvoices = studentInvoices.filter((i) => i.status !== 'paid');

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    setIsSubmittingLeave(true);
    try {
      const created = await api.createLeave({
        studentId: student.id,
        studentName: student.name,
        gradeLevel: student.gradeLevel,
        section: student.section,
        rollNo: student.rollNo,
        fromDate: leaveFromDate,
        toDate: leaveToDate,
        reason: leaveReason,
      });
      setLeaves([created, ...leaves]);
      setIsApplyingLeave(false);
      setLeaveReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleConfirmUpiPayment = async (invoice: Invoice) => {
    setIsPaying(true);
    try {
      const updated = await onPayInvoice(
        invoice.id,
        paymentMode === 'upi_qr' ? 'UPI QR Code (PhonePe/GooglePay)' : 'UPI VPA Direct',
        invoice.totalAmount - invoice.paidAmount,
        upiVpa
      );
      setActivePaymentInvoice(null);
      onOpenReceipt(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  const isEligibleForExam = student.attendanceRate >= 75 && student.outstandingFee === 0;

  return (
    <div className="space-y-6">
      {/* Student Indian Profile Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold text-2xl shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">
                <span>CBSE Student Portal</span>
                <span>·</span>
                <span className="font-mono">Scholar #{student.admissionNo}</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{student.name}</h1>
              <div className="mt-1 text-xs text-slate-300 font-mono tabular-nums">
                {student.gradeLevel} - Section {student.section} · Roll #{student.rollNo} · CBSE Affiliation #2130894
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar in Indian Units */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            <div className="text-center px-3">
              <div className="text-[11px] text-slate-400">CBSE Aggregate</div>
              <div className="text-xl font-bold text-white font-mono tabular-nums mt-0.5">
                {student.percentage}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">CGPA {student.gpa.toFixed(1)}</div>
            </div>

            <div className="w-px h-10 bg-slate-700 hidden sm:block" />

            <div className="text-center px-3">
              <div className="text-[11px] text-slate-400">Attendance</div>
              <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
                student.attendanceRate >= 75 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {student.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400">Min 75% for Board</div>
            </div>

            <div className="w-px h-10 bg-slate-700 hidden sm:block" />

            <div className="text-center px-3">
              <div className="text-[11px] text-slate-400">Pending Fees</div>
              <div className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${
                student.outstandingFee === 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                ₹{student.outstandingFee.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Quarter 3</div>
            </div>

            <div className="w-px h-10 bg-slate-700 hidden lg:block" />

            {/* Admit Card Button */}
            <div className="pl-2">
              <button
                onClick={() => onOpenAdmitCard(student)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
                  isEligibleForExam
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Admit Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Segmented Controls */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Overview & Notices
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'grades' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Marks & Report Card
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'attendance' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Attendance & Leaves ({leaves.length})
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'fees' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Fee Portal {pendingInvoices.length > 0 && `(₹${student.outstandingFee.toLocaleString()})`}
        </button>
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'timetable' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Class Timetable
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'assignments' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Homework & Assignments ({assignments.length})
        </button>
      </div>

      {/* TAB 1: Overview & School Notices */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Academic Status & Recent Scores */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-xs font-medium text-slate-500">Board Exam Standing</div>
                <div className="mt-2 text-xl font-bold text-slate-900">
                  {student.percentage >= 90 ? 'Grade A1 (Merit List)' : 'Grade A2 (Good Standing)'}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Rank #{gradeRecord?.classRank || 1} in {student.gradeLevel}-{student.section}
                </p>
                <button
                  onClick={() => setActiveTab('grades')}
                  className="mt-3 text-xs font-semibold text-slate-900 hover:underline"
                >
                  View Subject-wise marks memo →
                </button>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <div className="text-xs font-medium text-slate-500">Fee Due Clearance</div>
                <div className="mt-2 text-xl font-bold font-mono tabular-nums text-slate-900">
                  {student.outstandingFee === 0 ? 'All Clear (Paid)' : `₹${student.outstandingFee.toLocaleString()} Due`}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Quarter 3 Term Examination & Tuition
                </p>
                <button
                  onClick={() => setActiveTab('fees')}
                  className="mt-3 text-xs font-semibold text-slate-900 hover:underline"
                >
                  Open UPI payment gateway →
                </button>
              </div>
            </div>

            {/* School Circulars / Notices */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-700" />
                  <h2 className="text-base font-bold text-slate-900">School Circulars & CBSE Notices</h2>
                </div>
                <span className="text-xs text-slate-500 font-mono">Academic Year 2025–26</span>
              </div>

              <div className="divide-y divide-slate-100">
                {announcements.map((ann) => (
                  <div key={ann.id} className="py-3.5 first:pt-1 last:pb-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{ann.category}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{ann.date}</span>
                      <span>·</span>
                      <span>{ann.author}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">{ann.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Timetable Preview & Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock4 className="w-4 h-4 text-emerald-600" />
                  <span>Today's Schedule</span>
                </h3>
                <span className="text-xs font-medium text-slate-500">{student.gradeLevel}-{student.section}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {timetable.slice(0, 5).map((slot) => (
                  <div key={slot.period} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{slot.subject}</div>
                      <div className="text-[11px] text-slate-500">{slot.teacher} · {slot.room}</div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {slot.time.split(' - ')[0]}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('timetable')}
                className="w-full mt-4 py-2 text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                View Full 8-Period Timetable
              </button>
            </div>

            {/* Quick Leave Application trigger */}
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 text-xs">
              <h3 className="font-bold text-sm mb-1">Need to Apply for Leave?</h3>
              <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                Submit an online absence slip with medical or personal reason directly to Class Teacher Prof. Marcus Verma.
              </p>
              <button
                onClick={() => {
                  setActiveTab('attendance');
                  setIsApplyingLeave(true);
                }}
                className="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors cursor-pointer text-center"
              >
                Submit Leave Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Scores & Report Card */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                CBSE Pre-Board & Term 2 Academic Performance
              </h2>
              <p className="text-xs text-slate-500">
                Evaluated marks out of 100 with CBSE 9-Point Grading Scale (A1 to E)
              </p>
            </div>

            {gradeRecord && (
              <button
                onClick={() => onOpenReportCard(student, gradeRecord)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Marksheet</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="py-3 px-4">Subject & Faculty</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-right">Periodic Test</th>
                  <th className="py-3 px-4 text-right">Notebook/Port</th>
                  <th className="py-3 px-4 text-right">Half-Yearly</th>
                  <th className="py-3 px-4 text-right">Pre-Board</th>
                  <th className="py-3 px-4 text-right">Total Marks</th>
                  <th className="py-3 px-4 text-center">CBSE Grade</th>
                  <th className="py-3 px-4 text-right">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {(gradeRecord?.subjects || []).map((sub) => (
                  <tr key={sub.subject} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      <div>{sub.subject}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{sub.teacherName}</div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">{sub.credits}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{sub.quizScore}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{sub.assignmentScore}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{sub.midtermScore}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{sub.finalExamScore}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      {sub.totalScore}/100
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-bold text-[11px]">
                        {sub.letterGrade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">{sub.gradePoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Attendance & Leaves */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Log & Leave Portal</h2>
              <p className="text-xs text-slate-500">
                Minimum 75% attendance is statutory for CBSE Board examination admit card clearance
              </p>
            </div>

            <button
              onClick={() => setIsApplyingLeave(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Leave Application Modal */}
          {isApplyingLeave && (
            <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 text-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Submit Student Leave Request</h3>
                <button
                  type="button"
                  onClick={() => setIsApplyingLeave(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">From Date</label>
                    <input
                      type="date"
                      required
                      value={leaveFromDate}
                      onChange={(e) => setLeaveFromDate(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">To Date</label>
                    <input
                      type="date"
                      required
                      value={leaveToDate}
                      onChange={(e) => setLeaveToDate(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reason for Absence</label>
                  <textarea
                    rows={2}
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="e.g. Sickness / Family emergency / Attending sports championship..."
                    className="w-full border border-slate-300 rounded p-2 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyingLeave(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLeave}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                  >
                    {isSubmittingLeave ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Leaves Submitted History */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Submitted Leave History</h3>
            {leaves.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No leave applications recorded.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {leaves.map((l) => (
                  <div key={l.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {l.fromDate} to {l.toDate}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{l.reason}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        l.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : l.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {l.status}
                      </span>
                      {l.reviewedBy && (
                        <div className="text-[10px] text-slate-400 mt-0.5">By {l.reviewedBy}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Attendance Log */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900">Roll Call Register Records</span>
              <span className="text-slate-500 font-mono">Present: {student.attendanceRate.toFixed(1)}%</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Marked By</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentAttendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{att.date}</td>
                    <td className="py-3 px-4">
                      {att.status === 'present' && <span className="text-emerald-700 font-bold">Present</span>}
                      {att.status === 'absent' && <span className="text-rose-600 font-bold">Absent</span>}
                      {att.status === 'late' && <span className="text-amber-600 font-bold">Late</span>}
                      {att.status === 'excused' && <span className="text-slate-600 font-bold">Excused</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{att.markedBy}</td>
                    <td className="py-3 px-4 text-slate-500">{att.remarks || 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Fees Portal & Online UPI Clearance */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                School Quarterly Fees & Online UPI Payment Gateway
              </h2>
              <p className="text-xs text-slate-500">
                Authorized digital payments with instant GST-compliant fee receipt generation
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {studentInvoices.map((inv) => {
              const remaining = inv.totalAmount - inv.paidAmount;
              return (
                <div key={inv.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                        <span>·</span>
                        <span>{inv.academicTerm}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Due Date: <strong className="text-slate-800 font-mono">{inv.dueDate}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {inv.status === 'paid' ? (
                        <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Cleared & Paid
                        </span>
                      ) : (
                        <span className="text-rose-600 text-xs font-bold flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          ₹{remaining.toLocaleString()} Balance Pending
                        </span>
                      )}

                      <button
                        onClick={() => onOpenReceipt(inv)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Official Receipt
                      </button>

                      {remaining > 0 && (
                        <button
                          onClick={() => setActivePaymentInvoice(inv)}
                          className="px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                        >
                          Pay via UPI / QR
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Itemized charges table in INR */}
                  <div className="text-xs">
                    <div className="font-semibold text-slate-800 mb-2">Itemized Fee Structure (INR ₹)</div>
                    <div className="divide-y divide-slate-100 font-mono tabular-nums">
                      {inv.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between text-slate-600">
                          <span className="font-sans text-slate-800">{item.name} ({item.category})</span>
                          <span>₹{item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-900 font-mono tabular-nums text-sm">
                      <span>Total Invoice Amount:</span>
                      <span>₹{inv.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive UPI Payment Modal */}
          {activePaymentInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
                <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Clear School Fees · UPI Gateway
                    </h3>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Invoice: {activePaymentInvoice.invoiceNumber}
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePaymentInvoice(null)}
                    className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="my-4 space-y-4">
                  {/* Amount Box */}
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono tabular-nums">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Amount Payable</span>
                      <span className="text-xl font-bold text-slate-900">
                        ₹{(activePaymentInvoice.totalAmount - activePaymentInvoice.paidAmount).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                      Zero Surcharge
                    </span>
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('upi_qr')}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-semibold ${
                        paymentMode === 'upi_qr'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <QrCode className="w-4 h-4 mx-auto mb-1" />
                      <span>Scan UPI QR Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('upi_vpa')}
                      className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-semibold ${
                        paymentMode === 'upi_vpa'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mx-auto mb-1" />
                      <span>Enter UPI VPA ID</span>
                    </button>
                  </div>

                  {/* QR Simulation */}
                  {paymentMode === 'upi_qr' ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                      <div className="w-36 h-36 bg-white border-2 border-slate-800 rounded-lg mx-auto p-2 flex flex-col items-center justify-center font-mono text-[10px] text-slate-400">
                        <QrCode className="w-24 h-24 text-slate-900" />
                        <span>upi://pay?pa=scholasync</span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        Scan using Google Pay, PhonePe, Paytm, or BHIM UPI
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block font-medium text-slate-700">UPI ID / Virtual Payment Address</label>
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="w-full border border-slate-300 rounded p-2 text-xs font-mono"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isPaying}
                    onClick={() => handleConfirmUpiPayment(activePaymentInvoice)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    {isPaying ? 'Confirming with NPCI UPI...' : 'Simulate Successful UPI Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Class Timetable */}
      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Weekly Class Routine & Subject Timetable
              </h2>
              <p className="text-xs text-slate-500">
                {student.gradeLevel} - Section {student.section} · Monday through Saturday schedule
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <th className="py-3 px-4 w-20 text-center">Period</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Assigned Teacher</th>
                  <th className="py-3 px-4">Classroom / Lab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((slot) => (
                  <tr key={slot.period} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                      #{slot.period}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {slot.time}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {slot.subject}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{slot.teacher}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{slot.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Homework & Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Class 10 Homework & Assignments</h2>
              <p className="text-xs text-slate-500">
                Submit assignments, track evaluation deadlines, and review teacher remarks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => {
              const mySub = asg.submissions?.find((s: AssignmentSubmission) => s.studentId === student.id);
              return (
                <div key={asg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                        {asg.subject}
                      </span>
                      <span className="text-[11px] text-slate-500">Due: {asg.dueDate}</span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mb-1">{asg.title}</h3>
                    <p className="text-xs text-slate-600 mb-4">{asg.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Max Marks: {asg.maxMarks}</div>
                      {mySub ? (
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {mySub.status === 'graded'
                            ? `Scored: ${mySub.marksObtained} / ${asg.maxMarks}`
                            : 'Submitted for Evaluation'}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-600 font-medium mt-0.5">Not Submitted Yet</div>
                      )}
                    </div>

                    {mySub ? (
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {mySub.status === 'graded' ? 'Graded' : 'Turned In'}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveSubmitAsg(asg);
                          setSubmitContent('');
                          setSubmitFileUrl('');
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Submit Work
                      </button>
                    )}
                  </div>

                  {mySub?.feedback && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg text-[11px] text-emerald-900 border border-emerald-200">
                      <strong>Teacher Feedback:</strong> "{mySub.feedback}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal to Submit Assignment */}
          {activeSubmitAsg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1">Submit Assignment Work</h3>
                <p className="text-slate-500 mb-4">
                  Submitting homework for <strong>{activeSubmitAsg.title}</strong> ({activeSubmitAsg.subject}).
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!submitContent.trim()) return;
                    setIsSubmittingWork(true);
                    try {
                      await api.submitAssignment(activeSubmitAsg.id, submitContent, submitFileUrl);
                      setActiveSubmitAsg(null);
                      loadStudentData();
                    } catch (err: any) {
                      alert(err.message || 'Submission failed');
                    } finally {
                      setIsSubmittingWork(false);
                    }
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Answer / Notes / Summary</label>
                    <textarea
                      rows={4}
                      required
                      value={submitContent}
                      onChange={(e) => setSubmitContent(e.target.value)}
                      placeholder="Write your homework answers or laboratory observations..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">File Attachment URL (Optional)</label>
                    <input
                      type="url"
                      value={submitFileUrl}
                      onChange={(e) => setSubmitFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/... or cloud document link"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveSubmitAsg(null)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingWork}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingWork ? 'Submitting...' : 'Turn In Assignment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
