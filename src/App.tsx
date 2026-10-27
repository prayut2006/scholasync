/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Student,
  Teacher,
  Staff,
  StaffTask,
  GradeRecord,
  AttendanceEntry,
  Invoice,
  Announcement,
  SchoolAnalytics,
  AuditLog
} from './types/index.ts';
import { api } from './services/api.ts';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { Header } from './components/Header.tsx';
import { PrincipalWorkspace } from './components/principal/PrincipalWorkspace.tsx';
import { StaffPortal } from './components/staff-portal/StaffPortal.tsx';
import { TeacherPortal } from './components/teacher-portal/TeacherPortal.tsx';
import { MyStudentPortal } from './components/student-portal/MyStudentPortal.tsx';
import { StudentRoster } from './components/students/StudentRoster.tsx';
import { GradeTracker } from './components/grades/GradeTracker.tsx';
import { AttendanceRegister } from './components/attendance/AttendanceRegister.tsx';
import { FeesPortal } from './components/fees/FeesPortal.tsx';
import { PerformanceMetrics } from './components/performance/PerformanceMetrics.tsx';
import { ReceiptModal } from './components/common/ReceiptModal.tsx';
import { ReportCardModal } from './components/common/ReportCardModal.tsx';
import { AdmitCardModal } from './components/common/AdmitCardModal.tsx';
import { AlertCircle, RefreshCw } from 'lucide-react';

