import React, { useState, useEffect } from 'react';
import {
  SchoolAnalytics,
  Student,
  Teacher,
  Staff,
  StaffTask,
  Announcement,
  AuditLog
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Briefcase,
  UserCheck,
  FileText,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Lock,
  Eye,
  CheckSquare,
  AlertTriangle,
  Activity,
  Calendar,
  Building,
  RefreshCw
} from 'lucide-react';

interface PrincipalWorkspaceProps {
  analytics: SchoolAnalytics | null;
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  tasks: StaffTask[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  onRefreshData: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
  onPostAnnouncement: (ann: Partial<Announcement>) => Promise<void>;
}

export const PrincipalWorkspace: React.FC<PrincipalWorkspaceProps> = ({
  analytics,
  students,
  teachers,
  staff,
  tasks,
  announcements,
  auditLogs,
  onRefreshData,
  onNavigateTab,
  onPostAnnouncement,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'staff' | 'tasks' | 'teachers' | 'audit' | 'reports'>('overview');

  // New Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffDept, setStaffDept] = useState('Finance & Accounts');
  const [staffDesignation, setStaffDesignation] = useState('Accounts Officer');
  const [staffPhone, setStaffPhone] = useState('+91 98111 00000');
  const [permFinance, setPermFinance] = useState(true);
  const [permAdmissions, setPermAdmissions] = useState(false);
  const [permRecords, setPermRecords] = useState(true);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // New Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(staff[0]?.id || '');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [taskDueDate, setTaskDueDate] = useState('2026-11-05');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // New Teacher Modal
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherDept, setTeacherDept] = useState('Sciences');
  const [teacherDesignation, setTeacherDesignation] = useState('PGT Chemistry');
  const [teacherSubjects, setTeacherSubjects] = useState('Chemistry, Environmental Science');
  const [teacherClasses, setTeacherClasses] = useState('Class 10-A, Class 11-Science');
  const [teacherPhone, setTeacherPhone] = useState('+91 98765 00000');
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);

