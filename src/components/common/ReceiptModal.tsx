import React from 'react';
import { Invoice } from '../../types/index.ts';
import { Printer, X, CheckCircle2, School } from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 no-print">
          <div className="text-xs text-slate-500 font-mono">
            Voucher Transaction: {invoice.transactionId || 'PENDING-CLEARANCE'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 text-sm font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="mt-6 space-y-6 text-slate-800" id="receipt-print-area">
          {/* Indian Institutional Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center shrink-0">
                <School className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  ScholaSync Public School
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Affiliated to CBSE, New Delhi (Affiliation No. 2130894 · School Code: 71204)
                </p>
                <p className="text-[11px] text-slate-400">
                  Institutional Area, Sector 62, Noida, Uttar Pradesh · GSTIN: 09AAACS1234F1Z5
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Fee Receipt
              </span>
              <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Date: {invoice.paymentDate || invoice.issueDate}
              </div>
            </div>
          </div>

          {/* Student & Bill Details in INR */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider mb-1">
                Student Credentials
              </div>
              <div className="font-bold text-slate-900 text-sm">{invoice.studentName}</div>
              <div className="text-slate-600 font-mono mt-0.5">
                Scholar / Admission No: {invoice.admissionNo}
              </div>
              <div className="text-slate-600 font-medium">
                Cohort: {invoice.gradeLevel} - Section {invoice.section}
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider mb-1">
                Fee Head & Mode
              </div>
              <div className="font-semibold text-slate-900">{invoice.academicTerm}</div>
              <div className="text-slate-600 font-mono mt-0.5">
                Due Date: {invoice.dueDate}
              </div>
              <div className="text-slate-600">
                Payment Channel: <strong>{invoice.paymentMethod || 'UPI (PhonePe / GPay)'}</strong>
              </div>
              {invoice.upiVpa && (
                <div className="text-slate-500 font-mono text-[11px]">
                  VPA: {invoice.upiVpa}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table in INR (₹) */}
          <div className="overflow-hidden border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-semibold text-slate-700">
                  <th className="py-2.5 px-4">Fee Head / Description</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4 text-right">Amount (INR ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">
                      {item.category}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-800 font-semibold">
                      ₹{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200 text-xs font-mono tabular-nums">
                  <td colSpan={2} className="py-2.5 px-4 font-bold text-slate-900 text-right font-sans">
                    Total Assessed Fee:
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    ₹{invoice.totalAmount.toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-emerald-50 text-xs font-mono tabular-nums text-emerald-800">
                  <td colSpan={2} className="py-2 px-4 font-bold text-right font-sans">
                    Amount Paid to Date:
                  </td>
                  <td className="py-2 px-4 text-right font-bold">
                    ₹{invoice.paidAmount.toLocaleString()}
                  </td>
                </tr>
                {invoice.totalAmount - invoice.paidAmount > 0 && (
                  <tr className="bg-rose-50 text-xs font-mono tabular-nums text-rose-800">
                    <td colSpan={2} className="py-2 px-4 font-bold text-right font-sans">
                      Remaining Dues Balance:
                    </td>
                    <td className="py-2 px-4 text-right font-bold">
                      ₹{(invoice.totalAmount - invoice.paidAmount).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Stamp & Signatures */}
          <div className="flex items-end justify-between pt-6 border-t border-slate-200">
            <div>
              {invoice.status === 'paid' ? (
                <div className="inline-flex items-center gap-2 border-2 border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>CBSE Bursar Office · Paid in Full</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 border-2 border-amber-600 text-amber-700 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
                  <span>Part Payment Acknowledged</span>
                </div>
              )}
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Ref UTR: {invoice.transactionId || 'BURSAR-CASH-LOG'}
              </div>
            </div>

            <div className="text-right">
              <div className="w-44 border-b border-slate-800 pb-1 mb-1 font-mono text-[11px] text-slate-700">
                Bursar / Cashier In-Charge
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                ScholaSync Accounts Section
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