function MainApp() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('stu-101');

  // Core Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<SchoolAnalytics | null>(null);

  // Loading & Action states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [reportCardModalData, setReportCardModalData] = useState<{
    student: Student | null;
    gradeRecord: GradeRecord | null;
  }>({ student: null, gradeRecord: null });
  const [admitCardStudent, setAdmitCardStudent] = useState<Student | null>(null);

  // Load all data from MySQL via Prisma
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [stuRes, tchRes, stfRes, tskRes, grdRes, attRes, invRes, ancRes, anlRes, audRes] =
        await Promise.all([
          api.getStudents(),
          api.getTeachers().catch(() => []),
          api.getStaffMembers().catch(() => []),
          api.getStaffTasks().catch(() => []),
          api.getGrades(),
          api.getAttendance(),
          api.getInvoices(),
          api.getAnnouncements(),
          api.getAnalytics(),
          api.getAuditLogs(50).catch(() => []),
        ]);

      setStudents(stuRes);
      setTeachers(tchRes);
      setStaff(stfRes);
      setTasks(tskRes);
      setGrades(grdRes);
      setAttendance(attRes);
      setInvoices(invRes);
      setAnnouncements(ancRes);
      setAnalytics(anlRes);
      setAuditLogs(audRes);
    } catch (err: any) {
      console.error('Error loading school database:', err);
      setError(err.message || 'Failed to connect to MySQL school database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Update selected student when authenticated user is a student
  useEffect(() => {
    if (currentUser?.role === 'student' && currentUser.studentId) {
      setSelectedStudentId(currentUser.studentId);
    }
  }, [currentUser]);

  // Handlers
  const handleAddStudent = async (payload: Partial<Student>) => {
    await api.createStudent(payload);
    await loadData();
  };

  const handleDeleteStudent = async (id: string) => {
    await api.deleteStudent(id);
    await loadData();
  };

  const handleSaveGradeRecord = async (record: GradeRecord) => {
    await api.saveGradeRecord(record);
    await loadData();
  };

  const handleSaveAttendance = async (entries: AttendanceEntry[]) => {
    await api.markAttendance(entries);
    await loadData();
  };

  const handlePayInvoice = async (
    invoiceId: string,
    paymentMethod: string,
    amount?: number,
    upiVpa?: string,
    notes?: string
  ) => {
    const updated = await api.payInvoice(invoiceId, paymentMethod, amount, upiVpa, notes);
    await loadData();
    return updated;
  };

  const handlePostAnnouncement = async (ann: Partial<Announcement>) => {
    await api.createAnnouncement(ann);
    await loadData();
  };

  const handleResetData = async () => {
    if (!confirm('Reset school MySQL database to clean CBSE baseline seed data?')) return;
    setIsResetting(true);
    try {
      await api.resetData();
      await new Promise((r) => setTimeout(r, 2000));
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Active student for student portal
  const activeStudent =
    (currentUser?.role === 'student'
      ? students.find((s) => s.id === currentUser.studentId)
      : students.find((s) => s.id === selectedStudentId)) || students[0];

  const activeStudentGrade =
    grades.find((g) => g.studentId === activeStudent?.id) || null;

  // Active teacher for teacher portal
  const activeTeacher =
    teachers.find((t) => t.id === currentUser?.teacherId || t.email === currentUser?.email) ||
    teachers[0] || {
      id: 'tch-01',
      employeeId: 'EMP-FAC-014',
      name: currentUser?.name || 'Prof. Marcus Verma',
      email: currentUser?.email || 'marcus.verma@scholasync.in',
      department: 'Sciences & Physics',
      designation: 'PGT Physics & Class Teacher (Class 10-A)',
      subjects: ['Physics', 'Advanced STEM Practical'],
      assignedClasses: ['Class 10-A', 'Class 10-B', 'Class 11-Science'],
      phone: '+91 98765 43210',
    };

  // Active staff for staff portal
  const currentStaffMember =
    staff.find((s) => s.id === currentUser?.staffId || s.email === currentUser?.email) || staff[0] || null;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Header with Role-Aware Navigation */}
      <Header
        currentUser={currentUser}
        onLogout={logout}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
            <div className="text-xs font-semibold text-slate-500">
              Querying ScholaSync MySQL ERP Database via Prisma...
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-rose-600 text-white rounded font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : currentUser?.role === 'student' ? (
          /* ========================================================
           * WORKSPACE 1: STUDENT & GUARDIAN PORTAL
           * ======================================================== */
          <MyStudentPortal
            student={activeStudent}
            gradeRecord={activeStudentGrade}
            attendanceRecords={attendance}
            invoices={invoices}
            announcements={announcements}
            onOpenReportCard={(stu, grd) => setReportCardModalData({ student: stu, gradeRecord: grd })}
            onOpenReceipt={(inv) => setReceiptInvoice(inv)}
            onOpenAdmitCard={(stu) => setAdmitCardStudent(stu)}
            onPayInvoice={handlePayInvoice}
          />
        ) : currentUser?.role === 'teacher' ? (
          /* ========================================================
           * WORKSPACE 2: FACULTY & TEACHER WORKSPACE
           * ======================================================== */
          <TeacherPortal
            teacher={activeTeacher}
            students={students}
            grades={grades}
            attendanceRecords={attendance}
            onSaveGradeRecord={handleSaveGradeRecord}
            onSaveAttendance={handleSaveAttendance}
            onOpenReportCard={(stu, grd) => setReportCardModalData({ student: stu, gradeRecord: grd })}
          />
        ) : currentUser?.role === 'staff' ? (
          /* ========================================================
           * WORKSPACE 3: ADMINISTRATIVE STAFF WORKSPACE
           * ======================================================== */
          <StaffPortal
            currentStaff={currentStaffMember}
            students={students}
            invoices={invoices}
            tasks={tasks}
            announcements={announcements}
            onRefreshData={loadData}
            onOpenReceipt={(inv) => setReceiptInvoice(inv)}
            onPayInvoice={handlePayInvoice}
          />
        ) : (
          /* ========================================================
           * WORKSPACE 4: PRINCIPAL & SUPER ADMINISTRATOR WORKSPACE
           * ======================================================== */
          <>
            {activeTab === 'overview' && (
              <PrincipalWorkspace
                analytics={analytics}
                students={students}
                teachers={teachers}
                staff={staff}
                tasks={tasks}
                announcements={announcements}
                auditLogs={auditLogs}
                onRefreshData={loadData}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onPostAnnouncement={handlePostAnnouncement}
              />
            )}

            {activeTab === 'students' && (
              <StudentRoster
                students={students}
                currentRole="admin"
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onSelectStudentToInspect={(student) => {
                  setSelectedStudentId(student.id);
                }}
              />
            )}

            {activeTab === 'grades' && (
              <GradeTracker
                grades={grades}
                students={students}
                currentRole="admin"
                onSaveGradeRecord={handleSaveGradeRecord}
                onOpenReportCard={(stu, grd) => setReportCardModalData({ student: stu, gradeRecord: grd })}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceRegister
                students={students}
                attendanceRecords={attendance}
                currentRole="admin"
                onSaveAttendance={handleSaveAttendance}
              />
            )}

            {activeTab === 'fees' && (
              <FeesPortal
                invoices={invoices}
                students={students}
                currentRole="admin"
                onPayInvoice={handlePayInvoice}
                onOpenReceipt={(inv) => setReceiptInvoice(inv)}
              />
            )}

            {activeTab === 'performance' && (
              <PerformanceMetrics
                students={students}
                grades={grades}
                selectedStudentId={selectedStudentId}
                onSelectStudentId={(id) => setSelectedStudentId(id)}
                onOpenReportCard={(stu, grd) => setReportCardModalData({ student: stu, gradeRecord: grd })}
                currentRole="admin"
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <ReceiptModal
        invoice={receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
      />

      <ReportCardModal
        student={reportCardModalData.student}
        gradeRecord={reportCardModalData.gradeRecord}
        onClose={() => setReportCardModalData({ student: null, gradeRecord: null })}
      />

      <AdmitCardModal
        student={admitCardStudent}
        onClose={() => setAdmitCardStudent(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ScholaSync Academy · CBSE Affiliation No. 2130894
          </div>
          <div className="text-slate-400 font-mono">
            Prisma ORM & MySQL Persistence · National Education Policy (NEP 2020) Compliant
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
