export type Role = 'admin' | 'teacher' | 'student' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  teacherId?: string;
  staffId?: string;
  scholarNo?: string;
  designation?: string;
  phone?: string;
  isActive?: boolean;
}

export interface Student {
  id: string;
  userId?: string | null;
  admissionNo: string; // Scholar / Admission No e.g. "SCH-2024-0101"
  name: string;
  email: string;
  gradeLevel: string; // e.g. "Class 10", "Class 11", "Class 12"
  section: string;    // e.g. "A", "B"
  rollNo: number;
  gender: 'Female' | 'Male' | 'Other' | string;
  dob: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  bloodGroup: string;
  avatarUrl?: string;
  gpa: number;            // Cumulative CGPA out of 10.0 or 4.0
  percentage: number;     // CBSE Board marks aggregate percentage
  attendanceRate: number; // percentage e.g. 91.5
  feeStatus: 'paid' | 'pending' | 'overdue' | 'partial' | string;
  outstandingFee: number; // in INR ₹
  enrolledDate: string;
  aadhaarNumber?: string | null;
  isActive?: boolean;
}

export interface Teacher {
  id: string;
  userId?: string | null;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string; // e.g. PGT Physics, TGT Mathematics
  subjects: string[];
  assignedClasses: string[];
  phone: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface StaffPermission {
  id?: string;
  staffId?: string;
  module: 'finance' | 'admissions' | 'records' | 'attendance' | 'general' | string;
  canRead: boolean;
  canWrite: boolean;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  assignedToStaffId: string;
  assignedStaffName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  completedAt?: string | null;
  createdBy: string;
  createdAt?: string;
}

export interface Staff {
  id: string;
  userId?: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  isActive?: boolean;
  permissions?: StaffPermission[];
  tasks?: StaffTask[];
}

export interface SubjectGrade {
  subject: string;
  teacherName: string;
  credits: number;
  quizScore: number;       // Periodic Test 1 (out of 100)
  assignmentScore: number; // Notebook / Portfolio (out of 100)
  midtermScore: number;    // Half-Yearly Exam (out of 100)
  finalExamScore: number;  // Annual / Board Examination (out of 100)
  totalScore: number;      // composite marks out of 100
  letterGrade: string;     // A1, A2, B1, B2, C1, C2, D, E (CBSE style)
  gradePoint: number;      // 0 - 10
  remarks: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  academicYear: string;
  term: 'Half-Yearly (Term 1)' | 'Pre-Board / Term 2' | 'Annual Board Exam' | string;
  gradeLevel: string;
  section: string;
  subjects: SubjectGrade[];
  overallGpa: number;
  overallPercentage: number;
  classRank: number;
  totalStudentsInClass: number;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceEntry {
  id: string;
  studentId: string;
  studentName?: string;
  rollNo?: number;
  gradeLevel?: string;
  section?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string | null;
  markedBy: string;
}

export interface FeeItem {
  id?: string;
  name: string;
  category: 'Tuition' | 'Laboratory' | 'Library' | 'Extracurricular' | 'Examination' | 'Transport' | string;
  amount: number; // in INR ₹
}

export interface FeePayment {
  id: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string | null;
  receiptNumber: string;
  paymentDate: string;
  recordedBy: string;
  notes?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  gradeLevel: string;
  section: string;
  academicTerm: string;
  issueDate: string;
  dueDate: string;
  items: FeeItem[];
  payments?: FeePayment[];
  totalAmount: number; // in INR ₹
  paidAmount: number;  // in INR ₹
  balance?: number;    // in INR ₹ (totalAmount - paidAmount)
  status: 'paid' | 'pending' | 'overdue' | 'partial' | string;
  paymentDate?: string | null;
  transactionId?: string | null;
  paymentMethod?: string | null;
  upiVpa?: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Academic' | 'Administrative' | 'Examination' | 'Event' | 'Holiday' | string;
  content: string;
  author: string;
  date: string;
  priority: 'normal' | 'high' | 'urgent';
  targetRole?: 'all' | 'student' | 'teacher' | 'staff' | 'admin' | string;
}

export interface SchoolAnalytics {
  totalStudents: number;
  totalFaculty: number;
  totalStaff: number;
  activeClasses: number;
  averageAttendance: number;
  totalFeesBilled: number;   // in ₹
  totalFeesCollected: number;// in ₹
  collectionRate: number;
  pendingFees: number;       // in ₹
  overdueInvoicesCount: number;
  averageSchoolPercentage: number;
  averageSchoolGpa?: number;
  pendingTasksCount?: number;
  gradeDistribution: {
    grade: string;
    count: number;
    percentage: number;
  }[];
  attendanceTrends: {
    month: string;
    attendanceRate: number;
  }[];
}

export interface TimetableSlot {
  id?: string;
  className: string;
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface LeaveApplication {
  id: string;
  studentId: string;
  studentName?: string;
  gradeLevel?: string;
  section?: string;
  rollNo?: number;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  appliedAt: string;
  reviewedBy?: string | null;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  teacherId?: string | null;
  teacherName?: string;
  gradeLevel: string;
  section: string;
  dueDate: string;
  maxMarks: number;
  submissionsCount?: number;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string;
  content?: string | null;
  fileUrl?: string | null;
  marksObtained?: number | null;
  feedback?: string | null;
  status: 'submitted' | 'graded';
}

export interface ExamSchedule {
  id: string;
  title: string;
  term: string;
  academicYear: string;
  gradeLevel: string;
  section?: string | null;
  subject: string;
  date: string;
  time: string;
  room: string;
  maxMarks: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  performedBy: string;
  role: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}
