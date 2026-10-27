import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ScholaSync MySQL Database via Prisma...');

  // Hash standard credentials
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordStaff = await bcrypt.hash('staff123', 10);
  const passwordTeacher = await bcrypt.hash('teacher123', 10);
  const passwordStudent = await bcrypt.hash('student123', 10);

  // Clean existing data in order of foreign key dependency
  console.log('Cleaning previous records...');
  await prisma.auditLog.deleteMany({});
  await prisma.assignmentSubmission.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.examSchedule.deleteMany({});
  await prisma.staffTask.deleteMany({});
  await prisma.staffPermission.deleteMany({});
  await prisma.feePayment.deleteMany({});
  await prisma.feeItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.leaveApplication.deleteMany({});
  await prisma.attendanceEntry.deleteMany({});
  await prisma.subjectGrade.deleteMany({});
  await prisma.gradeRecord.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.user.deleteMany({});

  // ========================================================
  // 1. PRINCIPAL (SUPER ADMINISTRATOR)
  // ========================================================
  console.log('Creating Principal User...');
  const principalUser = await prisma.user.create({
    data: {
      id: 'usr-admin-1',
      name: 'Dr. Rajeshwar Sharma',
      email: 'principal@scholasync.in',
      role: Role.admin,
      designation: 'Principal & Academic Director',
      phone: '+91 98101 23456',
      passwordHash: passwordAdmin,
    },
  });

  // ========================================================
  // 2. ADMINISTRATIVE STAFF
  // ========================================================
  console.log('Creating Staff Users & Profiles...');
  const staffUser1 = await prisma.user.create({
    data: {
      id: 'usr-stf-1',
      name: 'Sunita Roy',
      email: 'finance.staff@scholasync.in',
      role: Role.staff,
      designation: 'Accounts Officer & Bursar',
      phone: '+91 98111 22334',
      passwordHash: passwordStaff,
    },
  });

  const staffProfile1 = await prisma.staff.create({
    data: {
      id: 'stf-01',
      userId: staffUser1.id,
      employeeId: 'EMP-ADM-008',
      name: 'Sunita Roy',
      email: 'finance.staff@scholasync.in',
      department: 'Finance & Accounts',
      designation: 'Accounts Officer & Bursar',
      phone: '+91 98111 22334',
      permissions: {
        create: [
          { module: 'finance', canRead: true, canWrite: true },
          { module: 'records', canRead: true, canWrite: false },
          { module: 'general', canRead: true, canWrite: true },
        ],
      },
    },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      id: 'usr-stf-2',
      name: 'Vikram Malhotra',
      email: 'admissions.staff@scholasync.in',
      role: Role.staff,
      designation: 'Registrar & Admissions Manager',
      phone: '+91 98222 33445',
      passwordHash: passwordStaff,
    },
  });

  const staffProfile2 = await prisma.staff.create({
    data: {
      id: 'stf-02',
      userId: staffUser2.id,
      employeeId: 'EMP-ADM-012',
      name: 'Vikram Malhotra',
      email: 'admissions.staff@scholasync.in',
      department: 'Admissions & Student Affairs',
      designation: 'Registrar & Admissions Manager',
      phone: '+91 98222 33445',
      permissions: {
        create: [
          { module: 'admissions', canRead: true, canWrite: true },
          { module: 'records', canRead: true, canWrite: true },
          { module: 'attendance', canRead: true, canWrite: true },
          { module: 'general', canRead: true, canWrite: true },
        ],
      },
    },
  });

  // ========================================================
  // 3. TEACHERS
  // ========================================================
  console.log('Creating Teachers...');
  const teacherUser1 = await prisma.user.create({
    data: {
      id: 'usr-tch-1',
      name: 'Prof. Marcus Verma',
      email: 'marcus.verma@scholasync.in',
      role: Role.teacher,
      designation: 'PGT Physics & Class Teacher (Class 10-A)',
      phone: '+91 98765 43210',
      passwordHash: passwordTeacher,
    },
  });

  const teacherProfile1 = await prisma.teacher.create({
    data: {
      id: 'tch-01',
      userId: teacherUser1.id,
      employeeId: 'EMP-FAC-014',
      name: 'Prof. Marcus Verma',
      email: 'marcus.verma@scholasync.in',
      department: 'Sciences & Physics',
      designation: 'PGT Physics & Class Teacher (Class 10-A)',
      phone: '+91 98765 43210',
      subjects: 'Physics, Advanced STEM Practical',
      assignedClasses: 'Class 10-A, Class 10-B, Class 11-Science',
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      id: 'usr-tch-2',
      name: 'Dr. Priya Nair',
      email: 'priya.nair@scholasync.in',
      role: Role.teacher,
      designation: 'PGT Mathematics & Head of Department',
      phone: '+91 98654 32109',
      passwordHash: passwordTeacher,
    },
  });

  const teacherProfile2 = await prisma.teacher.create({
    data: {
      id: 'tch-02',
      userId: teacherUser2.id,
      employeeId: 'EMP-FAC-019',
      name: 'Dr. Priya Nair',
      email: 'priya.nair@scholasync.in',
      department: 'Mathematics',
      designation: 'PGT Mathematics & Head of Department',
      phone: '+91 98654 32109',
      subjects: 'Mathematics, Applied Statistics',
      assignedClasses: 'Class 10-A, Class 11-Science, Class 12-Science',
    },
  });

  // ========================================================
  // 4. STUDENTS
  // ========================================================
  console.log('Creating Students...');
  const studentDataList = [
    {
      id: 'stu-101',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@scholasync.in',
      admissionNo: 'SCH-2024-0101',
      gradeLevel: 'Class 10',
      section: 'A',
      rollNo: 1,
      gender: 'Male',
      dob: '2009-04-14',
      parentName: 'Sunil Sharma (Father) & Meera Sharma (Mother)',
      parentPhone: '+91 98200 11223',
      parentEmail: 'sunil.sharma@gmail.com',
      address: 'Flat 402, Lotus Residency, Sector 62, Noida, Uttar Pradesh',
      bloodGroup: 'B+',
      gpa: 9.4,
      percentage: 92.5,
      attendanceRate: 95.0,
      feeStatus: 'paid',
      outstandingFee: 0,
      enrolledDate: '2022-04-01',
      aadhaarNumber: 'XXXX-XXXX-4512',
    },
    {
      id: 'stu-102',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@scholasync.in',
      admissionNo: 'SCH-2024-0102',
      gradeLevel: 'Class 10',
      section: 'A',
      rollNo: 2,
      gender: 'Female',
      dob: '2009-08-21',
      parentName: 'K. V. Iyer (Father) & Lakshmi Iyer (Mother)',
      parentPhone: '+91 98300 22334',
      parentEmail: 'kv.iyer@fintech.co.in',
      address: 'B-12, Green Glen Layout, Bellandur, Bengaluru, Karnataka',
      bloodGroup: 'O+',
      gpa: 9.8,
      percentage: 96.8,
      attendanceRate: 98.4,
      feeStatus: 'paid',
      outstandingFee: 0,
      enrolledDate: '2022-04-01',
      aadhaarNumber: 'XXXX-XXXX-9182',
    },
    {
      id: 'stu-103',
      name: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@scholasync.in',
      admissionNo: 'SCH-2024-0103',
      gradeLevel: 'Class 10',
      section: 'A',
      rollNo: 3,
      gender: 'Male',
      dob: '2009-02-18',
      parentName: 'Vikas Deshmukh (Father)',
      parentPhone: '+91 98400 33445',
      parentEmail: 'vikas.deshmukh@gmail.com',
      address: 'Plot 77, Baner Road, Pune, Maharashtra',
      bloodGroup: 'A+',
      gpa: 8.2,
      percentage: 81.4,
      attendanceRate: 88.5,
      feeStatus: 'pending',
      outstandingFee: 25000,
      enrolledDate: '2023-04-01',
      aadhaarNumber: 'XXXX-XXXX-3341',
    },
    {
      id: 'stu-104',
      name: 'Diya Patel',
      email: 'diya.patel@scholasync.in',
      admissionNo: 'SCH-2024-0104',
      gradeLevel: 'Class 10',
      section: 'B',
      rollNo: 1,
      gender: 'Female',
      dob: '2009-11-05',
      parentName: 'Bhavin Patel (Father) & Nina Patel (Mother)',
      parentPhone: '+91 98500 44556',
      parentEmail: 'bhavin.patel@gmail.com',
      address: 'Row House 4, Satellite, Ahmedabad, Gujarat',
      bloodGroup: 'AB+',
      gpa: 9.1,
      percentage: 89.6,
      attendanceRate: 93.0,
      feeStatus: 'overdue',
      outstandingFee: 45000,
      enrolledDate: '2023-04-01',
      aadhaarNumber: 'XXXX-XXXX-6623',
    },
  ];

  for (const s of studentDataList) {
    const user = await prisma.user.create({
      data: {
        id: `usr-${s.id}`,
        name: s.name,
        email: s.email,
        role: Role.student,
        scholarNo: s.admissionNo,
        phone: s.parentPhone,
        passwordHash: passwordStudent,
      },
    });

    await prisma.student.create({
      data: {
        ...s,
        userId: user.id,
      },
    });
  }

  // ========================================================
  // 5. STAFF TASKS (PRINCIPAL ASSIGNMENTS)
  // ========================================================
  console.log('Creating Staff Tasks...');
  await prisma.staffTask.createMany({
    data: [
      {
        id: 'tsk-001',
        title: 'Q3 Fee Collection Reconciliation & Defaulter Follow-up',
        description: 'Prepare fee collection summary for Term 2. Issue reminders for outstanding balances exceeding ₹25,000.',
        assignedToStaffId: staffProfile1.id,
        priority: 'high',
        status: 'in_progress',
        dueDate: '2026-11-05',
        createdBy: principalUser.name,
      },
      {
        id: 'tsk-002',
        title: 'Audit Transport Subsidies & Vendor Payments',
        description: 'Verify quarterly fuel reimbursements and GPS maintenance records with the bus logistics contractor.',
        assignedToStaffId: staffProfile1.id,
        priority: 'medium',
        status: 'completed',
        dueDate: '2026-10-25',
        completedAt: new Date('2026-10-24'),
        createdBy: principalUser.name,
      },
      {
        id: 'tsk-003',
        title: 'CBSE List of Candidates (LOC) Verification for Class 10 & 12',
        description: 'Cross-verify Aadhaar numbers, subject combinations, and DOB certificates for all registered board exam students.',
        assignedToStaffId: staffProfile2.id,
        priority: 'urgent',
        status: 'pending',
        dueDate: '2026-11-02',
        createdBy: principalUser.name,
      },
      {
        id: 'tsk-004',
        title: 'Class 11 Mid-Session Admissions & Transfer Certificate Processing',
        description: 'Verify eligibility criteria, migration certificates, and character certificates for incoming transfer applicants.',
        assignedToStaffId: staffProfile2.id,
        priority: 'medium',
        status: 'in_progress',
        dueDate: '2026-11-10',
        createdBy: principalUser.name,
      },
    ],
  });

  // ========================================================
  // 6. INVOICES, FEE ITEMS & PAYMENTS
  // ========================================================
  console.log('Creating Invoices and Fee Transactions...');
  // Aarav Sharma - Paid Invoice
  const inv1 = await prisma.invoice.create({
    data: {
      id: 'inv-2026-001',
      invoiceNumber: 'INV-2026-CBSE-1001',
      studentId: 'stu-101',
      academicTerm: 'Term 2 (Quarterly Oct–Dec 2026)',
      issueDate: '2026-10-01',
      dueDate: '2026-10-25',
      totalAmount: 45000,
      paidAmount: 45000,
      status: 'paid',
      paymentDate: '2026-10-15',
      paymentMethod: 'UPI (Google Pay / PhonePe)',
      transactionId: 'UPI-REF-9812401928-SBIN',
      upiVpa: 'sunil.sharma@okhdfcbank',
      items: {
        create: [
          { name: 'Tuition Fee (Quarter 3)', category: 'Tuition', amount: 28500 },
          { name: 'Science & Computer Lab Fee', category: 'Laboratory', amount: 6500 },
          { name: 'Smart Class & Library Fee', category: 'Library', amount: 3500 },
          { name: 'CBSE Examination Fee', category: 'Examination', amount: 4000 },
          { name: 'Sports & Student Activities', category: 'Extracurricular', amount: 2500 },
        ],
      },
      payments: {
        create: [
          {
            id: 'pay-001',
            studentId: 'stu-101',
            amount: 45000,
            paymentMethod: 'UPI',
            transactionRef: 'UPI-REF-9812401928-SBIN',
            receiptNumber: 'RCP-2026-1001',
            paymentDate: '2026-10-15',
            recordedBy: 'Sunita Roy (Accounts)',
            notes: 'Full payment cleared via UPI payment gateway.',
          },
        ],
      },
    },
  });

  // Ananya Iyer - Paid Invoice
  await prisma.invoice.create({
    data: {
      id: 'inv-2026-002',
      invoiceNumber: 'INV-2026-CBSE-1002',
      studentId: 'stu-102',
      academicTerm: 'Term 2 (Quarterly Oct–Dec 2026)',
      issueDate: '2026-10-01',
      dueDate: '2026-10-25',
      totalAmount: 45000,
      paidAmount: 45000,
      status: 'paid',
      paymentDate: '2026-10-10',
      paymentMethod: 'Net Banking (HDFC Bank)',
      transactionId: 'TXN-HDFC-99128312',
      items: {
        create: [
          { name: 'Tuition Fee (Quarter 3)', category: 'Tuition', amount: 28500 },
          { name: 'Science & Computer Lab Fee', category: 'Laboratory', amount: 6500 },
          { name: 'Smart Class & Library Fee', category: 'Library', amount: 3500 },
          { name: 'CBSE Examination Fee', category: 'Examination', amount: 4000 },
          { name: 'Sports & Student Activities', category: 'Extracurricular', amount: 2500 },
        ],
      },
      payments: {
        create: [
          {
            id: 'pay-002',
            studentId: 'stu-102',
            amount: 45000,
            paymentMethod: 'Net Banking',
            transactionRef: 'TXN-HDFC-99128312',
            receiptNumber: 'RCP-2026-1002',
            paymentDate: '2026-10-10',
            recordedBy: 'Sunita Roy (Accounts)',
            notes: 'Payment verified via RTGS/NetBanking.',
          },
        ],
      },
    },
  });

  // Rohan Deshmukh - Partial Payment (Pending ₹25,000)
  await prisma.invoice.create({
    data: {
      id: 'inv-2026-003',
      invoiceNumber: 'INV-2026-CBSE-1003',
      studentId: 'stu-103',
      academicTerm: 'Term 2 (Quarterly Oct–Dec 2026)',
      issueDate: '2026-10-01',
      dueDate: '2026-10-31',
      totalAmount: 45000,
      paidAmount: 20000,
      status: 'pending',
      paymentDate: '2026-10-18',
      paymentMethod: 'Counter Cash',
      items: {
        create: [
          { name: 'Tuition Fee (Quarter 3)', category: 'Tuition', amount: 28500 },
          { name: 'Science & Computer Lab Fee', category: 'Laboratory', amount: 6500 },
          { name: 'Smart Class & Library Fee', category: 'Library', amount: 3500 },
          { name: 'CBSE Examination Fee', category: 'Examination', amount: 4000 },
          { name: 'Sports & Student Activities', category: 'Extracurricular', amount: 2500 },
        ],
      },
      payments: {
        create: [
          {
            id: 'pay-003',
            studentId: 'stu-103',
            amount: 20000,
            paymentMethod: 'Cash',
            transactionRef: 'CASH-REC-0192',
            receiptNumber: 'RCP-2026-1003-PART',
            paymentDate: '2026-10-18',
            recordedBy: 'Sunita Roy (Accounts)',
            notes: 'Installment 1 of 2 accepted at school counter.',
          },
        ],
      },
    },
  });

  // Diya Patel - Overdue Invoice
  await prisma.invoice.create({
    data: {
      id: 'inv-2026-004',
      invoiceNumber: 'INV-2026-CBSE-1004',
      studentId: 'stu-104',
      academicTerm: 'Term 2 (Quarterly Oct–Dec 2026)',
      issueDate: '2026-09-15',
      dueDate: '2026-10-10',
      totalAmount: 45000,
      paidAmount: 0,
      status: 'overdue',
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

  // ========================================================
  // 7. ACADEMIC GRADES & REPORT CARDS
  // ========================================================
  console.log('Creating Academic Grades...');
  // Aarav Sharma - Class 10-A
  await prisma.gradeRecord.create({
    data: {
      id: 'grd-stu-101',
      studentId: 'stu-101',
      academicYear: '2025–2026',
      term: 'Half-Yearly (Term 1)',
      gradeLevel: 'Class 10',
      section: 'A',
      overallGpa: 9.4,
      overallPercentage: 92.5,
      classRank: 2,
      totalStudentsInClass: 32,
      subjects: {
        create: [
          {
            subject: 'Physics',
            teacherName: 'Prof. Marcus Verma',
            credits: 4,
            quizScore: 94,
            assignmentScore: 92,
            midtermScore: 90,
            finalExamScore: 93,
            totalScore: 93,
            letterGrade: 'A1',
            gradePoint: 10,
            remarks: 'Exceptional comprehension of Electromagnetism & Optics.',
          },
          {
            subject: 'Mathematics',
            teacherName: 'Dr. Priya Nair',
            credits: 4,
            quizScore: 96,
            assignmentScore: 95,
            midtermScore: 91,
            finalExamScore: 94,
            totalScore: 94,
            letterGrade: 'A1',
            gradePoint: 10,
            remarks: 'Strong analytical reasoning and accurate problem-solving.',
          },
          {
            subject: 'Chemistry',
            teacherName: 'Dr. Ananya Sen',
            credits: 4,
            quizScore: 90,
            assignmentScore: 88,
            midtermScore: 92,
            finalExamScore: 91,
            totalScore: 91,
            letterGrade: 'A1',
            gradePoint: 10,
            remarks: 'Consistent lab work and thorough chemical equation balancing.',
          },
          {
            subject: 'English Communicative',
            teacherName: 'Mrs. Rohini Mehra',
            credits: 3,
            quizScore: 92,
            assignmentScore: 90,
            midtermScore: 91,
            finalExamScore: 92,
            totalScore: 92,
            letterGrade: 'A1',
            gradePoint: 10,
            remarks: 'Eloquent writing skills and articulate seminar presentations.',
          },
        ],
      },
    },
  });

  // Ananya Iyer - Class 10-A (Rank 1)
  await prisma.gradeRecord.create({
    data: {
      id: 'grd-stu-102',
      studentId: 'stu-102',
      academicYear: '2025–2026',
      term: 'Half-Yearly (Term 1)',
      gradeLevel: 'Class 10',
      section: 'A',
      overallGpa: 9.8,
      overallPercentage: 96.8,
      classRank: 1,
      totalStudentsInClass: 32,
      subjects: {
        create: [
          {
            subject: 'Physics',
            teacherName: 'Prof. Marcus Verma',
            credits: 4,
            quizScore: 98,
            assignmentScore: 97,
            midtermScore: 96,
            finalExamScore: 97,
            totalScore: 97,
            letterGrade: 'A1',
            gradePoint: 10,
            remarks: 'Outstanding conceptual clarity and research project.',
          },
          {
            subject: 'Mathematics',
            teacherName: 'Dr. Priya Nair',
            credits: 4,
            quizScore: 99,
            assignmentScore: 98,
            midtermScore: 96,
            finalExamScore: 98,
            totalScore: 98,
            letterGrade: 'A1',
            gradePoint: 10,
            remarks: 'Exemplary mathematical acumen across trigonometry and algebra.',
          },
        ],
      },
    },
  });

  // ========================================================
  // 8. ATTENDANCE ENTRIES
  // ========================================================
  console.log('Creating Attendance Records...');
  const dates = ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'];
  for (const date of dates) {
    await prisma.attendanceEntry.createMany({
      data: [
        {
          id: `att-stu-101-${date}`,
          studentId: 'stu-101',
          date,
          status: 'present',
          remarks: 'On time for Morning Assembly',
          markedBy: 'Prof. Marcus Verma',
        },
        {
          id: `att-stu-102-${date}`,
          studentId: 'stu-102',
          date,
          status: 'present',
          remarks: 'On time',
          markedBy: 'Prof. Marcus Verma',
        },
        {
          id: `att-stu-103-${date}`,
          studentId: 'stu-103',
          date,
          status: date === '2026-10-25' ? 'late' : 'present',
          remarks: date === '2026-10-25' ? 'Late arrival due to school bus breakdown' : 'Present',
          markedBy: 'Prof. Marcus Verma',
        },
        {
          id: `att-stu-104-${date}`,
          studentId: 'stu-104',
          date,
          status: date === '2026-10-27' ? 'absent' : 'present',
          remarks: date === '2026-10-27' ? 'Uninformed absence' : 'Present',
          markedBy: 'Prof. Marcus Verma',
        },
      ],
    });
  }

  // ========================================================
  // 9. TIMETABLE
  // ========================================================
  console.log('Creating Timetable Slots...');
  await prisma.timetableSlot.createMany({
    data: [
      {
        className: 'Class 10-A',
        period: 1,
        time: '08:30 AM - 09:15 AM',
        subject: 'Physics',
        teacher: 'Prof. Marcus Verma',
        room: 'Science Lab 2',
      },
      {
        className: 'Class 10-A',
        period: 2,
        time: '09:15 AM - 10:00 AM',
        subject: 'Mathematics',
        teacher: 'Dr. Priya Nair',
        room: 'Room 204',
      },
      {
        className: 'Class 10-A',
        period: 3,
        time: '10:00 AM - 10:45 AM',
        subject: 'Chemistry',
        teacher: 'Dr. Ananya Sen',
        room: 'Chem Lab 1',
      },
      {
        className: 'Class 10-A',
        period: 4,
        time: '11:15 AM - 12:00 PM',
        subject: 'English Communicative',
        teacher: 'Mrs. Rohini Mehra',
        room: 'Room 204',
      },
      {
        className: 'Class 10-A',
        period: 5,
        time: '12:00 PM - 12:45 PM',
        subject: 'Computer Applications',
        teacher: 'Mr. Arvind Saxena',
        room: 'IT Lab 3',
      },
    ],
  });

  // ========================================================
  // 10. ASSIGNMENTS & SUBMISSIONS
  // ========================================================
  console.log('Creating Assignments...');
  const assignment1 = await prisma.assignment.create({
    data: {
      id: 'asg-001',
      title: 'Electromagnetic Induction & Faraday’s Laws Practical Journal',
      description: 'Document laboratory experimental setup with circuit diagrams and error calculations. Submit as PDF or handwritten journal.',
      subject: 'Physics',
      teacherId: teacherProfile1.id,
      gradeLevel: 'Class 10',
      section: 'A',
      dueDate: '2026-11-04',
      maxMarks: 25,
      submissions: {
        create: [
          {
            id: 'sub-001',
            studentId: 'stu-101',
            content: 'Completed laboratory observation table and coil turn calculations. Plotted graph of induced EMF vs rate of flux change.',
            fileUrl: 'https://scholasync.in/cdn/assignments/stu-101-phys-em.pdf',
            marksObtained: 24,
            feedback: 'Excellent circuit analysis and neat graph plotting.',
            status: 'graded',
          },
          {
            id: 'sub-002',
            studentId: 'stu-102',
            content: 'Detailed laboratory write-up including Lenz law demonstrations and mathematical verification.',
            fileUrl: 'https://scholasync.in/cdn/assignments/stu-102-phys-em.pdf',
            marksObtained: 25,
            feedback: 'Flawless error propagation analysis.',
            status: 'graded',
          },
        ],
      },
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      id: 'asg-002',
      title: 'Quadratic Equations & Arithmetic Progression Problem Set',
      description: 'Solve CBSE past-year board questions (2020-2025) from Chapter 4 & 5. Show step-by-step discriminant derivations.',
      subject: 'Mathematics',
      teacherId: teacherProfile2.id,
      gradeLevel: 'Class 10',
      section: 'A',
      dueDate: '2026-11-08',
      maxMarks: 30,
      submissions: {
        create: [
          {
            id: 'sub-003',
            studentId: 'stu-101',
            content: 'All 20 problem sets solved with graphical method comparisons.',
            status: 'submitted',
          },
        ],
      },
    },
  });

  // ========================================================
  // 11. EXAM SCHEDULES
  // ========================================================
  console.log('Creating Exam Schedules...');
  await prisma.examSchedule.createMany({
    data: [
      {
        title: 'CBSE Pre-Board Examination 2026-27',
        term: 'Pre-Board / Term 2',
        academicYear: '2025–2026',
        gradeLevel: 'Class 10',
        section: 'A',
        subject: 'Physics & Science Theory',
        date: '2026-12-05',
        time: '09:00 AM - 12:00 PM',
        room: 'Examination Hall A',
        maxMarks: 80,
      },
      {
        title: 'CBSE Pre-Board Examination 2026-27',
        term: 'Pre-Board / Term 2',
        academicYear: '2025–2026',
        gradeLevel: 'Class 10',
        section: 'A',
        subject: 'Mathematics Standard',
        date: '2026-12-08',
        time: '09:00 AM - 12:00 PM',
        room: 'Examination Hall A',
        maxMarks: 80,
      },
      {
        title: 'CBSE Pre-Board Examination 2026-27',
        term: 'Pre-Board / Term 2',
        academicYear: '2025–2026',
        gradeLevel: 'Class 10',
        section: 'A',
        subject: 'English Language & Literature',
        date: '2026-12-11',
        time: '09:00 AM - 12:00 PM',
        room: 'Examination Hall A',
        maxMarks: 80,
      },
    ],
  });

  // ========================================================
  // 12. LEAVE APPLICATIONS
  // ========================================================
  console.log('Creating Leave Applications...');
  await prisma.leaveApplication.createMany({
    data: [
      {
        id: 'lv-001',
        studentId: 'stu-101',
        fromDate: '2026-11-01',
        toDate: '2026-11-03',
        reason: 'Representing school at Inter-State CBSE Science Olympiad in New Delhi.',
        status: 'approved',
        appliedAt: '2026-10-25',
        reviewedBy: 'Prof. Marcus Verma',
      },
      {
        id: 'lv-002',
        studentId: 'stu-103',
        fromDate: '2026-10-30',
        toDate: '2026-10-31',
        reason: 'Family emergency requiring travel to hometown.',
        status: 'pending',
        appliedAt: '2026-10-26',
      },
    ],
  });

  // ========================================================
  // 13. ANNOUNCEMENTS
  // ========================================================
  console.log('Creating Announcements...');
  await prisma.announcement.createMany({
    data: [
      {
        id: 'anc-001',
        title: 'CBSE Board Examination 2027 Registration & Admit Card Guidelines',
        category: 'Examination',
        content: 'All Class 10 and 12 scholars must verify their subject codes and spelling of parental names on the provisional admit roster by November 15, 2026.',
        author: 'Office of the Principal',
        date: '2026-10-25',
        priority: 'urgent',
        targetRole: 'all',
      },
      {
        id: 'anc-002',
        title: 'Term 2 Fee Clearance Notice (Quarter 3: Oct–Dec 2026)',
        category: 'Administrative',
        content: 'Parents and guardians are requested to clear pending quarterly tuition and laboratory vouchers before November 10 to avoid statutory late surcharges.',
        author: 'Accounts & Bursar Office',
        date: '2026-10-22',
        priority: 'high',
        targetRole: 'student',
      },
      {
        id: 'anc-003',
        title: 'National Mathematics Day Inter-School Symposium 2026',
        category: 'Academic',
        content: 'ScholaSync will host the Ramanujan Memorial Mathematical Olympiad on December 22. Class 9 to 12 students are invited to register with Dr. Priya Nair.',
        author: 'Department of Mathematics',
        date: '2026-10-18',
        priority: 'normal',
        targetRole: 'all',
      },
      {
        id: 'anc-004',
        title: 'Staff Faculty Meeting: NEP 2020 Holistic Progress Card (HPC) Implementation',
        category: 'Administrative',
        content: 'Mandatory meeting for all PGT and TGT educators in the Senate Conference Room on Friday at 3:30 PM.',
        author: 'Dr. Rajeshwar Sharma',
        date: '2026-10-26',
        priority: 'high',
        targetRole: 'teacher',
      },
    ],
  });

  // ========================================================
  // 14. AUDIT LOGS
  // ========================================================
  console.log('Creating Initial Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        action: 'SYSTEM_BOOTSTRAP',
        entity: 'system',
        performedBy: 'system@scholasync.in',
        role: 'admin',
        details: 'Initial database seeding and schema configuration established.',
      },
      {
        action: 'USER_LOGIN',
        entity: 'user',
        entityId: principalUser.id,
        performedBy: principalUser.email,
        role: 'admin',
        details: 'Principal authenticated from IP 192.168.1.100.',
      },
      {
        action: 'FEE_PAYMENT_VERIFIED',
        entity: 'invoice',
        entityId: inv1.id,
        performedBy: staffUser1.email,
        role: 'staff',
        details: 'Payment of ₹45,000 verified against receipt RCP-2026-1001 for student SCH-2024-0101.',
      },
    ],
  });

  console.log('\n[SUCCESS] ScholaSync MySQL Database Seed Complete!');
  console.log('--------------------------------------------------------');
  console.log('Test Credentials:');
  console.log('  1. Principal (Admin):  principal@scholasync.in         / admin123');
  console.log('  2. Staff (Finance):    finance.staff@scholasync.in     / staff123');
  console.log('  3. Staff (Admissions): admissions.staff@scholasync.in  / staff123');
  console.log('  4. Teacher:            marcus.verma@scholasync.in      / teacher123');
  console.log('  5. Student:            aarav.sharma@scholasync.in      / student123');
  console.log('--------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
