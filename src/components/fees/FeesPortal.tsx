import React, { useState } from 'react';
import { Invoice, Student, Role } from '../../types/index.ts';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  FileText,
  Building,
  QrCode,
  Smartphone
} from 'lucide-react';

interface FeesPortalProps {
  invoices: Invoice[];
  students: Student[];
  currentRole: Role;
  onPayInvoice: (invoiceId: string, paymentMethod: string, amount?: number, upiVpa?: string) => Promise<Invoice>;
  onOpenReceipt: (invoice: Invoice) => void;
}

export const FeesPortal: React.FC<FeesPortalProps> = ({
  invoices,
  students,
  currentRole,
  onPayInvoice,
  onOpenReceipt,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('UPI (PhonePe / Google Pay QR)');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [upiVpa, setUpiVpa] = useState('parent@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);

  // Compute metrics in INR
  const totalBilled = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalOutstanding = totalBilled - totalCollected;
  const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesQuery =
      inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const handleOpenPayment = (inv: Invoice) => {
    setActivePaymentInvoice(inv);
    setCustomAmount(inv.totalAmount - inv.paidAmount);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice) return;

    setIsProcessing(true);
    try {
      const updated = await onPayInvoice(
        activePaymentInvoice.id,
        selectedMethod,
        Number(customAmount),
        upiVpa
      );
      setActivePaymentInvoice(null);
      onOpenReceipt(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            School Fee Reconciliation & Collections (INR ₹)
          </h1>
          <p className="text-xs text-slate-500">
            Quarterly fee billing ledger · UPI, Net Banking, and Bank Cashier Challan management
          </p>
        </div>
      </div>

      {/* Financial Summary Cards in INR (₹) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Fees Assessed</span>
            <span className="font-mono text-xs font-bold text-slate-400">INR</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ₹{totalBilled.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">Quarter 3 Assessment (2025–26)</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Fees Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            ₹{totalCollected.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700 font-mono">{collectionRate}%</span> recovery efficiency
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Outstanding Dues</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">Pending parent clearances</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overdue Notices</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {overdueCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Exceeded due grace period</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({invoices.filter((i) => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === 'paid'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paid ({invoices.filter((i) => i.status === 'paid').length})
          </button>
          <button
            onClick={() => setFilterStatus('overdue')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === 'overdue'
                ? 'bg-white text-rose-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue ({invoices.filter((i) => i.status === 'overdue').length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, student name, scholar ID..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Invoice # & Term</th>
                <th className="py-3 px-4">Student & Class</th>
                <th className="py-3 px-4">Fee Structure Breakdown</th>
                <th className="py-3 px-4 text-right">Total Fee (₹)</th>
                <th className="py-3 px-4 text-right">Paid / Balance</th>
                <th className="py-3 px-4">Clearance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.map((inv) => {
                const remaining = inv.totalAmount - inv.paidAmount;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono tabular-nums font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Due: {inv.dueDate}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {inv.admissionNo} · {inv.gradeLevel}-{inv.section}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[11px] text-slate-600 space-y-0.5 font-mono tabular-nums">
                        {inv.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="text-slate-400">·</span>
                            <span>{item.name}:</span>
                            <span className="font-bold text-slate-800">₹{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="text-emerald-700 font-bold">
                        ₹{inv.paidAmount.toLocaleString()}
                      </div>
                      {remaining > 0 && (
                        <div className="text-[11px] text-rose-600 font-semibold">
                          Bal: ₹{remaining.toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {inv.status === 'paid' && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Cleared
                        </span>
                      )}
                      {inv.status === 'pending' && (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Dues
                        </span>
                      )}
                      {inv.status === 'overdue' && (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Overdue
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <span>Clear Due</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenReceipt(inv)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          title="Official Indian Fee Voucher"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Payment Modal */}
      {activePaymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Process Student Fee Clearance (INR ₹)
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">
                  Invoice {activePaymentInvoice.invoiceNumber} · {activePaymentInvoice.studentName}
                </div>
              </div>
              <button
                onClick={() => setActivePaymentInvoice(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 my-4">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Assessed Fee Total:</span>
                  <span className="font-bold text-slate-900">
                    ₹{activePaymentInvoice.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Already Paid:</span>
                  <span>-₹{activePaymentInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
                  <span>Dues Balance:</span>
                  <span className="text-rose-600">
                    ₹{(activePaymentInvoice.totalAmount - activePaymentInvoice.paidAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="UPI (PhonePe / Google Pay QR)">UPI QR Code (PhonePe / Google Pay / BHIM)</option>
                  <option value="Net Banking (NEFT / RTGS)">Net Banking (NEFT / RTGS / IMPS)</option>
                  <option value="RuPay / Debit Card">RuPay / Visa / MasterCard Debit</option>
                  <option value="School Bursar Counter Cash">School Bursar Counter (Cash Receipt)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount to Clear (INR ₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={activePaymentInvoice.totalAmount - activePaymentInvoice.paidAmount}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 font-mono tabular-nums text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActivePaymentInvoice(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  {isProcessing ? 'Processing...' : `Confirm Payment of ₹${customAmount.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
