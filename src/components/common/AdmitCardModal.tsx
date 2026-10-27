import React from 'react';
import { Student } from '../../types/index.ts';
import { School, Printer, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdmitCardModalProps {
  student: Student | null;
  onClose: () => void;
}

export const AdmitCardModal: React.FC<AdmitCardModalProps> = ({ student, onClose }) => {
  if (!student) return null;

  const isEligible = student.attendanceRate >= 75 && student.outstandingFee === 0;

  const examSchedule = [
    { code: '041', subject: 'Mathematics (Standard)', date: '18 Nov 2026', time: '10:30 AM - 01:30 PM' },
    { code: '086', subject: 'Science (Physics & Chemistry)', date: '21 Nov 2026', time: '10:30 AM - 01:30 PM' },
    { code: '184', subject: 'English Language & Literature', date: '25 Nov 2026', time: '10:30 AM - 01:30 PM' },
    { code: '087', subject: 'Social Science', date: '28 Nov 2026', time: '10:30 AM - 01:30 PM' },
    { code: '417', subject: 'Artificial Intelligence & Computer Apps', date: '02 Dec 2026', time: '10:30 AM - 12:30 PM' },
    { code: '002', subject: 'Hindi Course-A', date: '05 Dec 2026', time: '10:30 AM - 01:30 PM' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 no-print">
          <div className="text-xs text-slate-500 font-mono">
            CBSE Examination Admit Card · Academic Session 2025–2026
          </div>
          <div className="flex items-center gap-2">
            {isEligible && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Admit Card</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 text-sm font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isEligible ? (
          <div className="my-8 p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Admit Card Issue Withheld</span>
            </div>
            <p className="text-rose-700 leading-relaxed">
              In accordance with CBSE Examination Byelaw 13.2, candidate admit card can only be generated upon meeting both statutory criteria:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-rose-800 font-medium">
              <li>
                Minimum 75% class attendance required (Candidate current rate: {student.attendanceRate.toFixed(1)}%)
                {student.attendanceRate < 75 && <span className="text-rose-600 font-bold ml-1">[DISQUALIFIED]</span>}
              </li>
              <li>
                Full clearance of school quarterly tuition dues (Outstanding balance: ₹{student.outstandingFee.toLocaleString()})
                {student.outstandingFee > 0 && <span className="text-rose-600 font-bold ml-1">[DUES PENDING]</span>}
              </li>
            </ul>
            <p className="text-slate-600 text-[11px] pt-2">
              Please contact the Bursar Office or submit medical attendance condonation through the principal’s desk.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6 text-xs" id="admit-card-print-area">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <School className="w-6 h-6 text-slate-900" />
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  ScholaSync Public School, New Delhi
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                Affiliated to Central Board of Secondary Education (CBSE), New Delhi
              </p>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-2 bg-slate-100 py-1 rounded">
                CBSE Pre-Board & Annual Examination Admit Card / Hall Ticket (2025–26)
              </div>
            </div>

            {/* Candidate Details Grid */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="col-span-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Candidate Name</span>
                  <strong className="text-slate-900 text-sm">{student.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Scholar / Roll No</span>
                  <span className="font-mono text-slate-900 font-bold text-sm">
                    {student.admissionNo} (Roll #{student.rollNo})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Father / Guardian</span>
                  <span className="text-slate-800 font-medium">{student.parentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Class & Stream</span>
                  <span className="text-slate-800 font-medium">{student.gradeLevel} - Section {student.section}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Examination Center</span>
                  <span className="text-slate-800">Center #8142 - ScholaSync Campus Block A</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Attendance Verification</span>
                  <span className="text-emerald-700 font-mono font-bold">{student.attendanceRate.toFixed(1)}% (Verified & Approved)</span>
                </div>
              </div>

              {/* Photo Box */}
              <div className="col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded p-2 text-center bg-white">
                <div className="w-16 h-20 bg-slate-100 border border-slate-300 rounded flex items-center justify-center font-bold text-slate-600 text-lg">
                  {student.name.charAt(0)}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 uppercase font-mono">Verified Photo</span>
              </div>
            </div>

            {/* Exam Date Sheet */}
            <div>
              <div className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wider">
                Exam Paper Schedule & Room Allotment
              </div>
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-semibold text-slate-700">
                      <th className="py-2 px-3">Sub Code</th>
                      <th className="py-2 px-3">Subject Name</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Timings (IST)</th>
                      <th className="py-2 px-3 text-center">Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {examSchedule.map((exam) => (
                      <tr key={exam.code}>
                        <td className="py-2 px-3 font-bold text-slate-700">{exam.code}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">{exam.subject}</td>
                        <td className="py-2 px-3 text-slate-700">{exam.date}</td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">{exam.time}</td>
                        <td className="py-2 px-3 border-l border-slate-100 text-center text-slate-300">__________</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Candidate Rules */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
              <strong className="text-slate-800 block">General Instructions:</strong>
              <div>1. Entry inside examination center closes at 10:15 AM sharp. Late arrivals will not be permitted.</div>
              <div>2. Carry this verified Admit Card and school identity card on all exam days.</div>
              <div>3. Electronic gadgets, mobile phones, or smart watches are strictly prohibited in the hall.</div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 text-center text-[11px]">
              <div>
                <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800">
                  {student.name}
                </div>
                <div className="text-slate-500">Candidate Signature</div>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800">
                  Verified
                </div>
                <div className="text-slate-500">Parent / Guardian Signature</div>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-slate-800">
                  Dr. Rajeshwar Sharma
                </div>
                <div className="text-slate-500">Principal & Seal</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
