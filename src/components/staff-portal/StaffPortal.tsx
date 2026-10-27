import React, { useState } from 'react';
import {
  Student,
  Invoice,
  StaffTask,
  Announcement,
  Staff
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  DollarSign,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  QrCode,
  CreditCard,
  Building,
  UserPlus,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Smartphone
} from 'lucide-react';

interface StaffPortalProps {
  currentStaff: Staff | null;
  students: Student[];
  invoices: Invoice[];
  tasks: StaffTask[];
  announcements: Announcement[];
  onRefreshData: () => Promise<void>;
  onOpenReceipt: (invoice: Invoice) => void;
  onPayInvoice: (invoiceId: string, paymentMethod: string, amount?: number, upiVpa?: string, notes?: string) => Promise<Invoice>;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentStaff,
  students,
  invoices,
  tasks,
  announcements,
  onRefreshData,
  onOpenReceipt,
  onPayInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'fees' | 'admissions' | 'tasks' | 'notices' | 'profile'>('dashboard');

  // Filter states for fees
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>('all');
  const [feeSearch, setFeeSearch] = useState('');

  // Payment Recording Modal
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Counter Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // New Invoice Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceStudentId, setInvoiceStudentId] = useState(students[0]?.id || '');
  const [invoiceTerm, setInvoiceTerm] = useState('Term 2 (Quarterly Oct–Dec 2026)');
  const [invoiceDueDate, setInvoiceDueDate] = useState('2026-11-30');
  const [tuitionFee, setTuitionFee] = useState(28500);
  const [labFee, setLabFee] = useState(6500);
  const [libraryFee, setLibraryFee] = useState(3500);
  const [examFee, setExamFee] = useState(4000);
  const [sportsFee, setSportsFee] = useState(2500);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Admissions Modal
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('Class 10');
  const [newSection, setNewSection] = useState('A');
  const [newGender, setNewGender] = useState('Female');
  const [newDob, setNewDob] = useState('2009-05-15');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('+91 98000 11223');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('O+');
  const [newAadhaar, setNewAadhaar] = useState('XXXX-XXXX-1234');
  const [isSubmittingAdmit, setIsSubmittingAdmit] = useState(false);

  // Admissions Search
  const [admitSearch, setAdmitSearch] = useState('');

