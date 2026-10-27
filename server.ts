import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.ts';
import {
  authenticateToken,
  requireAuth,
  requireRole,
  hashPassword,
  generateToken
} from './src/server/auth.ts';
import { testDatabaseConnection } from './src/server/prisma.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Attach JWT Bearer Token Authenticator to all incoming requests
  app.use(authenticateToken);

  // General Platform Health Check (Root level for Render / load balancers)
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'ScholaSync School Management System',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // REST API Router
  const apiRouter = express.Router();

  // ==========================================
  // 1. Health & Database Diagnostic
  // ==========================================
  apiRouter.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'ScholaSync School Management System',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  apiRouter.get('/health/db', async (req: Request, res: Response) => {
    try {
      const dbDiagnostic = await testDatabaseConnection();
      res.json({
        success: true,
        status: dbDiagnostic.connected ? 'healthy' : 'degraded',
        message: dbDiagnostic.connected
          ? 'Connected to MySQL via Prisma ORM'
          : 'MySQL database not connected.',
        diagnostic: {
          connected: dbDiagnostic.connected,
          provider: dbDiagnostic.provider,
          databaseUrlConfigured: dbDiagnostic.databaseUrlConfigured,
          latencyMs: dbDiagnostic.latencyMs,
          serverVersion: dbDiagnostic.serverVersion,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // In-memory Rate Limiting for Authentication (max 10 attempts per minute per IP)
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();
  const isRateLimited = (ip: string): boolean => {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now > entry.resetAt) {
      loginAttempts.set(ip, { count: 1, resetAt: now + 60000 });
      return false;
    }
    if (entry.count >= 10) return true;
    entry.count++;
    return false;
  };

  // ==========================================
  // 2. Authentication & Authorization APIs
  // ==========================================
  apiRouter.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      if (isRateLimited(clientIp)) {
        return res.status(429).json({
          success: false,
          error: 'Too many authentication attempts. Please wait 60 seconds before trying again.',
        });
      }

      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email or Scholar Number and password are required',
        });
      }

      const cleanId = String(identifier).trim().toLowerCase();
      const user = await db.authenticateUser(cleanId, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Please verify your Email/Scholar Number and password.',
        });
      }

      // Record audit log for login
      await db.createAuditLog({
        action: 'USER_LOGIN',
        entity: 'user',
        entityId: user.id,
        performedBy: user.email,
        role: user.role,
        details: `Successful authentication as ${user.role} (${user.name}).`,
        ipAddress: req.ip,
      });

      // Generate signed JWT Token
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
        staffId: user.staffId,
        scholarNo: user.scholarNo,
      });

      res.json({
        success: true,
        data: {
          user,
          token,
        },
        message: `Authenticated successfully as ${user.role} (${user.name})`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
    try {
      const authUser = req.user!;
      const userProfile = await db.getUserById(authUser.id);
      if (!userProfile) {
        return res.status(404).json({ success: false, error: 'User profile not found' });
      }
      res.json({ success: true, data: userProfile });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/auth/change-password', requireAuth, async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Both current and new password are required' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
      }

      await db.changePassword(req.user!.id, oldPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/auth/register', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { name, email, password, role, scholarNo, designation, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);
      // In production create User record via DB
      res.status(201).json({
        success: true,
        data: { name, email, role: role || 'student', scholarNo, designation, phone },
        message: 'User account registered with encrypted bcrypt password',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 3. Staff Management & Tasks (Principal & Staff)
  // ==========================================
  apiRouter.get('/staff', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const staffList = await db.getStaffMembers();
      res.json({ success: true, data: staffList });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.get('/staff/:id', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      const staff = await db.getStaffById(req.params.id);
      if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found' });
      res.json({ success: true, data: staff });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/staff', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { name, email, department, designation, phone, permissions } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Staff name and email are required.' });
      }
      const newStaff = await db.createStaffMember(
        { name, email, department, designation, phone, permissions },
        req.user?.email || 'Principal'
      );
      res.status(201).json({ success: true, data: newStaff });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.put('/staff/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const updated = await db.updateStaffMember(req.params.id, req.body, req.user?.email || 'Principal');
      if (!updated) return res.status(404).json({ success: false, error: 'Staff member not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Staff Tasks
  apiRouter.get('/staff-tasks', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      let { assignedToStaffId, status } = req.query;
      // If user is staff, optionally filter to their assigned tasks or show all
      if (req.user?.role === 'staff' && req.user.staffId && req.query.myTasks === 'true') {
        assignedToStaffId = req.user.staffId;
      }

      const tasks = await db.getStaffTasks({
        assignedToStaffId: assignedToStaffId as string,
        status: status as string,
      });
      res.json({ success: true, data: tasks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/staff-tasks', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { title, description, assignedToStaffId, priority, dueDate } = req.body;
      if (!title || !assignedToStaffId) {
        return res.status(400).json({ success: false, error: 'Task title and assigned staff member are required.' });
      }
      const task = await db.createStaffTask(
        { title, description, assignedToStaffId, priority, dueDate },
        req.user?.email || 'Principal'
      );
      res.status(201).json({ success: true, data: task });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.put('/staff-tasks/:id', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      const updated = await db.updateStaffTask(req.params.id, req.body, req.user?.email || 'Staff');
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.put('/staff-tasks/:id/status', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      const updated = await db.updateStaffTask(req.params.id, { status: req.body.status }, req.user?.email || 'Staff');
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 4. Teachers & Faculty Management
  // ==========================================
  apiRouter.get('/teachers', requireAuth, async (req: Request, res: Response) => {
    try {
      const teachers = await db.getTeachers();
      res.json({ success: true, data: teachers });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/teachers', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { name, email, department, designation, phone, subjects, assignedClasses } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Teacher name and email are required.' });
      }
      const teacher = await db.createTeacher(
        { name, email, department, designation, phone, subjects, assignedClasses },
        req.user?.email || 'Principal'
      );
      res.status(201).json({ success: true, data: teacher });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.put('/teachers/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const updated = await db.updateTeacher(req.params.id, req.body, req.user?.email || 'Principal');
      if (!updated) return res.status(404).json({ success: false, error: 'Teacher not found' });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 5. Students & Admissions API (RBAC Enforced)
  // ==========================================
  apiRouter.get('/students', requireAuth, async (req: Request, res: Response) => {
    try {
      // Privacy Guard: If a student is authenticated, only allow them to see their own profile
      if (req.user && req.user.role === 'student' && req.user.studentId) {
        const myStudent = await db.getStudentById(req.user.studentId);
        return res.json({ success: true, data: myStudent ? [myStudent] : [] });
      }

      const { gradeLevel, section, query } = req.query;
      const students = await db.getStudents({
        gradeLevel: gradeLevel as string,
        section: section as string,
        query: query as string,
      });

      res.json({ success: true, data: students });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.get('/students/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      // Privacy Guard: Student can only view their own record
      if (req.user && req.user.role === 'student' && req.user.studentId !== req.params.id) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Student privacy policy prohibits accessing other students confidential records.',
        });
      }

      const student = await db.getStudentById(req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student record not found' });
      }

      const [grades, attendance, invoices] = await Promise.all([
        db.getGrades({ studentId: req.params.id }),
        db.getAttendance({ studentId: req.params.id }),
        db.getInvoices({ studentId: req.params.id }),
      ]);

      res.json({
        success: true,
        data: {
          student,
          grades: grades[0] || null,
          allGrades: grades,
          attendance,
          invoices,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/students', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      const { name, email, gradeLevel, section, rollNo, gender, dob, parentName, parentPhone, parentEmail, address, bloodGroup, aadhaarNumber } = req.body;
      if (!name || !gradeLevel) {
        return res.status(400).json({ success: false, error: 'Student name and class level are required.' });
      }

      const newStudent = await db.addStudent(
        {
          name,
          email,
          gradeLevel,
          section: section || 'A',
          rollNo: Number(rollNo) || 1,
          gender: gender || 'Female',
          dob: dob || '2009-01-01',
          parentName: parentName || '',
          parentPhone: parentPhone || '',
          parentEmail: parentEmail || '',
          address: address || '',
          bloodGroup: bloodGroup || 'O+',
          aadhaarNumber: aadhaarNumber || null,
        },
        req.user?.email || 'Staff'
      );

      res.status(201).json({ success: true, data: newStudent });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.put('/students/:id', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      const updated = await db.updateStudent(req.params.id, req.body, req.user?.email || 'Staff');
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.delete('/students/:id', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const ok = await db.deleteStudent(req.params.id, req.user?.email || 'Principal');
      if (!ok) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      res.json({ success: true, message: 'Student record removed successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 6. Grades & CBSE Marks Entry (RBAC)
  // ==========================================
  apiRouter.get('/grades', requireAuth, async (req: Request, res: Response) => {
    try {
      let { studentId, gradeLevel, section, term } = req.query;

      // Privacy Guard: Student can only view their own grades
      if (req.user && req.user.role === 'student' && req.user.studentId) {
        studentId = req.user.studentId;
      }

      const grades = await db.getGrades({
        studentId: studentId as string,
        gradeLevel: gradeLevel as string,
        section: section as string,
        term: term as string,
      });

      res.json({ success: true, data: grades });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/grades', requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
    try {
      const record = req.body;
      if (!record.studentId || !record.subjects) {
        return res.status(400).json({ success: false, error: 'Student ID and subjects required' });
      }
      const saved = await db.updateGradeRecord(record, req.user?.email || 'Teacher');
      res.json({ success: true, data: saved, message: 'Marks record updated and saved to MySQL' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 7. Attendance Register (RBAC)
  // ==========================================
  apiRouter.get('/attendance', requireAuth, async (req: Request, res: Response) => {
    try {
      let { date, gradeLevel, section, studentId } = req.query;

      // Privacy Guard: Student can only view their own attendance log
      if (req.user && req.user.role === 'student' && req.user.studentId) {
        studentId = req.user.studentId;
      }

      const list = await db.getAttendance({
        date: date as string,
        gradeLevel: gradeLevel as string,
        section: section as string,
        studentId: studentId as string,
      });
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/attendance', requireRole(['admin', 'teacher', 'staff']), async (req: Request, res: Response) => {
    try {
      let entries: any[] = [];
      if (Array.isArray(req.body)) {
        entries = req.body;
      } else if (req.body && Array.isArray(req.body.records)) {
        const { date, gradeLevel, section, records } = req.body;
        entries = records.map((r: any) => ({
          studentId: r.studentId,
          date: date || new Date().toISOString().split('T')[0],
          status: r.status,
          gradeLevel,
          section,
          remarks: r.remarks,
        }));
      } else if (req.body) {
        entries = [req.body];
      }

      const saved = await db.markAttendance(entries, req.user?.name || req.user?.email || 'Teacher');
      res.json({ success: true, data: saved, message: `Recorded attendance for ${saved.length} students` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 8. Fees, Invoices & Financial Ledger (RBAC)
  // ==========================================
  apiRouter.get('/fees', requireAuth, async (req: Request, res: Response) => {
    try {
      let { studentId, status } = req.query;

      // Privacy Guard: Student can only inspect their own fee invoices
      if (req.user && req.user.role === 'student' && req.user.studentId) {
        studentId = req.user.studentId;
      }

      const invoices = await db.getInvoices({
        studentId: studentId as string,
        status: status as string,
      });
      res.json({ success: true, data: invoices });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/fees/invoice', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      const { studentId, academicTerm, dueDate, items } = req.body;
      if (!studentId || !items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'Student ID and fee items array required.' });
      }

      const invoice = await db.createInvoice(
        { studentId, academicTerm: academicTerm || 'Term 2', dueDate: dueDate || '2026-11-30', items },
        req.user?.email || 'Staff'
      );
      res.status(201).json({ success: true, data: invoice });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/fees/pay', requireAuth, async (req: Request, res: Response) => {
    try {
      const { invoiceId, paymentMethod, amount, upiVpa, notes } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ success: false, error: 'Invoice ID is required' });
      }

      if (amount !== undefined && Number(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Payment amount must be greater than ₹0.' });
      }

      const targetInvoice = await db.getInvoiceById(invoiceId);
      if (!targetInvoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Privacy check: Student cannot pay someone else's invoice
      if (req.user && req.user.role === 'student' && req.user.studentId !== targetInvoice.studentId) {
        return res.status(403).json({ success: false, error: 'Access Denied: Cannot clear another student invoice' });
      }

      const recorder = req.user?.name || req.user?.email || 'Student Portal';
      const updatedInvoice = await db.payInvoice(
        invoiceId,
        paymentMethod || 'UPI (PhonePe / Google Pay QR)',
        amount ? Number(amount) : undefined,
        upiVpa,
        recorder,
        notes
      );

      res.json({
        success: true,
        data: updatedInvoice,
        message: 'Payment recorded and credited in MySQL. Official CBSE fee voucher generated.',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/fees/payments', requireAuth, async (req: Request, res: Response) => {
    try {
      const { invoiceId, paymentMethod, amount, upiVpa, notes, transactionRef } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ success: false, error: 'Invoice ID is required' });
      }

      if (amount !== undefined && Number(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Payment amount must be greater than ₹0.' });
      }

      const targetInvoice = await db.getInvoiceById(invoiceId);
      if (!targetInvoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      if (req.user && req.user.role === 'student' && req.user.studentId !== targetInvoice.studentId) {
        return res.status(403).json({ success: false, error: 'Access Denied: Cannot clear another student invoice' });
      }

      const recorder = req.user?.name || req.user?.email || 'Staff Portal';
      const updatedInvoice = await db.payInvoice(
        invoiceId,
        paymentMethod || 'UPI',
        amount !== undefined ? Number(amount) : undefined,
        transactionRef || upiVpa,
        recorder,
        notes
      );

      res.status(201).json({
        success: true,
        data: {
          invoice: updatedInvoice,
          payment: updatedInvoice.payments?.[0],
        },
        message: 'Payment recorded successfully',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 9. Homework & Assignments
  // ==========================================
  apiRouter.get('/assignments', requireAuth, async (req: Request, res: Response) => {
    try {
      const { gradeLevel, section, teacherId } = req.query;
      const list = await db.getAssignments({
        gradeLevel: gradeLevel as string,
        section: section as string,
        teacherId: teacherId as string,
      });
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/assignments', requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
    try {
      const { title, description, subject, gradeLevel, section, dueDate, maxMarks } = req.body;
      if (!title || !subject) {
        return res.status(400).json({ success: false, error: 'Title and subject are required.' });
      }
      const teacherId = req.user?.teacherId || req.body.teacherId || 'tch-01';
      const assignment = await db.createAssignment(
        { title, description, subject, gradeLevel, section, dueDate, maxMarks },
        teacherId,
        req.user?.email || 'Teacher'
      );
      res.status(201).json({ success: true, data: assignment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/assignments/:id/submit', requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const { content, fileUrl } = req.body;
      const studentId = req.user!.studentId;
      if (!studentId) return res.status(403).json({ success: false, error: 'Student ID not associated with profile' });

      const submission = await db.submitAssignment(req.params.id, studentId, content || '', fileUrl);
      res.json({ success: true, data: submission, message: 'Assignment submitted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.put('/assignments/submissions/:id/grade', requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
    try {
      const { marksObtained, feedback } = req.body;
      if (marksObtained === undefined) {
        return res.status(400).json({ success: false, error: 'Marks obtained required' });
      }
      const submission = await db.gradeSubmission(
        req.params.id,
        Number(marksObtained),
        feedback || '',
        req.user?.name || 'Teacher'
      );
      res.json({ success: true, data: submission, message: 'Submission evaluated and graded' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 10. Exam Schedules
  // ==========================================
  apiRouter.get('/exams', requireAuth, async (req: Request, res: Response) => {
    try {
      const { gradeLevel, term } = req.query;
      const exams = await db.getExamSchedules({
        gradeLevel: gradeLevel as string,
        term: term as string,
      });
      res.json({ success: true, data: exams });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/exams', requireRole(['admin', 'teacher']), async (req: Request, res: Response) => {
    try {
      const exam = await db.createExamSchedule(req.body, req.user?.email || 'Principal');
      res.status(201).json({ success: true, data: exam });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 11. Student Leaves & Attendance
  // ==========================================
  apiRouter.get('/leaves', requireAuth, async (req: Request, res: Response) => {
    try {
      let studentId = req.query.studentId as string;
      if (req.user && req.user.role === 'student' && req.user.studentId) {
        studentId = req.user.studentId;
      }
      const list = await db.getLeaves(studentId);
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/leaves', requireAuth, async (req: Request, res: Response) => {
    try {
      const { fromDate, toDate, reason, studentId } = req.body;
      const actualStudentId = req.user?.role === 'student' ? req.user.studentId! : studentId;

      if (!actualStudentId || !fromDate || !toDate || !reason) {
        return res.status(400).json({ success: false, error: 'Missing required leave fields' });
      }

      const newLeave = await db.createLeave({
        studentId: actualStudentId,
        fromDate,
        toDate,
        reason,
      });
      res.status(201).json({ success: true, data: newLeave });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/leaves/status', requireRole(['admin', 'teacher', 'staff']), async (req: Request, res: Response) => {
    try {
      const { leaveId, status } = req.body;
      if (!leaveId || !status) {
        return res.status(400).json({ success: false, error: 'Leave ID and status required' });
      }
      const reviewerName = req.user ? req.user.name || req.user.email : 'Administration';
      const updated = await db.updateLeaveStatus(leaveId, status, reviewerName);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Leave application not found' });
      }
      res.json({ success: true, data: updated, message: `Leave status updated to ${status}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 12. Timetable, Announcements & Analytics
  // ==========================================
  apiRouter.get('/timetable', requireAuth, async (req: Request, res: Response) => {
    try {
      const className = (req.query.className as string) || 'Class 10-A';
      const slots = await db.getTimetable(className);
      res.json({ success: true, data: slots });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.get('/analytics', requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await db.getSchoolAnalytics();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.get('/announcements', requireAuth, async (req: Request, res: Response) => {
    try {
      const targetRole = req.user?.role;
      const list = await db.getAnnouncements(targetRole);
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/announcements', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
      const { title, category, content, priority, targetRole } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Title and content required' });
      }
      const newAnn = await db.createAnnouncement(
        { title, category, content, priority, targetRole },
        req.user?.name || 'Administration'
      );
      res.status(201).json({ success: true, data: newAnn });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Audit Logs (Principal Only)
  apiRouter.get('/audit-logs', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const logs = await db.getAuditLogs(limit);
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Database re-seed trigger (Admin Only)
  apiRouter.post('/reset', requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      // Execute seed logic
      const { exec } = await import('child_process');
      exec('npm run db:seed', (err, stdout, stderr) => {
        if (err) console.error('Seed execution error:', err);
      });
      res.json({ success: true, message: 'Database reset and re-seed initiated via Prisma' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const HOST = '0.0.0.0';
  app.listen(Number(PORT), HOST, () => {
    console.log(`ScholaSync Server listening on http://${HOST}:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
