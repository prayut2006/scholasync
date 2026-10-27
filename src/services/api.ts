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
  User,
  LeaveApplication,
  TimetableSlot,
  Assignment,
  AssignmentSubmission,
  ExamSchedule,
  AuditLog
} from '../types/index.ts';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const TOKEN_STORAGE_KEY = 'scholasync_token';

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}

export const api = {
  // Authentication
  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const res = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    return data.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await apiFetch(`${API_BASE}/auth/me`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch current user');
    return data.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const res = await apiFetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
  },

  // Staff Management (Principal & Staff Workspaces)
  async getStaffMembers(): Promise<Staff[]> {
    const res = await apiFetch(`${API_BASE}/staff`);
    const data = await res.json();
    return data.data || [];
  },

  async getStaffById(id: string): Promise<Staff> {
    const res = await apiFetch(`${API_BASE}/staff/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Staff not found');
    return data.data;
  },

  async createStaffMember(payload: Partial<Staff>): Promise<Staff> {
    const res = await apiFetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create staff member');
    return data.data;
  },

  async updateStaffMember(id: string, updates: Partial<Staff>): Promise<Staff> {
    const res = await apiFetch(`${API_BASE}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update staff member');
    return data.data;
  },

  // Staff Tasks
  async getStaffTasks(params?: { assignedToStaffId?: string; status?: string; myTasks?: boolean }): Promise<StaffTask[]> {
    const searchParams = new URLSearchParams();
    if (params?.assignedToStaffId) searchParams.set('assignedToStaffId', params.assignedToStaffId);
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.myTasks) searchParams.set('myTasks', 'true');

    const res = await apiFetch(`${API_BASE}/staff-tasks?${searchParams.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  async createStaffTask(payload: Partial<StaffTask>): Promise<StaffTask> {
    const res = await apiFetch(`${API_BASE}/staff-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to assign task');
    return data.data;
  },

  async updateStaffTask(id: string, updates: Partial<StaffTask>): Promise<StaffTask> {
    const res = await apiFetch(`${API_BASE}/staff-tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update task');
    return data.data;
  },

  // Faculty & Teachers
  async getTeachers(): Promise<Teacher[]> {
    const res = await apiFetch(`${API_BASE}/teachers`);
    const data = await res.json();
    return data.data || [];
  },

  async createTeacher(payload: Partial<Teacher>): Promise<Teacher> {
    const res = await apiFetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add teacher');
    return data.data;
  },

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    const res = await apiFetch(`${API_BASE}/teachers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update teacher');
    return data.data;
  },

  // Students & Admissions
  async getStudents(params?: { gradeLevel?: string; section?: string; query?: string }): Promise<Student[]> {
    const searchParams = new URLSearchParams();
    if (params?.gradeLevel && params.gradeLevel !== 'all') searchParams.set('gradeLevel', params.gradeLevel);
    if (params?.section && params.section !== 'all') searchParams.set('section', params.section);
    if (params?.query) searchParams.set('query', params.query);

    const res = await apiFetch(`${API_BASE}/students?${searchParams.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  async getStudentById(id: string): Promise<{
    student: Student;
    grades: GradeRecord | null;
    allGrades: GradeRecord[];
    attendance: AttendanceEntry[];
    invoices: Invoice[];
  }> {
    const res = await apiFetch(`${API_BASE}/students/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch student record');
    return data.data;
  },

  async createStudent(payload: Partial<Student>): Promise<Student> {
    const res = await apiFetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register student');
    return data.data;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const res = await apiFetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update student profile');
    return data.data;
  },

  async deleteStudent(id: string): Promise<boolean> {
    const res = await apiFetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Grades & CBSE Marks
  async getGrades(params?: { studentId?: string; gradeLevel?: string; section?: string; term?: string }): Promise<GradeRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.studentId) searchParams.set('studentId', params.studentId);
    if (params?.gradeLevel && params.gradeLevel !== 'all') searchParams.set('gradeLevel', params.gradeLevel);
    if (params?.section && params.section !== 'all') searchParams.set('section', params.section);
    if (params?.term) searchParams.set('term', params.term);

    const res = await apiFetch(`${API_BASE}/grades?${searchParams.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  async saveGradeRecord(record: Partial<GradeRecord>): Promise<GradeRecord> {
    const res = await apiFetch(`${API_BASE}/grades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save examination marks');
    return data.data;
  },

  // Attendance
  async getAttendance(params?: { date?: string; gradeLevel?: string; section?: string; studentId?: string }): Promise<AttendanceEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.set('date', params.date);
    if (params?.gradeLevel && params.gradeLevel !== 'all') searchParams.set('gradeLevel', params.gradeLevel);
    if (params?.section && params.section !== 'all') searchParams.set('section', params.section);
    if (params?.studentId) searchParams.set('studentId', params.studentId);

    const res = await apiFetch(`${API_BASE}/attendance?${searchParams.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  async markAttendance(entries: AttendanceEntry[]): Promise<AttendanceEntry[]> {
    const res = await apiFetch(`${API_BASE}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit attendance register');
    return data.data;
  },

  // Fees, Invoices & Payments
  async getInvoices(params?: { studentId?: string; status?: string }): Promise<Invoice[]> {
    const searchParams = new URLSearchParams();
    if (params?.studentId) searchParams.set('studentId', params.studentId);
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);

    const res = await apiFetch(`${API_BASE}/fees?${searchParams.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  async createInvoice(payload: {
    studentId: string;
    academicTerm: string;
    dueDate: string;
    items: { name: string; category: string; amount: number }[];
  }): Promise<Invoice> {
    const res = await apiFetch(`${API_BASE}/fees/invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate fee invoice');
    return data.data;
  },

  async payInvoice(invoiceId: string, paymentMethod: string, amount?: number, upiVpa?: string, notes?: string): Promise<Invoice> {
    const res = await apiFetch(`${API_BASE}/fees/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, paymentMethod, amount, upiVpa, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment recording failed');
    return data.data;
  },

  // Assignments
  async getAssignments(params?: { gradeLevel?: string; section?: string; teacherId?: string }): Promise<Assignment[]> {
    const searchParams = new URLSearchParams();
    if (params?.gradeLevel && params.gradeLevel !== 'all') searchParams.set('gradeLevel', params.gradeLevel);
    if (params?.section && params.section !== 'all') searchParams.set('section', params.section);
    if (params?.teacherId) searchParams.set('teacherId', params.teacherId);

    const res = await apiFetch(`${API_BASE}/assignments?${searchParams.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  async createAssignment(payload: Partial<Assignment>): Promise<Assignment> {
    const res = await apiFetch(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish assignment');
    return data.data;
  },

  async submitAssignment(assignmentId: string, content: string, fileUrl?: string): Promise<AssignmentSubmission> {
    const res = await apiFetch(`${API_BASE}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, fileUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit assignment');
    return data.data;
  },

  async gradeSubmission(submissionId: string, marksObtained: number, feedback: string): Promise<AssignmentSubmission> {
    const res = await apiFetch(`${API_BASE}/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marksObtained, feedback }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to grade submission');
    return data.data;
  },

  // Exams
  async getExams(params?: { gradeLevel?: string; term?: string }): Promise<ExamSchedule[]> {
    const searchParams = new URLSearchParams();
    if (params?.gradeLevel && params.gradeLevel !== 'all') searchParams.set('gradeLevel', params.gradeLevel);
    if (params?.term) searchParams.set('term', params.term);

    const res = await apiFetch(`${API_BASE}/exams?${searchParams.toString()}`);
    const data = await res.json();
    return data.data || [];
  },

  async createExam(payload: Partial<ExamSchedule>): Promise<ExamSchedule> {
    const res = await apiFetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to schedule exam');
    return data.data;
  },

  // Leaves
  async getLeaves(studentId?: string): Promise<LeaveApplication[]> {
    const query = studentId ? `?studentId=${studentId}` : '';
    const res = await apiFetch(`${API_BASE}/leaves${query}`);
    const data = await res.json();
    return data.data || [];
  },

  async createLeave(payload: Partial<LeaveApplication>): Promise<LeaveApplication> {
    const res = await apiFetch(`${API_BASE}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit leave application');
    return data.data;
  },

  async updateLeaveStatus(leaveId: string, status: 'approved' | 'rejected', reviewer: string): Promise<LeaveApplication> {
    const res = await apiFetch(`${API_BASE}/leaves/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaveId, status, reviewer }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update leave status');
    return data.data;
  },

  // Timetable
  async getTimetable(className?: string): Promise<TimetableSlot[]> {
    const res = await apiFetch(`${API_BASE}/timetable?className=${encodeURIComponent(className || 'Class 10-A')}`);
    const data = await res.json();
    return data.data || [];
  },

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    const res = await apiFetch(`${API_BASE}/announcements`);
    const data = await res.json();
    return data.data || [];
  },

  async createAnnouncement(announcement: Partial<Announcement>): Promise<Announcement> {
    const res = await apiFetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post announcement');
    return data.data;
  },

  // Audit Logs
  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    const query = limit ? `?limit=${limit}` : '';
    const res = await apiFetch(`${API_BASE}/audit-logs${query}`);
    const data = await res.json();
    return data.data || [];
  },

  // Analytics
  async getAnalytics(): Promise<SchoolAnalytics> {
    const res = await apiFetch(`${API_BASE}/analytics`);
    const data = await res.json();
    return data.data;
  },

  // Reset Data
  async resetData(): Promise<void> {
    await apiFetch(`${API_BASE}/reset`, { method: 'POST' });
  },
};
