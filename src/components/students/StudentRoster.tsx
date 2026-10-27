import React, { useState } from 'react';
import { Student, Role } from '../../types/index.ts';
import {
  Search,
  Plus,
  Filter,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
  FileText
} from 'lucide-react';

interface StudentRosterProps {
  students: Student[];
  currentRole: Role;
  onAddStudent: (payload: Partial<Student>) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onSelectStudentToInspect: (student: Student) => void;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({
  students,
  currentRole,
  onAddStudent,
  onDeleteStudent,
  onSelectStudentToInspect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeStudentModal, setActiveStudentModal] = useState<Student | null>(null);

  // Form states for adding student
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gradeLevel: 'Class 10',
    section: 'A',
    rollNo: 1,
    gender: 'Female' as 'Female' | 'Male' | 'Other',
    dob: '2008-05-15',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    bloodGroup: 'O+',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesQuery =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = selectedGrade === 'all' || student.gradeLevel === selectedGrade;
    const matchesSection = selectedSection === 'all' || student.section === selectedSection;

    return matchesQuery && matchesGrade && matchesSection;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSaving(true);
    try {
      await onAddStudent({
        ...formData,
        rollNo: Number(formData.rollNo),
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        gradeLevel: 'Grade 10',
        section: 'A',
        rollNo: 1,
        gender: 'Female',
        dob: '2008-05-15',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        address: '',
        bloodGroup: 'O+',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Student Directory & Academic Roster</h1>
          <p className="text-xs text-slate-500">
            {students.length} active registered students · Filter by cohort, division, or admission roll
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, admission no, or student email..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Grade:</span>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Cohorts</option>
            <option value="Class 10">Class 10</option>
            <option value="Class 11">Class 11</option>
            <option value="Class 12">Class 12</option>
          </select>
        </div>

        {/* Section Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Section:</span>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="Science">Section Science</option>
          </select>
        </div>
      </div>

      {/* High Density Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-medium text-slate-600">
                <th className="py-3 px-4">Student & ID</th>
                <th className="py-3 px-4">Class / Section</th>
                <th className="py-3 px-4 text-center">Roll No</th>
                <th className="py-3 px-4 text-right">GPA (4.0)</th>
                <th className="py-3 px-4 text-right">Attendance</th>
                <th className="py-3 px-4">Fee Clearance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No student records matching current search parameters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isLowAttendance = student.attendanceRate < 75;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-default"
                    >
                      {/* Name & Admission */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                              {student.admissionNo} · {student.gender}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {student.gradeLevel} - {student.section}
                      </td>

                      {/* Roll No */}
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-slate-800">
                        #{student.rollNo}
                      </td>

                      {/* GPA */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {student.gpa.toFixed(2)}
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`font-mono tabular-nums font-semibold ${
                              isLowAttendance ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {student.attendanceRate.toFixed(1)}%
                          </span>
                          {isLowAttendance && (
                            <span className="text-[10px] text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-medium">
                              Low
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fee Status (Zero-Pill: Clean unboxed text) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {student.feeStatus === 'paid' && (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Paid
                            </span>
                          )}
                          {student.feeStatus === 'pending' && (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Pending (₹{student.outstandingFee.toLocaleString()})
                            </span>
                          )}
                          {student.feeStatus === 'overdue' && (
                            <span className="text-rose-700 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Overdue (₹{student.outstandingFee.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveStudentModal(student);
                              onSelectStudentToInspect(student);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="View Full Student Record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {currentRole === 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${student.name} from school records?`)) {
                                  onDeleteStudent(student.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Student Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      {activeStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                  {activeStudentModal.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{activeStudentModal.name}</h2>
                  <div className="text-xs text-slate-500 font-mono tabular-nums">
                    {activeStudentModal.admissionNo} · {activeStudentModal.gradeLevel} - {activeStudentModal.section} · Roll #{activeStudentModal.rollNo}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveStudentModal(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6 text-xs">
              {/* Snapshot metrics */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="text-slate-500 font-medium">Cumulative GPA</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {activeStudentModal.gpa.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">Scale of 4.00</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Attendance Rate</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {activeStudentModal.attendanceRate.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500">Min requirement: 75%</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Fee Balance</div>
                  <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    ₹{activeStudentModal.outstandingFee.toLocaleString()}
                  </div>
                  <div className="text-[11px] capitalize text-slate-500">{activeStudentModal.feeStatus} status</div>
                </div>
              </div>

              {/* Personal & Academic Details */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Student & Guardian Dossier</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Student Email: <strong>{activeStudentModal.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Date of Birth: <strong>{activeStudentModal.dob}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Parent / Guardian: <strong>{activeStudentModal.parentName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Guardian Phone: <strong>{activeStudentModal.parentPhone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Residential Address: <strong>{activeStudentModal.address}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveStudentModal(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Enroll New Student</h2>
            <p className="text-xs text-slate-500 mb-4">
              Add student to school master register and auto-generate initial tuition invoice.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-medium text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maya Hernandez"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-medium text-slate-700 mb-1">Student Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="maya.hernandez@scholasync.edu"
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Grade Level</label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e: any) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-semibold text-slate-800 mb-2">Guardian Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Parent / Guardian Name</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="e.g. Carlos Hernandez"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Guardian Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Postal Code"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isSaving ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
