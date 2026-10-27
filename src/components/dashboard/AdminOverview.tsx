import React, { useState } from 'react';
import { SchoolAnalytics, Student, Announcement, Role } from '../../types/index.ts';
import {
  Users,
  CalendarCheck,
  CreditCard,
  Award,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowUpRight,
  BookOpen,
  DollarSign,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface AdminOverviewProps {
  analytics: SchoolAnalytics | null;
  students: Student[];
  announcements: Announcement[];
  onNavigateTab: (tab: string) => void;
  onPostAnnouncement: (ann: Partial<Announcement>) => Promise<void>;
  currentRole: Role;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  analytics,
  students,
  announcements,
  onNavigateTab,
  onPostAnnouncement,
  currentRole,
}) => {
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Academic' | 'Administrative' | 'Examination' | 'Event'>('Academic');
  const [newPriority, setNewPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onPostAnnouncement({
        title: newTitle,
        content: newContent,
        category: newCategory,
        priority: newPriority,
        author: currentRole === 'teacher' ? 'Prof. Marcus Chen' : 'Office of Administration',
      });
      setNewTitle('');
      setNewContent('');
      setIsAnnounceModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const atRiskStudents = students.filter(s => s.attendanceRate < 75 || s.gpa < 2.5);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & High Level Status */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-1">
            Academic Operations · Spring Term 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Institutional Command & Student Success Center
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            Unified management of academic trajectories, daily digital attendance, student master records, and multi-term fee reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('grades')}
            className="px-4 py-2 text-xs font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            Open Gradebook
          </button>
          <button
            onClick={() => onNavigateTab('attendance')}
            className="px-4 py-2 text-xs font-medium bg-slate-800 text-white border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Daily Register
          </button>
          <button
            onClick={() => onNavigateTab('fees')}
            className="px-4 py-2 text-xs font-medium bg-slate-800 text-white border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            Fees Ledger
          </button>
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Enrolled */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Enrolled Students</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {analytics?.totalStudents ?? students.length}
            </span>
            <span className="text-xs text-slate-500">across 4 grade levels</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">100%</span>
            <span>active student records</span>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">School Attendance Average</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {analytics?.averageAttendance ?? 92.5}%
            </span>
            <span className="text-xs text-slate-500">threshold: 75%</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className={atRiskStudents.length > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
              {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''}
            </span>
            <span>flagged for low attendance</span>
          </div>
        </div>

        {/* Card 3: Fee Collection Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fee Collection Velocity (INR)</span>
            <CreditCard className="w-4 h-4 text-slate-700" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              ₹{(analytics?.totalFeesCollected ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">
              ({analytics?.collectionRate ?? 0}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-mono tabular-nums font-semibold text-slate-700">
              ₹{(analytics?.pendingFees ?? 0).toLocaleString()}
            </span>
            <span>pending collection</span>
          </div>
        </div>

        {/* Card 4: Academic Quality (Percentage) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">CBSE School Aggregate</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {analytics?.averageSchoolPercentage ?? 89.2}%
            </span>
            <span className="text-xs text-slate-500 font-mono">
              (CGPA {analytics?.averageSchoolGpa ?? 8.9})
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">+1.8%</span>
            <span>vs previous term average</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Grade Distribution & Attendance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Breakdown (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Academic Grade Tier Distribution</h2>
              <p className="text-xs text-slate-500">Based on composite weighted scores across all curriculum subjects</p>
            </div>
            <button
              onClick={() => onNavigateTab('grades')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View Gradebook</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {analytics?.gradeDistribution.map((item) => (
              <div key={item.grade}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">{item.grade}</span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">{item.count} students</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{item.percentage}%</span>
                  </div>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.grade.startsWith('A')
                        ? 'bg-emerald-600'
                        : item.grade.startsWith('B')
                        ? 'bg-blue-600'
                        : item.grade.startsWith('C')
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">Honor Roll (&gt;3.8 GPA)</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {students.filter(s => s.gpa >= 3.8).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Good Standing</div>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {students.filter(s => s.gpa >= 3.0 && s.gpa < 3.8).length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Academic Mentoring</div>
              <div className="text-lg font-bold text-amber-600 font-mono tabular-nums mt-0.5">
                {students.filter(s => s.gpa < 3.0).length}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Month-by-Month Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Attendance Stability</h2>
                <p className="text-xs text-slate-500">Monthly aggregate attendance percentage</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-3 mt-4">
              {analytics?.attendanceTrends.map((trend) => (
                <div key={trend.month} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600 w-10">{trend.month} 2026</span>
                  <div className="flex-1 mx-3 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full"
                      style={{ width: `${trend.attendanceRate}%` }}
                    />
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 w-12 text-right">
                    {trend.attendanceRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-700 mb-2">Statutory Compliance Policy</div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Minimum 75% attendance is required for term exam clearance. Automated parent notifications are queued for students at risk.
            </p>
          </div>
        </div>
      </div>

      {/* Announcements & Administrative Notices */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Official Announcements & Circulars</h2>
            <p className="text-xs text-slate-500">Broadcasts accessible to staff, faculty, students, and guardians</p>
          </div>
          <button
            onClick={() => setIsAnnounceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Circular</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {announcements.map((item) => (
            <div key={item.id} className="py-4 first:pt-2 last:pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{item.date}</span>
                    <span>·</span>
                    <span>{item.author}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {item.content}
                  </p>
                </div>

                {item.priority === 'high' && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 shrink-0">
                    High Priority
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Announcement Modal */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Post School Circular / Notice</h3>
            <p className="text-xs text-slate-500 mb-4">Broadcast an administrative or academic notice to the campus network.</p>

            <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule for Mid-Term Laboratory Practical Exams"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Examination">Examination</option>
                    <option value="Event">Campus Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detailed Content</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Provide complete guidelines, dates, requirements, or instructions..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