  // Computations
  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  const myTasks = tasks.filter((t) => !currentStaff || t.assignedToStaffId === currentStaff.id);
  const pendingTasksCount = myTasks.filter((t) => t.status !== 'completed').length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = feeStatusFilter === 'all' || inv.status === feeStatusFilter;
    const matchesSearch =
      inv.studentName.toLowerCase().includes(feeSearch.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(feeSearch.toLowerCase()) ||
      inv.admissionNo.toLowerCase().includes(feeSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredStudents = students.filter((s) => {
    const q = admitSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || s.gradeLevel.toLowerCase().includes(q);
  });

  const handleOpenPayment = (inv: Invoice) => {
    setActivePaymentInvoice(inv);
    const balance = inv.totalAmount - inv.paidAmount;
    setPaymentAmount(balance);
    setPaymentNotes('');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;

    const remaining = activePaymentInvoice.totalAmount - activePaymentInvoice.paidAmount;
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than ₹0');
      return;
    }
    if (paymentAmount > remaining) {
      alert(`Payment cannot exceed outstanding balance of ₹${remaining.toLocaleString('en-IN')}`);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const updated = await onPayInvoice(
        activePaymentInvoice.id,
        paymentMethod,
        Number(paymentAmount),
        upiVpa || undefined,
        paymentNotes || undefined
      );
      setActivePaymentInvoice(null);
      await onRefreshData();
      onOpenReceipt(updated);
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceStudentId) return;

    setIsCreatingInvoice(true);
    try {
      const items = [
        { name: 'Tuition Fee (Quarterly)', category: 'Tuition', amount: Number(tuitionFee) },
        { name: 'Science & Computer Lab Fee', category: 'Laboratory', amount: Number(labFee) },
        { name: 'Smart Class & Library Fee', category: 'Library', amount: Number(libraryFee) },
        { name: 'CBSE Examination Fee', category: 'Examination', amount: Number(examFee) },
        { name: 'Sports & Student Activities', category: 'Extracurricular', amount: Number(sportsFee) },
      ].filter((i) => i.amount > 0);

      await api.createInvoice({
        studentId: invoiceStudentId,
        academicTerm: invoiceTerm,
        dueDate: invoiceDueDate,
        items,
      });

      setIsInvoiceModalOpen(false);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName) return;

    setIsSubmittingAdmit(true);
    try {
      await api.createStudent({
        name: newStudentName,
        email: newStudentEmail || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@scholasync.in`,
        gradeLevel: newClassLevel,
        section: newSection,
        gender: newGender,
        dob: newDob,
        parentName: newParentName,
        parentPhone: newParentPhone,
        parentEmail: newParentEmail,
        address: newAddress,
        bloodGroup: newBloodGroup,
        aadhaarNumber: newAadhaar,
      });

      setIsAdmitModalOpen(false);
      setNewStudentName('');
      setNewParentName('');
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to enroll student');
    } finally {
      setIsSubmittingAdmit(false);
    }
  };

  const handleUpdateTask = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      await api.updateStaffTask(taskId, { status });
      await onRefreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Staff Identity Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-400 flex items-center justify-center font-bold text-2xl shrink-0">
              <Building className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
                <span>Administrative Staff Workspace</span>
                <span>·</span>
                <span className="font-mono text-slate-400">{currentStaff?.employeeId || 'EMP-ADM-008'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentStaff?.name || 'Sunita Roy'}
              </h1>
              <p className="mt-1 text-xs text-slate-300">
                {currentStaff?.designation || 'Accounts Officer & Bursar'} · {currentStaff?.department || 'Finance & Accounts'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Fee Voucher</span>
            </button>

            <button
              onClick={() => setIsAdmitModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-700"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Register Student</span>
            </button>
          </div>
        </div>

        {/* Subtabs */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap gap-2 text-xs font-medium">
          {[
            { id: 'dashboard', label: 'Overview & KPIs' },
            { id: 'fees', label: `Fee Ledger & Collection (${invoices.length})` },
            { id: 'admissions', label: `Student Admissions (${students.length})` },
            { id: 'tasks', label: `My Tasks (${myTasks.length})` },
            { id: 'notices', label: 'School Notices' },
            { id: 'profile', label: 'Staff Profile' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Fees Billed</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ₹{((totalBilled) / 1000).toFixed(0)}k
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {invoices.length} Active Vouchers
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Collected in Bank</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                ₹{((totalCollected) / 1000).toFixed(0)}k
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                {((totalCollected / (totalBilled || 1)) * 100).toFixed(1)}% Collection Rate
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Due</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700">
                ₹{((totalOutstanding) / 1000).toFixed(0)}k
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {overdueCount} Overdue Vouchers
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Assigned Tasks</span>
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {pendingTasksCount} Pending
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                Assigned by Principal
              </div>
            </div>
          </div>

          {/* Quick Tasks & Recent Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">My Operational Tasks</h3>
                  <p className="text-xs text-slate-500">Tasks delegated to you by the Principal</p>
                </div>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="text-xs font-semibold text-slate-900 hover:underline cursor-pointer"
                >
                  Manage All
                </button>
              </div>

              <div className="space-y-3">
                {myTasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No operational tasks assigned.</div>
                ) : (
                  myTasks.map((t) => (
                    <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                            {t.priority}
                          </span>
                          <span className="text-[11px] text-slate-500">Due: {t.dueDate}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{t.title}</div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{t.description}</p>
                      </div>

                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateTask(t.id, e.target.value as any)}
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 cursor-pointer shrink-0"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overdue Invoices for Collection Follow-up */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Defaulters & Pending Fees</h3>
                  <p className="text-xs text-slate-500">Scholars with outstanding balances</p>
                </div>
                <button
                  onClick={() => {
                    setFeeStatusFilter('overdue');
                    setActiveTab('fees');
                  }}
                  className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
                >
                  Filter Overdue
                </button>
              </div>

              <div className="space-y-3">
                {invoices.filter((i) => i.status !== 'paid').map((inv) => (
                  <div key={inv.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{inv.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.gradeLevel}-{inv.section} · {inv.admissionNo}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        ₹{(inv.totalAmount - inv.paidAmount).toLocaleString('en-IN')}
                      </div>
                      <button
                        onClick={() => handleOpenPayment(inv)}
                        className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: FEE MANAGEMENT MODULE */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Institutional Fee Management & Ledger</h2>
              <p className="text-xs text-slate-500">
                Record cash, UPI, or bank transfer payments, issue quarterly invoices, and generate official vouchers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={feeSearch}
                  onChange={(e) => setFeeSearch(e.target.value)}
                  placeholder="Search scholar or invoice..."
                  className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-48 sm:w-60 focus:outline-none"
                />
              </div>

              <select
                value={feeStatusFilter}
                onChange={(e) => setFeeStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">All Invoices</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>

              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Issue Invoice
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Scholar Details</th>
                  <th className="py-3 px-6">Term</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6">Billed</th>
                  <th className="py-3 px-6">Paid</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{inv.studentName}</div>
                      <div className="text-[11px] text-slate-500">{inv.gradeLevel}-{inv.section} · {inv.admissionNo}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-700">{inv.academicTerm}</td>
                    <td className="py-4 px-6 text-slate-600">{inv.dueDate}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6 font-semibold text-emerald-700">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'overdue'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        onClick={() => onOpenReceipt(inv)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                        title="View printable voucher"
                      >
                        <Printer className="w-3.5 h-3.5 inline mr-1" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ADMISSIONS & STUDENT RECORDS */}
      {activeTab === 'admissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Admissions & Enrollment Registry</h2>
              <p className="text-xs text-slate-500">
                Enroll incoming students, register parental contact dossiers, and allocate classes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={admitSearch}
                  onChange={(e) => setAdmitSearch(e.target.value)}
                  placeholder="Search students..."
                  className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-48 sm:w-60 focus:outline-none"
                />
              </div>

              <button
                onClick={() => setIsAdmitModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Enroll Student
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Scholar Name</th>
                  <th className="py-3 px-6">Admission No</th>
                  <th className="py-3 px-6">Class / Sec</th>
                  <th className="py-3 px-6">Roll</th>
                  <th className="py-3 px-6">Guardian Details</th>
                  <th className="py-3 px-6">Fee Status</th>
                  <th className="py-3 px-6">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.email}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">{s.admissionNo}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{s.gradeLevel}-{s.section}</td>
                    <td className="py-4 px-6 text-slate-700">{s.rollNo}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{s.parentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{s.parentPhone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.feeStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {s.feeStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{s.enrolledDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: MY ADMINISTRATIVE TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Operational Administrative Tasks</h2>
            <p className="text-xs text-slate-500">
              Tasks assigned by the Principal. Update status as work progresses.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTasks.map((t) => (
              <div key={t.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      {t.priority} Priority
                    </span>
                    <span className="text-[11px] font-bold capitalize text-slate-700">
                      ● {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">{t.title}</h4>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">{t.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">Due: <strong>{t.dueDate}</strong></span>
                  <div className="flex gap-1.5">
                    {t.status !== 'in_progress' && t.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateTask(t.id, 'in_progress')}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                      >
                        Start Work
                      </button>
                    )}
                    {t.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateTask(t.id, 'completed')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Complete Task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: NOTICES */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Official School Notices & Circulars</h2>
            <p className="text-xs text-slate-500">Directives from the Principal and Administration</p>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-bold text-slate-800">{ann.category}</span>
                  <span>{ann.date}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">{ann.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 6: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Staff Profile & Credentials</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Employee ID</span>
              <span className="font-mono font-bold text-slate-900">{currentStaff?.employeeId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Full Name</span>
              <span className="font-bold text-slate-900">{currentStaff?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-900">{currentStaff?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Department</span>
              <span className="text-slate-900">{currentStaff?.department}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Designation</span>
              <span className="text-slate-900">{currentStaff?.designation}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Phone</span>
              <span className="font-mono text-slate-900">{currentStaff?.phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {activePaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Fee Payment</h3>
            <p className="text-slate-500 mb-4">
              Recording payment for <strong>{activePaymentInvoice.studentName}</strong> ({activePaymentInvoice.admissionNo}).
            </p>

            <form onSubmit={handleProcessPayment} className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Billed:</span>
                  <span className="font-bold text-slate-900">₹{activePaymentInvoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-semibold text-emerald-700">₹{activePaymentInvoice.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-200 pt-1 mt-1">
                  <span>Remaining Due:</span>
                  <span className="text-amber-700">
                    ₹{(activePaymentInvoice.totalAmount - activePaymentInvoice.paidAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Amount to Pay (INR ₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={activePaymentInvoice.totalAmount - activePaymentInvoice.paidAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white"
                >
                  <option value="Counter Cash">Counter Cash (Official CBSE Receipt)</option>
                  <option value="UPI (PhonePe / Google Pay QR)">UPI / QR Voucher</option>
                  <option value="Bank Transfer (RTGS / NEFT)">Bank Transfer (RTGS / NEFT)</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="RuPay / Debit Card">RuPay / Debit Card</option>
                </select>
              </div>

              {paymentMethod.includes('UPI') && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parent UPI VPA (Optional)</label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. parent@okhdfcbank"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Transaction Notes / Voucher Ref</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional bank ref or cash counter note"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActivePaymentInvoice(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Recording...' : 'Record Payment & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE NEW INVOICE */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Issue Student Fee Voucher</h3>
            <p className="text-slate-500 mb-4">Generate quarterly fee obligation with standard CBSE line items.</p>

            <form onSubmit={handleGenerateInvoice} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Scholar</label>
                <select
                  required
                  value={invoiceStudentId}
                  onChange={(e) => setInvoiceStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNo} · {s.gradeLevel}-{s.section})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Academic Term</label>
                  <input
                    type="text"
                    required
                    value={invoiceTerm}
                    onChange={(e) => setInvoiceTerm(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block">Fee Breakdown (INR ₹)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500">Tuition Fee</label>
                    <input
                      type="number"
                      value={tuitionFee}
                      onChange={(e) => setTuitionFee(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">Lab & Computers</label>
                    <input
                      type="number"
                      value={labFee}
                      onChange={(e) => setLabFee(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">Library & Smartclass</label>
                    <input
                      type="number"
                      value={libraryFee}
                      onChange={(e) => setLibraryFee(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">CBSE Exam Fee</label>
                    <input
                      type="number"
                      value={examFee}
                      onChange={(e) => setExamFee(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500">Sports & Activities</label>
                    <input
                      type="number"
                      value={sportsFee}
                      onChange={(e) => setSportsFee(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[11px] text-slate-500">Total Obligation</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{(tuitionFee + labFee + libraryFee + examFee + sportsFee).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingInvoice}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isCreatingInvoice ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW STUDENT */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">New Scholar Admission & Enrollment</h3>
            <p className="text-slate-500 mb-4">Official CBSE registration and automatic account generation.</p>

            <form onSubmit={handleRegisterStudent} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scholar Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Tanvi Kulkarni"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Class Level</label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Section</label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  required
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  placeholder="Father / Mother / Legal Guardian"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parent Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={newBloodGroup}
                    onChange={(e) => setNewBloodGroup(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Permanent residential address..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmit}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdmit ? 'Enrolling...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
