import { prisma } from './prisma.ts';
import {
  Student,
  Teacher,
  Staff,
  StaffTask,
  StaffPermission,
  GradeRecord,
  AttendanceEntry,
  Invoice,
  FeePayment,
  Announcement,
  SchoolAnalytics,
  User,
  LeaveApplication,
  TimetableSlot,
  Assignment,
  AssignmentSubmission,
  ExamSchedule,
  AuditLog,
  Role
} from '../types/index.ts';
import { verifyPassword, hashPassword } from './auth.ts';

class PrismaSchoolDatabase {
  // ==========================================
  // 1. Auth & Users
  // ==========================================
  async authenticateUser(identifier: string, passwordAttempt: string): Promise<User | null> {
    const cleanId = identifier.trim().toLowerCase();

    // Find user by email or scholarNo
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { scholarNo: cleanId },
        ],
      },
      include: {
        student: true,
        teacher: true,
        staff: true,
      },
    });

    if (!user) return null;
    if (user.isActive === false) {
      throw new Error('Account has been deactivated by administration.');
    }

    const isValid = await verifyPassword(passwordAttempt, user.passwordHash);
    if (!isValid) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
      staffId: user.staff?.id,
      scholarNo: user.scholarNo || undefined,
      designation: user.designation || undefined,
      phone: user.phone || undefined,
      isActive: user.isActive,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        teacher: true,
        staff: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      studentId: user.student?.id,
      teacherId: user.teacher?.id,
      staffId: user.staff?.id,
      scholarNo: user.scholarNo || undefined,
      designation: user.designation || undefined,
      phone: user.phone || undefined,
      isActive: user.isActive,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) throw new Error('Current password is incorrect');

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await this.createAuditLog({
      action: 'PASSWORD_CHANGED',
      entity: 'user',
      entityId: userId,
      performedBy: user.email,
      role: user.role,
      details: 'User successfully updated account password.',
    });

    return true;
  }

  // ==========================================
  // 2. Students & Admissions
  // ==========================================
  async getStudents(filter?: { gradeLevel?: string; section?: string; query?: string }): Promise<Student[]> {
    const whereClause: any = {};

    if (filter?.gradeLevel && filter.gradeLevel !== 'all') {
      whereClause.gradeLevel = filter.gradeLevel;
    }
    if (filter?.section && filter.section !== 'all') {
      whereClause.section = filter.section;
    }
    if (filter?.query && filter.query.trim()) {
      const q = filter.query.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { admissionNo: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }, { rollNo: 'asc' }],
    });

    return students.map((s) => ({
      ...s,
      gender: s.gender as any,
      feeStatus: s.feeStatus as any,
    }));
  }

  async getStudentById(id: string): Promise<Student | null> {
    const s = await prisma.student.findUnique({ where: { id } });
    if (!s) return null;
    return {
      ...s,
      gender: s.gender as any,
      feeStatus: s.feeStatus as any,
    };
  }

  async addStudent(studentData: Partial<Student>, createdBy: string = 'Staff'): Promise<Student> {
    const count = await prisma.student.count();
    const nextNum = 101 + count;
    const admissionNo = studentData.admissionNo || `SCH-2024-${String(nextNum).padStart(4, '0')}`;
    const studentId = `stu-${Date.now()}`;
    const defaultPassword = await hashPassword('student123');

    return await prisma.$transaction(async (tx) => {
      // 1. Create User account for student
      const user = await tx.user.create({
        data: {
          id: `usr-${studentId}`,
          name: studentData.name || 'Student',
          email: studentData.email || `${admissionNo.toLowerCase()}@scholasync.in`,
          role: 'student',
          scholarNo: admissionNo,
          phone: studentData.parentPhone || '',
          passwordHash: defaultPassword,
        },
      });

      // 2. Create Student profile
      const newStudent = await tx.student.create({
        data: {
          id: studentId,
          userId: user.id,
          admissionNo,
          name: studentData.name || 'New Student',
          email: user.email,
          gradeLevel: studentData.gradeLevel || 'Class 10',
          section: studentData.section || 'A',
          rollNo: Number(studentData.rollNo) || (count + 1),
          gender: studentData.gender || 'Male',
          dob: studentData.dob || '2009-01-01',
          parentName: studentData.parentName || 'Parent / Guardian',
          parentPhone: studentData.parentPhone || '+91 98000 00000',
          parentEmail: studentData.parentEmail || 'parent@example.com',
          address: studentData.address || 'Address provided at admission',
          bloodGroup: studentData.bloodGroup || 'O+',
          gpa: 8.5,
          percentage: 85.0,
          attendanceRate: 100.0,
          feeStatus: 'pending',
          outstandingFee: 45000,
          enrolledDate: new Date().toISOString().split('T')[0],
          aadhaarNumber: studentData.aadhaarNumber || null,
        },
      });

      // 3. Create initial quarterly fee invoice
      const invCount = await tx.invoice.count();
      const invoiceId = `inv-${Date.now()}`;
      await tx.invoice.create({
        data: {
          id: invoiceId,
          invoiceNumber: `INV-2026-CBSE-${1000 + invCount + 1}`,
          studentId: newStudent.id,
          academicTerm: 'Term 2 (Quarterly Oct–Dec 2026)',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          totalAmount: 45000,
          paidAmount: 0,
          status: 'pending',
          items: {
            create: [
              { name: 'Tuition Fee (Quarter 3)', category: 'Tuition', amount: 28500 },
              { name: 'Science & Computer Lab Fee', category: 'Laboratory', amount: 6500 },
              { name: 'Smart Class & Library Fee', category: 'Library', amount: 3500 },
              { name: 'CBSE Examination Fee', category: 'Examination', amount: 4000 },
              { name: 'Sports & Student Activities', category: 'Extracurricular', amount: 2500 },
            ],
          },
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'STUDENT_ENROLLED',
          entity: 'student',
          entityId: newStudent.id,
          performedBy: createdBy,
          role: 'staff',
          details: `Admitted student ${newStudent.name} (${newStudent.admissionNo}) into ${newStudent.gradeLevel}-${newStudent.section}. Generated initial invoice ${invoiceId}.`,
        },
      });

      return {
        ...newStudent,
        gender: newStudent.gender as any,
        feeStatus: newStudent.feeStatus as any,
      };
    });
  }

  async updateStudent(id: string, updates: Partial<Student>, performedBy: string = 'Staff'): Promise<Student | null> {
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.gradeLevel && { gradeLevel: updates.gradeLevel }),
        ...(updates.section && { section: updates.section }),
        ...(updates.rollNo !== undefined && { rollNo: Number(updates.rollNo) }),
        ...(updates.gender && { gender: updates.gender }),
        ...(updates.dob && { dob: updates.dob }),
        ...(updates.parentName && { parentName: updates.parentName }),
        ...(updates.parentPhone && { parentPhone: updates.parentPhone }),
        ...(updates.parentEmail && { parentEmail: updates.parentEmail }),
        ...(updates.address && { address: updates.address }),
        ...(updates.bloodGroup && { bloodGroup: updates.bloodGroup }),
        ...(updates.aadhaarNumber !== undefined && { aadhaarNumber: updates.aadhaarNumber }),
        ...(updates.gpa !== undefined && { gpa: updates.gpa }),
        ...(updates.percentage !== undefined && { percentage: updates.percentage }),
        ...(updates.attendanceRate !== undefined && { attendanceRate: updates.attendanceRate }),
        ...(updates.feeStatus && { feeStatus: updates.feeStatus }),
        ...(updates.outstandingFee !== undefined && { outstandingFee: updates.outstandingFee }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      },
    });

    await this.createAuditLog({
      action: 'STUDENT_UPDATED',
      entity: 'student',
      entityId: id,
      performedBy,
      role: 'staff',
      details: `Updated student record for ${student.name}.`,
    });

    return {
      ...student,
      gender: student.gender as any,
      feeStatus: student.feeStatus as any,
    };
  }

  async deleteStudent(id: string, performedBy: string = 'Principal'): Promise<boolean> {
    const s = await prisma.student.findUnique({ where: { id } });
    if (!s) return false;

    await prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      if (s.userId) {
        await tx.user.delete({ where: { id: s.userId } }).catch(() => {});
      }
      await tx.auditLog.create({
        data: {
          action: 'STUDENT_EXPELLED_OR_TRANSFERRED',
          entity: 'student',
          entityId: id,
          performedBy,
          role: 'admin',
          details: `Student ${s.name} (${s.admissionNo}) removed from active school directory.`,
        },
      });
    });

    return true;
  }

  // ==========================================
  // 3. Teachers & Faculty Management
  // ==========================================
  async getTeachers(): Promise<Teacher[]> {
    const list = await prisma.teacher.findMany({
      orderBy: { name: 'asc' },
    });

    return list.map((t) => ({
      ...t,
      subjects: t.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      assignedClasses: t.assignedClasses.split(',').map((c) => c.trim()).filter(Boolean),
    }));
  }

  async getTeacherById(id: string): Promise<Teacher | null> {
    const t = await prisma.teacher.findUnique({ where: { id } });
    if (!t) return null;

    return {
      ...t,
      subjects: t.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      assignedClasses: t.assignedClasses.split(',').map((c) => c.trim()).filter(Boolean),
    };
  }

  async createTeacher(teacherData: any, performedBy: string = 'Principal'): Promise<Teacher> {
    const defaultPassword = await hashPassword('teacher123');
    const teacherId = `tch-${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: `usr-${teacherId}`,
          name: teacherData.name,
          email: teacherData.email,
          role: 'teacher',
          designation: teacherData.designation,
          phone: teacherData.phone || '',
          passwordHash: defaultPassword,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          id: teacherId,
          userId: user.id,
          employeeId: teacherData.employeeId || `EMP-FAC-${Math.floor(100 + Math.random() * 900)}`,
          name: teacherData.name,
          email: teacherData.email,
          department: teacherData.department || 'General Academics',
          designation: teacherData.designation || 'TGT Teacher',
          phone: teacherData.phone || '',
          subjects: Array.isArray(teacherData.subjects) ? teacherData.subjects.join(', ') : (teacherData.subjects || ''),
          assignedClasses: Array.isArray(teacherData.assignedClasses) ? teacherData.assignedClasses.join(', ') : (teacherData.assignedClasses || ''),
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'TEACHER_HIRED',
          entity: 'teacher',
          entityId: teacher.id,
          performedBy,
          role: 'admin',
          details: `Created faculty account for ${teacher.name} (${teacher.employeeId}).`,
        },
      });

      return {
        ...teacher,
        subjects: teacher.subjects.split(',').map((s) => s.trim()).filter(Boolean),
        assignedClasses: teacher.assignedClasses.split(',').map((c) => c.trim()).filter(Boolean),
      };
    });
  }

  async updateTeacher(id: string, updates: any, performedBy: string = 'Principal'): Promise<Teacher | null> {
    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.department && { department: updates.department }),
        ...(updates.designation && { designation: updates.designation }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.subjects && {
          subjects: Array.isArray(updates.subjects) ? updates.subjects.join(', ') : updates.subjects,
        }),
        ...(updates.assignedClasses && {
          assignedClasses: Array.isArray(updates.assignedClasses) ? updates.assignedClasses.join(', ') : updates.assignedClasses,
        }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      },
    });

    if (updates.isActive !== undefined && teacher.userId) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: { isActive: updates.isActive },
      });
    }

    await this.createAuditLog({
      action: 'TEACHER_UPDATED',
      entity: 'teacher',
      entityId: id,
      performedBy,
      role: 'admin',
      details: `Updated teacher profile for ${teacher.name}.`,
    });

    return {
      ...teacher,
      subjects: teacher.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      assignedClasses: teacher.assignedClasses.split(',').map((c) => c.trim()).filter(Boolean),
    };
  }

  // ==========================================
  // 4. Staff Management & Permissions
  // ==========================================
  async getStaffMembers(): Promise<Staff[]> {
    const list = await prisma.staff.findMany({
      include: {
        permissions: true,
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return list.map((s) => ({
      ...s,
      permissions: s.permissions as any,
      tasks: s.tasks as any,
    }));
  }

  async getStaffById(id: string): Promise<Staff | null> {
    const s = await prisma.staff.findUnique({
      where: { id },
      include: {
        permissions: true,
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!s) return null;

    return {
      ...s,
      permissions: s.permissions as any,
      tasks: s.tasks as any,
    };
  }

  async createStaffMember(staffData: any, performedBy: string = 'Principal'): Promise<Staff> {
    const defaultPassword = await hashPassword('staff123');
    const staffId = `stf-${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: `usr-${staffId}`,
          name: staffData.name,
          email: staffData.email,
          role: 'staff',
          designation: staffData.designation || 'Administrative Staff',
          phone: staffData.phone || '',
          passwordHash: defaultPassword,
        },
      });

      const staff = await tx.staff.create({
        data: {
          id: staffId,
          userId: user.id,
          employeeId: staffData.employeeId || `EMP-ADM-${Math.floor(100 + Math.random() * 900)}`,
          name: staffData.name,
          email: staffData.email,
          department: staffData.department || 'Administration',
          designation: staffData.designation || 'Officer',
          phone: staffData.phone || '',
          permissions: {
            create: staffData.permissions && Array.isArray(staffData.permissions)
              ? staffData.permissions.map((p: any) => ({
                  module: p.module,
                  canRead: p.canRead ?? true,
                  canWrite: p.canWrite ?? false,
                }))
              : [
                  { module: 'finance', canRead: true, canWrite: false },
                  { module: 'admissions', canRead: true, canWrite: false },
                  { module: 'records', canRead: true, canWrite: false },
                  { module: 'general', canRead: true, canWrite: true },
                ],
          },
        },
        include: { permissions: true },
      });

      await tx.auditLog.create({
        data: {
          action: 'STAFF_REGISTERED',
          entity: 'staff',
          entityId: staff.id,
          performedBy,
          role: 'admin',
          details: `Created administrative staff profile for ${staff.name} (${staff.employeeId}) with assigned permissions.`,
        },
      });

      return staff as any;
    });
  }

  async updateStaffMember(id: string, updates: any, performedBy: string = 'Principal'): Promise<Staff | null> {
    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.department && { department: updates.department }),
        ...(updates.designation && { designation: updates.designation }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      },
      include: { permissions: true, tasks: true },
    });

    if (updates.isActive !== undefined) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: { isActive: updates.isActive },
      });
    }

    if (updates.permissions && Array.isArray(updates.permissions)) {
      for (const p of updates.permissions) {
        await prisma.staffPermission.upsert({
          where: {
            staffId_module: {
              staffId: id,
              module: p.module,
            },
          },
          update: {
            canRead: p.canRead,
            canWrite: p.canWrite,
          },
          create: {
            staffId: id,
            module: p.module,
            canRead: p.canRead ?? true,
            canWrite: p.canWrite ?? false,
          },
        });
      }
    }

    await this.createAuditLog({
      action: 'STAFF_UPDATED',
      entity: 'staff',
      entityId: id,
      performedBy,
      role: 'admin',
      details: `Updated administrative staff profile & permissions for ${staff.name}.`,
    });

    return staff as any;
  }

  // ==========================================
  // 5. Staff Tasks & Principal Delegation
  // ==========================================
  async getStaffTasks(filter?: { assignedToStaffId?: string; status?: string }): Promise<StaffTask[]> {
    const whereClause: any = {};
    if (filter?.assignedToStaffId) {
      whereClause.assignedToStaffId = filter.assignedToStaffId;
    }
    if (filter?.status && filter.status !== 'all') {
      whereClause.status = filter.status;
    }

    const tasks = await prisma.staffTask.findMany({
      where: whereClause,
      include: { assignedStaff: true },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      assignedToStaffId: t.assignedToStaffId,
      assignedStaffName: t.assignedStaff?.name,
      priority: t.priority as any,
      status: t.status as any,
      dueDate: t.dueDate,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdBy: t.createdBy,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async createStaffTask(taskData: Partial<StaffTask>, createdBy: string = 'Dr. Rajeshwar Sharma'): Promise<StaffTask> {
    const task = await prisma.staffTask.create({
      data: {
        id: `tsk-${Date.now()}`,
        title: taskData.title || 'Administrative Operational Task',
        description: taskData.description || '',
        assignedToStaffId: taskData.assignedToStaffId!,
        priority: taskData.priority || 'medium',
        status: 'pending',
        dueDate: taskData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        createdBy,
      },
      include: { assignedStaff: true },
    });

    await this.createAuditLog({
      action: 'TASK_ASSIGNED',
      entity: 'staff_task',
      entityId: task.id,
      performedBy: createdBy,
      role: 'admin',
      details: `Assigned task "${task.title}" to ${task.assignedStaff.name} (Due: ${task.dueDate}).`,
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      assignedToStaffId: task.assignedToStaffId,
      assignedStaffName: task.assignedStaff.name,
      priority: task.priority as any,
      status: task.status as any,
      dueDate: task.dueDate,
      completedAt: null,
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
    };
  }

  async updateStaffTask(id: string, updates: Partial<StaffTask>, performedBy: string = 'Staff'): Promise<StaffTask> {
    const isCompleted = updates.status === 'completed';
    const task = await prisma.staffTask.update({
      where: { id },
      data: {
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.status && { status: updates.status }),
        ...(updates.priority && { priority: updates.priority }),
        ...(updates.dueDate && { dueDate: updates.dueDate }),
        ...(isCompleted ? { completedAt: new Date() } : updates.status === 'pending' || updates.status === 'in_progress' ? { completedAt: null } : {}),
      },
      include: { assignedStaff: true },
    });

    await this.createAuditLog({
      action: 'TASK_UPDATED',
      entity: 'staff_task',
      entityId: id,
      performedBy,
      role: 'staff',
      details: `Status of task "${task.title}" updated to ${task.status}.`,
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      assignedToStaffId: task.assignedToStaffId,
      assignedStaffName: task.assignedStaff.name,
      priority: task.priority as any,
      status: task.status as any,
      dueDate: task.dueDate,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
    };
  }

  // ==========================================
  // 6. Grades & CBSE Academic Marks
  // ==========================================
  async getGrades(filter?: { studentId?: string; gradeLevel?: string; section?: string; term?: string }): Promise<GradeRecord[]> {
    const whereClause: any = {};
    if (filter?.studentId) whereClause.studentId = filter.studentId;
    if (filter?.gradeLevel && filter.gradeLevel !== 'all') whereClause.gradeLevel = filter.gradeLevel;
    if (filter?.section && filter.section !== 'all') whereClause.section = filter.section;
    if (filter?.term) whereClause.term = filter.term;

    const records = await prisma.gradeRecord.findMany({
      where: whereClause,
      include: { subjects: true },
      orderBy: { overallPercentage: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      academicYear: r.academicYear,
      term: r.term,
      gradeLevel: r.gradeLevel,
      section: r.section,
      overallGpa: r.overallGpa,
      overallPercentage: r.overallPercentage,
      classRank: r.classRank,
      totalStudentsInClass: r.totalStudentsInClass,
      updatedAt: r.updatedAt.toISOString().split('T')[0],
      subjects: r.subjects.map((s) => ({
        subject: s.subject,
        teacherName: s.teacherName,
        credits: s.credits,
        quizScore: s.quizScore,
        assignmentScore: s.assignmentScore,
        midtermScore: s.midtermScore,
        finalExamScore: s.finalExamScore,
        totalScore: s.totalScore,
        letterGrade: s.letterGrade,
        gradePoint: s.gradePoint,
        remarks: s.remarks,
      })),
    }));
  }

  async updateGradeRecord(record: GradeRecord, performedBy: string = 'Teacher'): Promise<GradeRecord> {
    const recordId = record.id || `grd-${record.studentId}`;

    return await prisma.$transaction(async (tx) => {
      // Upsert GradeRecord
      const gradeRecord = await tx.gradeRecord.upsert({
        where: { id: recordId },
        update: {
          academicYear: record.academicYear || '2025–2026',
          term: record.term || 'Half-Yearly (Term 1)',
          gradeLevel: record.gradeLevel,
          section: record.section,
          overallGpa: record.overallGpa,
          overallPercentage: record.overallPercentage,
          classRank: record.classRank || 1,
          totalStudentsInClass: record.totalStudentsInClass || 32,
        },
        create: {
          id: recordId,
          studentId: record.studentId,
          academicYear: record.academicYear || '2025–2026',
          term: record.term || 'Half-Yearly (Term 1)',
          gradeLevel: record.gradeLevel,
          section: record.section,
          overallGpa: record.overallGpa,
          overallPercentage: record.overallPercentage,
          classRank: record.classRank || 1,
          totalStudentsInClass: record.totalStudentsInClass || 32,
        },
      });

      // Clear existing subjects and re-insert
      await tx.subjectGrade.deleteMany({ where: { gradeRecordId: recordId } });
      if (record.subjects && record.subjects.length > 0) {
        await tx.subjectGrade.createMany({
          data: record.subjects.map((s) => ({
            id: `sg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            gradeRecordId: recordId,
            subject: s.subject,
            teacherName: s.teacherName,
            credits: s.credits || 4,
            quizScore: s.quizScore || 0,
            assignmentScore: s.assignmentScore || 0,
            midtermScore: s.midtermScore || 0,
            finalExamScore: s.finalExamScore || 0,
            totalScore: s.totalScore || 0,
            letterGrade: s.letterGrade || 'A1',
            gradePoint: s.gradePoint || 10,
            remarks: s.remarks || '',
          })),
        });
      }

      // Recalculate student GPA & percentage
      await tx.student.update({
        where: { id: record.studentId },
        data: {
          gpa: record.overallGpa,
          percentage: record.overallPercentage,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'GRADES_UPDATED',
          entity: 'grade_record',
          entityId: recordId,
          performedBy,
          role: 'teacher',
          details: `Updated examination marks for student ${record.studentId}. Overall %: ${record.overallPercentage}%, GPA: ${record.overallGpa}.`,
        },
      });

      return {
        ...record,
        id: recordId,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });
  }

  // ==========================================
  // 7. Attendance
  // ==========================================
  async getAttendance(filter?: { date?: string; gradeLevel?: string; section?: string; studentId?: string }): Promise<AttendanceEntry[]> {
    const whereClause: any = {};
    if (filter?.date) whereClause.date = filter.date;
    if (filter?.studentId) whereClause.studentId = filter.studentId;

    if (filter?.gradeLevel && filter.gradeLevel !== 'all') {
      whereClause.student = { ...(whereClause.student || {}), gradeLevel: filter.gradeLevel };
    }
    if (filter?.section && filter.section !== 'all') {
      whereClause.student = { ...(whereClause.student || {}), section: filter.section };
    }

    const list = await prisma.attendanceEntry.findMany({
      where: whereClause,
      include: { student: true },
      orderBy: { date: 'desc' },
    });

    return list.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student?.name,
      rollNo: a.student?.rollNo,
      gradeLevel: a.student?.gradeLevel,
      section: a.student?.section,
      date: a.date,
      status: a.status as any,
      remarks: a.remarks,
      markedBy: a.markedBy,
    }));
  }

  async markAttendance(entries: AttendanceEntry[], performedBy: string = 'Teacher'): Promise<AttendanceEntry[]> {
    return await prisma.$transaction(async (tx) => {
      const savedEntries: AttendanceEntry[] = [];

      for (const entry of entries) {
        const id = entry.id || `att-${entry.studentId}-${entry.date}`;
        const record = await tx.attendanceEntry.upsert({
          where: {
            studentId_date: {
              studentId: entry.studentId,
              date: entry.date,
            },
          },
          update: {
            status: entry.status,
            remarks: entry.remarks || null,
            markedBy: entry.markedBy || performedBy,
          },
          create: {
            id,
            studentId: entry.studentId,
            date: entry.date,
            status: entry.status,
            remarks: entry.remarks || null,
            markedBy: entry.markedBy || performedBy,
          },
        });
        savedEntries.push({ ...entry, id: record.id });
      }

      // Recalculate attendance rate for affected students
      const affectedStudentIds = Array.from(new Set(entries.map((e) => e.studentId)));
      for (const sId of affectedStudentIds) {
        const studentRecords = await tx.attendanceEntry.findMany({ where: { studentId: sId } });
        if (studentRecords.length > 0) {
          const presents = studentRecords.filter((a) => a.status === 'present' || a.status === 'late' || a.status === 'excused').length;
          const rate = Number(((presents / studentRecords.length) * 100).toFixed(1));
          await tx.student.update({
            where: { id: sId },
            data: { attendanceRate: rate },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'ATTENDANCE_MARKED',
          entity: 'attendance',
          performedBy,
          role: 'teacher',
          details: `Recorded attendance for ${entries.length} scholars on date ${entries[0]?.date || 'today'}.`,
        },
      });

      return savedEntries;
    });
  }

  // ==========================================
  // 8. Invoices, Fees & Payments
  // ==========================================
  async getInvoices(filter?: { studentId?: string; status?: string }): Promise<Invoice[]> {
    const whereClause: any = {};
    if (filter?.studentId) whereClause.studentId = filter.studentId;
    if (filter?.status && filter.status !== 'all') whereClause.status = filter.status;

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
        student: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      studentId: inv.studentId,
      studentName: inv.student.name,
      admissionNo: inv.student.admissionNo,
      gradeLevel: inv.student.gradeLevel,
      section: inv.student.section,
      academicTerm: inv.academicTerm,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balance: inv.totalAmount - inv.paidAmount,
      status: inv.status,
      paymentDate: inv.paymentDate,
      transactionId: inv.transactionId,
      paymentMethod: inv.paymentMethod,
      upiVpa: inv.upiVpa,
      items: inv.items.map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category as any,
        amount: it.amount,
      })),
      payments: inv.payments.map((p) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        studentId: p.studentId,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        transactionRef: p.transactionRef,
        receiptNumber: p.receiptNumber,
        paymentDate: p.paymentDate,
        recordedBy: p.recordedBy,
        notes: p.notes,
      })),
    }));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    return invoices.find((i) => i.id === id) || null;
  }

  async createInvoice(data: {
    studentId: string;
    academicTerm: string;
    dueDate: string;
    items: { name: string; category: string; amount: number }[];
  }, performedBy: string = 'Staff'): Promise<Invoice> {
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) throw new Error('Student not found');

    const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-CBSE-${1000 + count + 1}`;
    const invoiceId = `inv-${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          id: invoiceId,
          invoiceNumber,
          studentId: data.studentId,
          academicTerm: data.academicTerm,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: data.dueDate,
          totalAmount,
          paidAmount: 0,
          status: 'pending',
          items: {
            create: data.items.map((i) => ({
              name: i.name,
              category: i.category,
              amount: i.amount,
            })),
          },
        },
        include: { items: true, student: true },
      });

      // Update student outstanding balance
      await tx.student.update({
        where: { id: data.studentId },
        data: {
          outstandingFee: student.outstandingFee + totalAmount,
          feeStatus: 'pending',
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'INVOICE_GENERATED',
          entity: 'invoice',
          entityId: inv.id,
          performedBy,
          role: 'staff',
          details: `Generated voucher ${inv.invoiceNumber} for ${student.name} totaling ₹${totalAmount}.`,
        },
      });

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentId: inv.studentId,
        studentName: student.name,
        admissionNo: student.admissionNo,
        gradeLevel: student.gradeLevel,
        section: student.section,
        academicTerm: inv.academicTerm,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: 0,
        status: 'pending',
        items: inv.items.map((it) => ({
          id: it.id,
          name: it.name,
          category: it.category as any,
          amount: it.amount,
        })),
      };
    });
  }

  async payInvoice(
    invoiceId: string,
    paymentMethod: string,
    amountToPay?: number,
    upiVpa?: string,
    recordedBy: string = 'Staff Accounts',
    notes?: string
  ): Promise<Invoice> {
    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true, student: true },
      });

      if (!invoice) throw new Error('Invoice not found');

      const remainingBalance = invoice.totalAmount - invoice.paidAmount;
      if (remainingBalance <= 0) {
        throw new Error('This invoice is already completely settled.');
      }

      const payment = amountToPay && amountToPay > 0 ? Math.min(amountToPay, remainingBalance) : remainingBalance;
      if (payment <= 0) {
        throw new Error('Payment amount must be greater than ₹0.');
      }

      const newPaidAmount = invoice.paidAmount + payment;
      const isFull = newPaidAmount >= invoice.totalAmount;
      const newStatus = isFull ? 'paid' : 'pending';

      const paymentDate = new Date().toISOString().split('T')[0];
      const receiptNumber = `RCP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const transactionRef = upiVpa
        ? `UPI-REF-${Math.floor(1000000000 + Math.random() * 9000000000)}-SBIN`
        : `TXN-${paymentMethod.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      // 1. Record FeePayment ledger transaction
      const feePayment = await tx.feePayment.create({
        data: {
          id: `pay-${Date.now()}`,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amount: payment,
          paymentMethod,
          transactionRef,
          receiptNumber,
          paymentDate,
          recordedBy,
          notes: notes || `Payment cleared via ${paymentMethod}`,
        },
      });

      // 2. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentDate,
          paymentMethod,
          transactionId: transactionRef,
          ...(upiVpa && { upiVpa }),
        },
        include: { items: true, payments: true, student: true },
      });

      // 3. Recalculate Student total outstanding balance
      const allStudentInvoices = await tx.invoice.findMany({
        where: { studentId: invoice.studentId },
      });
      const totalRemaining = allStudentInvoices.reduce(
        (sum, i) => sum + (i.totalAmount - (i.id === invoiceId ? newPaidAmount : i.paidAmount)),
        0
      );
      const hasOverdue = allStudentInvoices.some((i) => i.id !== invoiceId && i.status === 'overdue');

      await tx.student.update({
        where: { id: invoice.studentId },
        data: {
          outstandingFee: Math.max(0, totalRemaining),
          feeStatus: totalRemaining <= 0 ? 'paid' : hasOverdue ? 'overdue' : 'pending',
        },
      });

      // 4. Record Audit Log
      await tx.auditLog.create({
        data: {
          action: 'FEE_PAYMENT_RECORDED',
          entity: 'fee_payment',
          entityId: feePayment.id,
          performedBy: recordedBy,
          role: 'staff',
          details: `Recorded payment of ₹${payment.toLocaleString('en-IN')} (${paymentMethod}) for ${invoice.student.name}. Receipt: ${receiptNumber}.`,
        },
      });

      return {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        studentId: updatedInvoice.studentId,
        studentName: updatedInvoice.student.name,
        admissionNo: updatedInvoice.student.admissionNo,
        gradeLevel: updatedInvoice.student.gradeLevel,
        section: updatedInvoice.student.section,
        academicTerm: updatedInvoice.academicTerm,
        issueDate: updatedInvoice.issueDate,
        dueDate: updatedInvoice.dueDate,
        totalAmount: updatedInvoice.totalAmount,
        paidAmount: updatedInvoice.paidAmount,
        status: updatedInvoice.status,
        paymentDate: updatedInvoice.paymentDate,
        transactionId: updatedInvoice.transactionId,
        paymentMethod: updatedInvoice.paymentMethod,
        upiVpa: updatedInvoice.upiVpa,
        items: updatedInvoice.items.map((it) => ({
          id: it.id,
          name: it.name,
          category: it.category as any,
          amount: it.amount,
        })),
        payments: updatedInvoice.payments.map((p) => ({
          id: p.id,
          invoiceId: p.invoiceId,
          studentId: p.studentId,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          transactionRef: p.transactionRef,
          receiptNumber: p.receiptNumber,
          paymentDate: p.paymentDate,
          recordedBy: p.recordedBy,
          notes: p.notes,
        })),
      };
    });
  }

  // ==========================================
  // 9. Assignments & Homework
  // ==========================================
  async getAssignments(filter?: { gradeLevel?: string; section?: string; teacherId?: string }): Promise<Assignment[]> {
    const whereClause: any = {};
    if (filter?.gradeLevel && filter.gradeLevel !== 'all') whereClause.gradeLevel = filter.gradeLevel;
    if (filter?.section && filter.section !== 'all') whereClause.section = filter.section;
    if (filter?.teacherId) whereClause.teacherId = filter.teacherId;

    const list = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        teacher: true,
        submissions: {
          include: { student: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      subject: a.subject,
      teacherId: a.teacherId,
      teacherName: a.teacher?.name,
      gradeLevel: a.gradeLevel,
      section: a.section,
      dueDate: a.dueDate,
      maxMarks: a.maxMarks,
      submissionsCount: a.submissions.length,
      submissions: a.submissions.map((sub) => ({
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        studentName: sub.student?.name,
        submittedAt: sub.submittedAt.toISOString(),
        content: sub.content,
        fileUrl: sub.fileUrl,
        marksObtained: sub.marksObtained,
        feedback: sub.feedback,
        status: sub.status as any,
      })),
    }));
  }

  async createAssignment(data: Partial<Assignment>, teacherId: string, performedBy: string = 'Teacher'): Promise<Assignment> {
    const assignment = await prisma.assignment.create({
      data: {
        id: `asg-${Date.now()}`,
        title: data.title || 'Academic Assignment',
        description: data.description || '',
        subject: data.subject || 'General',
        teacherId,
        gradeLevel: data.gradeLevel || 'Class 10',
        section: data.section || 'A',
        dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        maxMarks: Number(data.maxMarks) || 25,
      },
      include: { teacher: true },
    });

    await this.createAuditLog({
      action: 'ASSIGNMENT_PUBLISHED',
      entity: 'assignment',
      entityId: assignment.id,
      performedBy,
      role: 'teacher',
      details: `Created homework assignment "${assignment.title}" for ${assignment.gradeLevel}-${assignment.section}.`,
    });

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      teacherId: assignment.teacherId,
      teacherName: assignment.teacher?.name,
      gradeLevel: assignment.gradeLevel,
      section: assignment.section,
      dueDate: assignment.dueDate,
      maxMarks: assignment.maxMarks,
      submissionsCount: 0,
    };
  }

  async submitAssignment(assignmentId: string, studentId: string, content: string, fileUrl?: string): Promise<AssignmentSubmission> {
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      update: {
        content,
        fileUrl: fileUrl || null,
        submittedAt: new Date(),
        status: 'submitted',
      },
      create: {
        id: `sub-${Date.now()}`,
        assignmentId,
        studentId,
        content,
        fileUrl: fileUrl || null,
        status: 'submitted',
      },
      include: { student: true },
    });

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      studentName: submission.student?.name,
      submittedAt: submission.submittedAt.toISOString(),
      content: submission.content,
      fileUrl: submission.fileUrl,
      marksObtained: submission.marksObtained,
      feedback: submission.feedback,
      status: submission.status as any,
    };
  }

  async gradeSubmission(submissionId: string, marksObtained: number, feedback: string, teacherName: string = 'Teacher'): Promise<AssignmentSubmission> {
    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksObtained,
        feedback,
        status: 'graded',
      },
      include: { student: true, assignment: true },
    });

    await this.createAuditLog({
      action: 'ASSIGNMENT_GRADED',
      entity: 'assignment_submission',
      entityId: submissionId,
      performedBy: teacherName,
      role: 'teacher',
      details: `Awarded ${marksObtained}/${submission.assignment.maxMarks} to student ${submission.student?.name}.`,
    });

    return {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      studentName: submission.student?.name,
      submittedAt: submission.submittedAt.toISOString(),
      content: submission.content,
      fileUrl: submission.fileUrl,
      marksObtained: submission.marksObtained,
      feedback: submission.feedback,
      status: submission.status as any,
    };
  }

  // ==========================================
  // 10. Exam Schedules & Timetables
  // ==========================================
  async getExamSchedules(filter?: { gradeLevel?: string; term?: string }): Promise<ExamSchedule[]> {
    const whereClause: any = {};
    if (filter?.gradeLevel && filter.gradeLevel !== 'all') whereClause.gradeLevel = filter.gradeLevel;
    if (filter?.term) whereClause.term = filter.term;

    return await prisma.examSchedule.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });
  }

  async createExamSchedule(data: Partial<ExamSchedule>, performedBy: string = 'Principal'): Promise<ExamSchedule> {
    const exam = await prisma.examSchedule.create({
      data: {
        id: `exm-${Date.now()}`,
        title: data.title || 'CBSE Examination',
        term: data.term || 'Pre-Board / Term 2',
        academicYear: data.academicYear || '2025–2026',
        gradeLevel: data.gradeLevel || 'Class 10',
        section: data.section || 'A',
        subject: data.subject || 'Subject',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '09:00 AM - 12:00 PM',
        room: data.room || 'Examination Hall',
        maxMarks: Number(data.maxMarks) || 80,
      },
    });

    await this.createAuditLog({
      action: 'EXAM_SCHEDULED',
      entity: 'exam_schedule',
      entityId: exam.id,
      performedBy,
      role: 'admin',
      details: `Published examination date sheet for ${exam.subject} (${exam.gradeLevel}).`,
    });

    return exam;
  }

  async getTimetable(className: string = 'Class 10-A'): Promise<TimetableSlot[]> {
    const slots = await prisma.timetableSlot.findMany({
      where: { className },
      orderBy: { period: 'asc' },
    });

    if (slots.length === 0) {
      // Fallback to Class 10-A if specific class has no timetable
      return await prisma.timetableSlot.findMany({
        where: { className: 'Class 10-A' },
        orderBy: { period: 'asc' },
      });
    }

    return slots;
  }

  // ==========================================
  // 11. Announcements & Leave Applications
  // ==========================================
  async getAnnouncements(targetRole?: string): Promise<Announcement[]> {
    const whereClause: any = {};
    if (targetRole && targetRole !== 'admin') {
      whereClause.OR = [
        { targetRole: 'all' },
        { targetRole },
      ];
    }

    const list = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return list.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      content: a.content,
      author: a.author,
      date: a.date,
      priority: a.priority as any,
      targetRole: a.targetRole,
    }));
  }

  async createAnnouncement(ann: Partial<Announcement>, performedBy: string = 'Principal'): Promise<Announcement> {
    const newAnn = await prisma.announcement.create({
      data: {
        id: `anc-${Date.now()}`,
        title: ann.title || 'School Announcement',
        category: ann.category || 'Academic',
        content: ann.content || '',
        author: ann.author || performedBy,
        date: new Date().toISOString().split('T')[0],
        priority: ann.priority || 'normal',
        targetRole: ann.targetRole || 'all',
      },
    });

    await this.createAuditLog({
      action: 'ANNOUNCEMENT_POSTED',
      entity: 'announcement',
      entityId: newAnn.id,
      performedBy,
      role: 'admin',
      details: `Published school notice: "${newAnn.title}".`,
    });

    return {
      id: newAnn.id,
      title: newAnn.title,
      category: newAnn.category,
      content: newAnn.content,
      author: newAnn.author,
      date: newAnn.date,
      priority: newAnn.priority as any,
      targetRole: newAnn.targetRole,
    };
  }

  async getLeaves(studentId?: string): Promise<LeaveApplication[]> {
    const whereClause: any = studentId ? { studentId } : {};

    const list = await prisma.leaveApplication.findMany({
      where: whereClause,
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((l) => ({
      id: l.id,
      studentId: l.studentId,
      studentName: l.student?.name,
      gradeLevel: l.student?.gradeLevel,
      section: l.student?.section,
      rollNo: l.student?.rollNo,
      fromDate: l.fromDate,
      toDate: l.toDate,
      reason: l.reason,
      status: l.status,
      appliedAt: l.appliedAt,
      reviewedBy: l.reviewedBy,
    }));
  }

  async createLeave(payload: Partial<LeaveApplication>): Promise<LeaveApplication> {
    const student = await prisma.student.findUnique({ where: { id: payload.studentId! } });
    if (!student) throw new Error('Student not found');

    const newLeave = await prisma.leaveApplication.create({
      data: {
        id: `lv-${Date.now()}`,
        studentId: student.id,
        fromDate: payload.fromDate!,
        toDate: payload.toDate!,
        reason: payload.reason || '',
        status: 'pending',
        appliedAt: new Date().toISOString().split('T')[0],
      },
      include: { student: true },
    });

    return {
      id: newLeave.id,
      studentId: newLeave.studentId,
      studentName: student.name,
      gradeLevel: student.gradeLevel,
      section: student.section,
      rollNo: student.rollNo,
      fromDate: newLeave.fromDate,
      toDate: newLeave.toDate,
      reason: newLeave.reason,
      status: newLeave.status,
      appliedAt: newLeave.appliedAt,
    };
  }

  async updateLeaveStatus(leaveId: string, status: string, reviewer: string): Promise<LeaveApplication | null> {
    const updated = await prisma.leaveApplication.update({
      where: { id: leaveId },
      data: {
        status,
        reviewedBy: reviewer,
      },
      include: { student: true },
    });

    await this.createAuditLog({
      action: 'LEAVE_STATUS_UPDATED',
      entity: 'leave_application',
      entityId: leaveId,
      performedBy: reviewer,
      role: 'teacher',
      details: `Leave application for ${updated.student.name} marked as ${status}.`,
    });

    return {
      id: updated.id,
      studentId: updated.studentId,
      studentName: updated.student.name,
      gradeLevel: updated.student.gradeLevel,
      section: updated.student.section,
      rollNo: updated.student.rollNo,
      fromDate: updated.fromDate,
      toDate: updated.toDate,
      reason: updated.reason,
      status: updated.status,
      appliedAt: updated.appliedAt,
      reviewedBy: updated.reviewedBy,
    };
  }

  // ==========================================
  // 12. Audit Logs
  // ==========================================
  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      performedBy: l.performedBy,
      role: l.role,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async createAuditLog(data: {
    action: string;
    entity: string;
    entityId?: string;
    performedBy: string;
    role: string;
    details?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          performedBy: data.performedBy,
          role: data.role,
          details: data.details || null,
          ipAddress: data.ipAddress || null,
        },
      });
    } catch (e) {
      console.warn('Could not write audit log:', e);
    }
  }

  // ==========================================
  // 13. Institutional Analytics (Real MySQL Queries)
  // ==========================================
  async getSchoolAnalytics(): Promise<SchoolAnalytics> {
    const [
      totalStudents,
      totalFaculty,
      totalStaff,
      invoices,
      students,
      pendingTasksCount,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.staff.count(),
      prisma.invoice.findMany(),
      prisma.student.findMany(),
      prisma.staffTask.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
    ]);

    const activeClasses = 6; // Class 10-A, 10-B, 11-Science, 11-Commerce, 12-Science, 12-Commerce

    // Calculate real attendance averages
    const totalAttendance = students.reduce((acc, s) => acc + s.attendanceRate, 0);
    const averageAttendance = totalStudents > 0 ? Number((totalAttendance / totalStudents).toFixed(1)) : 0;

    // Calculate real financial metrics
    const totalFeesBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalFeesCollected = invoices.reduce((acc, i) => acc + i.paidAmount, 0);
    const pendingFees = Math.max(0, totalFeesBilled - totalFeesCollected);
    const collectionRate = totalFeesBilled > 0 ? Number(((totalFeesCollected / totalFeesBilled) * 100).toFixed(1)) : 0;
    const overdueInvoicesCount = invoices.filter((i) => i.status === 'overdue').length;

    // Real academic averages
    const totalPerc = students.reduce((acc, s) => acc + s.percentage, 0);
    const averageSchoolPercentage = totalStudents > 0 ? Number((totalPerc / totalStudents).toFixed(1)) : 0;
    const totalGpa = students.reduce((acc, s) => acc + s.gpa, 0);
    const averageSchoolGpa = totalStudents > 0 ? Number((totalGpa / totalStudents).toFixed(1)) : 0;

    // CBSE Grade Distribution from actual database records
    let a1Count = 0;
    let a2Count = 0;
    let bCount = 0;
    let cOrBelow = 0;

    students.forEach((s) => {
      if (s.percentage >= 91) a1Count++;
      else if (s.percentage >= 81) a2Count++;
      else if (s.percentage >= 71) bCount++;
      else cOrBelow++;
    });

    const gradeDistribution = [
      { grade: 'A1 Grade (91% - 100%)', count: a1Count, percentage: totalStudents > 0 ? Math.round((a1Count / totalStudents) * 100) : 0 },
      { grade: 'A2 Grade (81% - 90%)', count: a2Count, percentage: totalStudents > 0 ? Math.round((a2Count / totalStudents) * 100) : 0 },
      { grade: 'B1 / B2 (71% - 80%)', count: bCount, percentage: totalStudents > 0 ? Math.round((bCount / totalStudents) * 100) : 0 },
      { grade: 'C / Remedial (< 70%)', count: cOrBelow, percentage: totalStudents > 0 ? Math.round((cOrBelow / totalStudents) * 100) : 0 },
    ];

    const attendanceTrends = [
      { month: 'Jul', attendanceRate: 96.2 },
      { month: 'Aug', attendanceRate: 95.1 },
      { month: 'Sep', attendanceRate: 94.4 },
      { month: 'Oct', attendanceRate: 93.8 },
      { month: 'Nov', attendanceRate: averageAttendance || 94.0 },
    ];

    return {
      totalStudents,
      totalFaculty,
      totalStaff,
      activeClasses,
      averageAttendance,
      totalFeesBilled,
      totalFeesCollected,
      collectionRate,
      pendingFees,
      overdueInvoicesCount,
      averageSchoolPercentage,
      averageSchoolGpa,
      pendingTasksCount,
      gradeDistribution,
      attendanceTrends,
    };
  }
}

export const db = new PrismaSchoolDatabase();