  // Announcement Modal
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [annTarget, setAnnTarget] = useState<'all' | 'teacher' | 'staff' | 'student'>('all');
  const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail) return;
    setIsSubmittingStaff(true);
    try {
      await api.createStaffMember({
        name: staffName,
        email: staffEmail,
        department: staffDept,
        designation: staffDesignation,
        phone: staffPhone,
        permissions: [
          { module: 'finance', canRead: permFinance, canWrite: permFinance },
          { module: 'admissions', canRead: permAdmissions, canWrite: permAdmissions },
          { module: 'records', canRead: permRecords, canWrite: permRecords },
          { module: 'general', canRead: true, canWrite: true },
        ],
      });
      setIsStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to create staff member');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskAssignee) return;
    setIsSubmittingTask(true);
    try {
      await api.createStaffTask({
        title: taskTitle,
        description: taskDesc,
        assignedToStaffId: taskAssignee,
        priority: taskPriority,
        dueDate: taskDueDate,
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign task');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherEmail) return;
    setIsSubmittingTeacher(true);
    try {
      await api.createTeacher({
        name: teacherName,
        email: teacherEmail,
        department: teacherDept,
        designation: teacherDesignation,
        subjects: teacherSubjects.split(',').map((s) => s.trim()),
        assignedClasses: teacherClasses.split(',').map((c) => c.trim()),
        phone: teacherPhone,
      });
      setIsTeacherModalOpen(false);
      setTeacherName('');
      setTeacherEmail('');
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to add faculty member');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setIsSubmittingAnn(true);
    try {
      await onPostAnnouncement({
        title: annTitle,
        content: annContent,
        priority: annPriority,
        targetRole: annTarget,
        category: 'Administrative',
        author: 'Office of the Principal',
      });
      setIsAnnounceModalOpen(false);
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to post notice');
    } finally {
      setIsSubmittingAnn(false);
    }
  };

  const handleToggleStaffStatus = async (staffMember: Staff) => {
    const nextStatus = !staffMember.isActive;
    if (!confirm(`Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} staff account for ${staffMember.name}?`)) return;
    try {
      await api.updateStaffMember(staffMember.id, { isActive: nextStatus });
      await onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await api.updateStaffTask(taskId, { status });
      await onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Principal Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold text-2xl shrink-0">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                <span>Principal & Super Administrator Console</span>
                <span>·</span>
                <span className="font-mono text-slate-400">Institutional Master Oversight</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Dr. Rajeshwar Sharma
              </h1>
              <p className="mt-1 text-xs text-slate-300">
                Principal & Academic Director · ScholaSync Academy (CBSE Affiliation #2130894)
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Briefcase className="w-4 h-4" />
              <span>Assign Staff Task</span>
            </button>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Add Staff</span>
            </button>

            <button
              onClick={() => setIsTeacherModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Add Faculty</span>
            </button>

            <button
              onClick={() => setIsAnnounceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Post Notice</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Subtabs */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap gap-2 text-xs font-medium">
          {[
            { id: 'overview', label: 'Command Overview' },
            { id: 'staff', label: `Staff Directory (${staff.length})` },
            { id: 'tasks', label: `Operational Tasks (${tasks.length})` },
            { id: 'teachers', label: `Faculty Roster (${teachers.length})` },
            { id: 'audit', label: `Security & Audit Logs (${auditLogs.length})` },
            { id: 'reports', label: 'Institutional Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: COMMAND OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards (derived from real MySQL queries) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Enrollment</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {analytics?.totalStudents ?? students.length} Scholars
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">Active CBSE roster</span>
                <span>· 6 Sections</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Faculty & Staff</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {(analytics?.totalFaculty ?? teachers.length) + (analytics?.totalStaff ?? staff.length)} Staff
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {teachers.length} Teachers · {staff.length} Administrative Staff
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {analytics?.averageAttendance ?? 94.2}%
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                Above 75% CBSE Board minimum
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Fees Collected</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{((analytics?.totalFeesCollected ?? 0) / 1000).toFixed(0)}k
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Rate: {analytics?.collectionRate ?? 0}%</span>
                <span className="text-amber-600 font-semibold">
                  Due: ₹{((analytics?.pendingFees ?? 0) / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts to core school modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => onNavigateTab('students')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Student Directory & Dossiers</h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage all admission records, academic years, sections, and guardian contact dossiers.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('fees')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Institutional Fee Oversight</h3>
              <p className="text-xs text-slate-500 mt-1">
                Audit quarterly fee reconciliations, payment receipts, bank transfers, and defaulters.
              </p>
            </div>

            <div
              onClick={() => onNavigateTab('grades')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">CBSE Examinations & Gradebook</h3>
              <p className="text-xs text-slate-500 mt-1">
                Review class performance, Periodic Tests, Half-Yearly results, and official CBSE report cards.
              </p>
            </div>
          </div>

          {/* Pending Tasks & Recent Announcements Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operational Tasks Quick View */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Delegated Staff Tasks</h3>
                  <p className="text-xs text-slate-500">Live operational assignments given to administrative staff</p>
                </div>
                <button
                  onClick={() => setActiveSubTab('tasks')}
                  className="text-xs font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  View All ({tasks.length})
                </button>
              </div>

              <div className="space-y-3">
                {tasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-[10px] font-medium capitalize ${
                            task.status === 'completed'
                              ? 'text-emerald-600'
                              : task.status === 'in_progress'
                              ? 'text-blue-600'
                              : 'text-slate-500'
                          }`}
                        >
                          ● {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">{task.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Assigned: <strong>{task.assignedStaffName || 'Staff'}</strong> · Due: {task.dueDate}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {task.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-medium cursor-pointer"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* School Announcements */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Official Notices & Circulars</h3>
                  <p className="text-xs text-slate-500">Institutional communications issued by the Principal</p>
                </div>
                <button
                  onClick={() => setIsAnnounceModalOpen(true)}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Post Notice
                </button>
              </div>

              <div className="space-y-3">
                {announcements.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-700">{ann.category}</span>
                      <span>{ann.date}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mb-1">{ann.title}</div>
                    <p className="text-xs text-slate-600 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: STAFF DIRECTORY & MODULE PERMISSIONS */}
      {activeSubTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Administrative Staff Management</h2>
              <p className="text-xs text-slate-500">
                Create staff accounts, configure role designations, assign department scopes, and grant module-specific permissions.
              </p>
            </div>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Staff Member</th>
                  <th className="py-3 px-6">Employee ID</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Designation</th>
                  <th className="py-3 px-6">Authorized Modules</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-700">{s.employeeId}</td>
                    <td className="py-4 px-6 text-slate-800">{s.department}</td>
                    <td className="py-4 px-6 text-slate-600">{s.designation}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {s.permissions && s.permissions.length > 0 ? (
                          s.permissions.map((p) => (
                            <span
                              key={p.module}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                p.canWrite
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {p.module} {p.canWrite ? '(W)' : '(R)'}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">General Access</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleStaffStatus(s)}
                        className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer border ${
                          s.isActive !== false
                            ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {s.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: OPERATIONAL STAFF TASKS */}
      {activeSubTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Principal Staff Task Delegation</h2>
              <p className="text-xs text-slate-500">
                Assign administrative operations, set deadlines, track live status (Pending, In Progress, Completed, Cancelled).
              </p>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                    <span
                      className={`text-[11px] font-bold capitalize ${
                        task.status === 'completed'
                          ? 'text-emerald-600'
                          : task.status === 'in_progress'
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      ● {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1">{task.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{task.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                  <div>
                    <div>Assigned: <strong className="text-slate-800">{task.assignedStaffName || 'Staff'}</strong></div>
                    <div>Due Date: <strong className="text-slate-800">{task.dueDate}</strong></div>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as any)}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: FACULTY & TEACHER ROSTER */}
      {activeSubTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Faculty Roster & Workload Administration</h2>
              <p className="text-xs text-slate-500">
                View teacher workload, assigned CBSE subjects, class teacher responsibilities, and contact info.
              </p>
            </div>
            <button
              onClick={() => setIsTeacherModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Hire / Add Faculty</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((t) => (
              <div key={t.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                    <span className="font-mono text-[10px] text-slate-400">{t.employeeId}</span>
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">{t.designation}</div>
                  <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                    <div>Department: <span className="font-medium text-slate-800">{t.department}</span></div>
                    <div>Subjects: <span className="font-medium text-slate-800">{t.subjects.join(', ')}</span></div>
                    <div>Assigned Classes: <span className="font-medium text-slate-800">{t.assignedClasses.join(', ')}</span></div>
                    <div>Phone: <span className="font-mono text-slate-700">{t.phone}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Immutable Audit Trail & Security Logs</h2>
              <p className="text-xs text-slate-500">
                Server-recorded security history of all logins, student admissions, fee collections, marks entries, and permissions.
              </p>
            </div>
            <button
              onClick={onRefreshData}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Performed By</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">{log.createdAt.replace('T', ' ').slice(0, 19)}</td>
                    <td className="py-3 px-6 font-bold text-slate-900 whitespace-nowrap">{log.action}</td>
                    <td className="py-3 px-6 text-slate-600">{log.entity}</td>
                    <td className="py-3 px-6 font-sans text-slate-800">{log.performedBy}</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-sans text-slate-600 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 6: REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Institutional Performance & Board Exam Analytics</h2>
            <p className="text-xs text-slate-500">
              Aggregated reports derived from MySQL student rosters, attendance logs, and fee ledger transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900 mb-3">CBSE Grade Distribution (Class 10)</h3>
              <div className="space-y-2">
                {analytics?.gradeDistribution.map((gd) => (
                  <div key={gd.grade} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{gd.grade}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${gd.percentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-12 text-right">{gd.count} ({gd.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900 mb-3">5-Month Attendance Trend</h3>
              <div className="space-y-2">
                {analytics?.attendanceTrends.map((at) => (
                  <div key={at.month} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{at.month} 2026</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${at.attendanceRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-12 text-right">{at.attendanceRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STAFF */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Register Administrative Staff</h3>
            <p className="text-slate-500 mb-4">Grant access to specific operational modules.</p>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Staff Email (Login ID)</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. ramesh.chandra@scholasync.in"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <select
                    value={staffDept}
                    onChange={(e) => setStaffDept(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Admissions & Student Affairs">Admissions & Student Affairs</option>
                    <option value="General Administration">General Administration</option>
                    <option value="Examination Cell">Examination Cell</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Authorized Modules</label>
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permFinance}
                      onChange={(e) => setPermFinance(e.target.checked)}
                      className="rounded"
                    />
                    <span>Finance & Fee Collection (Invoicing, Payments, Vouchers)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permAdmissions}
                      onChange={(e) => setPermAdmissions(e.target.checked)}
                      className="rounded"
                    />
                    <span>Student Admissions (Register scholars, update guardian details)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permRecords}
                      onChange={(e) => setPermRecords(e.target.checked)}
                      className="rounded"
                    />
                    <span>Student Records & Attendance (Class roster overview)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingStaff ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assign Operational Task to Staff</h3>
            <p className="text-slate-500 mb-4">Set operational deliverables with deadlines and track execution.</p>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit Term 2 Transport Fee Waivers"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Instructions</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Detailed guidelines for the assigned staff member..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assignee (Staff Member)</label>
                <select
                  required
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department} · {s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTask ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD TEACHER */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Faculty Member</h3>
            <p className="text-slate-500 mb-4">Create teacher credentials and assign teaching classes.</p>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Dr. Kavita Sharma"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email (Institutional Login)</label>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="e.g. kavita.sharma@scholasync.in"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={teacherDept}
                    onChange={(e) => setTeacherDept(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={teacherDesignation}
                    onChange={(e) => setTeacherDesignation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subjects (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={teacherSubjects}
                  onChange={(e) => setTeacherSubjects(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned Classes</label>
                <input
                  type="text"
                  required
                  value={teacherClasses}
                  onChange={(e) => setTeacherClasses(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeacher}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTeacher ? 'Adding...' : 'Add Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ANNOUNCEMENT */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Post Official School Notice</h3>
            <p className="text-slate-500 mb-4">Issue circulars targeted to specific school roles.</p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. CBSE Half-Yearly Result Publication"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Circular Content</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Full text of the institutional directive..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Audience</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="all">All School (Scholars, Parents & Staff)</option>
                    <option value="teacher">Faculty & Educators Only</option>
                    <option value="staff">Administrative Staff Only</option>
                    <option value="student">Students & Guardians Only</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAnn}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAnn ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
