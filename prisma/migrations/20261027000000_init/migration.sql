-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'teacher', 'student', 'staff') NOT NULL DEFAULT 'student',
    `scholarNo` VARCHAR(64) NULL,
    `designation` VARCHAR(128) NULL,
    `phone` VARCHAR(32) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_scholarNo_key`(`scholarNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `admissionNo` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `gradeLevel` VARCHAR(64) NOT NULL,
    `section` VARCHAR(32) NOT NULL,
    `rollNo` INTEGER NOT NULL,
    `gender` VARCHAR(16) NOT NULL,
    `dob` VARCHAR(32) NOT NULL,
    `parentName` VARCHAR(191) NOT NULL,
    `parentPhone` VARCHAR(32) NOT NULL,
    `parentEmail` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `bloodGroup` VARCHAR(8) NOT NULL,
    `gpa` DOUBLE NOT NULL DEFAULT 8.5,
    `percentage` DOUBLE NOT NULL DEFAULT 85.0,
    `attendanceRate` DOUBLE NOT NULL DEFAULT 100.0,
    `feeStatus` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `outstandingFee` INTEGER NOT NULL DEFAULT 45000,
    `enrolledDate` VARCHAR(32) NOT NULL,
    `aadhaarNumber` VARCHAR(32) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_userId_key`(`userId`),
    UNIQUE INDEX `students_admissionNo_key`(`admissionNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `employeeId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `department` VARCHAR(128) NOT NULL,
    `designation` VARCHAR(128) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `subjects` TEXT NOT NULL,
    `assignedClasses` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teachers_userId_key`(`userId`),
    UNIQUE INDEX `teachers_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `employeeId` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `department` VARCHAR(128) NOT NULL,
    `designation` VARCHAR(128) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `staff_userId_key`(`userId`),
    UNIQUE INDEX `staff_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_permissions` (
    `id` VARCHAR(36) NOT NULL,
    `staffId` VARCHAR(36) NOT NULL,
    `module` VARCHAR(64) NOT NULL,
    `canRead` BOOLEAN NOT NULL DEFAULT true,
    `canWrite` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `staff_permissions_staffId_module_key`(`staffId`, `module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_tasks` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `assignedToStaffId` VARCHAR(36) NOT NULL,
    `priority` VARCHAR(32) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `dueDate` VARCHAR(32) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grade_records` (
    `id` VARCHAR(36) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `academicYear` VARCHAR(32) NOT NULL,
    `term` VARCHAR(64) NOT NULL,
    `gradeLevel` VARCHAR(64) NOT NULL,
    `section` VARCHAR(32) NOT NULL,
    `overallGpa` DOUBLE NOT NULL,
    `overallPercentage` DOUBLE NOT NULL,
    `classRank` INTEGER NOT NULL,
    `totalStudentsInClass` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_grades` (
    `id` VARCHAR(36) NOT NULL,
    `gradeRecordId` VARCHAR(36) NOT NULL,
    `subject` VARCHAR(128) NOT NULL,
    `teacherName` VARCHAR(191) NOT NULL,
    `credits` INTEGER NOT NULL,
    `quizScore` INTEGER NOT NULL,
    `assignmentScore` INTEGER NOT NULL,
    `midtermScore` INTEGER NOT NULL,
    `finalExamScore` INTEGER NOT NULL,
    `totalScore` INTEGER NOT NULL,
    `letterGrade` VARCHAR(8) NOT NULL,
    `gradePoint` INTEGER NOT NULL,
    `remarks` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_entries` (
    `id` VARCHAR(36) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `date` VARCHAR(32) NOT NULL,
    `status` VARCHAR(16) NOT NULL,
    `remarks` VARCHAR(255) NULL,
    `markedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `attendance_entries_studentId_date_key`(`studentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(36) NOT NULL,
    `invoiceNumber` VARCHAR(64) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `academicTerm` VARCHAR(128) NOT NULL,
    `issueDate` VARCHAR(32) NOT NULL,
    `dueDate` VARCHAR(32) NOT NULL,
    `totalAmount` INTEGER NOT NULL,
    `paidAmount` INTEGER NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `paymentDate` VARCHAR(32) NULL,
    `transactionId` VARCHAR(128) NULL,
    `paymentMethod` VARCHAR(128) NULL,
    `upiVpa` VARCHAR(128) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_invoiceNumber_key`(`invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_items` (
    `id` VARCHAR(36) NOT NULL,
    `invoiceId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `amount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_payments` (
    `id` VARCHAR(36) NOT NULL,
    `invoiceId` VARCHAR(36) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `amount` INTEGER NOT NULL,
    `paymentMethod` VARCHAR(64) NOT NULL,
    `transactionRef` VARCHAR(128) NULL,
    `receiptNumber` VARCHAR(64) NOT NULL,
    `paymentDate` VARCHAR(32) NOT NULL,
    `recordedBy` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `fee_payments_receiptNumber_key`(`receiptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_applications` (
    `id` VARCHAR(36) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `fromDate` VARCHAR(32) NOT NULL,
    `toDate` VARCHAR(32) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `appliedAt` VARCHAR(32) NOT NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcements` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `content` TEXT NOT NULL,
    `author` VARCHAR(191) NOT NULL,
    `date` VARCHAR(32) NOT NULL,
    `priority` VARCHAR(16) NOT NULL DEFAULT 'normal',
    `targetRole` VARCHAR(32) NOT NULL DEFAULT 'all',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timetable_slots` (
    `id` VARCHAR(36) NOT NULL,
    `className` VARCHAR(64) NOT NULL,
    `period` INTEGER NOT NULL,
    `time` VARCHAR(64) NOT NULL,
    `subject` VARCHAR(128) NOT NULL,
    `teacher` VARCHAR(191) NOT NULL,
    `room` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `subject` VARCHAR(128) NOT NULL,
    `teacherId` VARCHAR(36) NULL,
    `gradeLevel` VARCHAR(64) NOT NULL,
    `section` VARCHAR(32) NOT NULL,
    `dueDate` VARCHAR(32) NOT NULL,
    `maxMarks` INTEGER NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_submissions` (
    `id` VARCHAR(36) NOT NULL,
    `assignmentId` VARCHAR(36) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `content` TEXT NULL,
    `fileUrl` VARCHAR(255) NULL,
    `marksObtained` DOUBLE NULL,
    `feedback` TEXT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'submitted',

    UNIQUE INDEX `assignment_submissions_assignmentId_studentId_key`(`assignmentId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_schedules` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `term` VARCHAR(64) NOT NULL,
    `academicYear` VARCHAR(32) NOT NULL,
    `gradeLevel` VARCHAR(64) NOT NULL,
    `section` VARCHAR(32) NULL,
    `subject` VARCHAR(128) NOT NULL,
    `date` VARCHAR(32) NOT NULL,
    `time` VARCHAR(64) NOT NULL,
    `room` VARCHAR(64) NOT NULL,
    `maxMarks` INTEGER NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `action` VARCHAR(128) NOT NULL,
    `entity` VARCHAR(64) NOT NULL,
    `entityId` VARCHAR(64) NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `role` VARCHAR(32) NOT NULL,
    `details` TEXT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_permissions` ADD CONSTRAINT `staff_permissions_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_tasks` ADD CONSTRAINT `staff_tasks_assignedToStaffId_fkey` FOREIGN KEY (`assignedToStaffId`) REFERENCES `staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grade_records` ADD CONSTRAINT `grade_records_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_grades` ADD CONSTRAINT `subject_grades_gradeRecordId_fkey` FOREIGN KEY (`gradeRecordId`) REFERENCES `grade_records`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_entries` ADD CONSTRAINT `attendance_entries_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_items` ADD CONSTRAINT `fee_items_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payments` ADD CONSTRAINT `fee_payments_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payments` ADD CONSTRAINT `fee_payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_applications` ADD CONSTRAINT `leave_applications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_submissions` ADD CONSTRAINT `assignment_submissions_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_submissions` ADD CONSTRAINT `assignment_submissions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

