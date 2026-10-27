import React from 'react';
import { User as UserType } from '../types/index.ts';
import { School, LogOut, RefreshCw, ShieldCheck, UserCheck, GraduationCap, Building } from 'lucide-react';

interface HeaderProps {
  currentUser: UserType | null;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onResetData: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onTabChange,
  onResetData,
  isResetting,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const principalNavItems = [
    { id: 'overview', label: 'Command Center' },
    { id: 'students', label: 'Student Directory' },
    { id: 'grades', label: 'CBSE Gradebook' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'fees', label: 'Fees & Invoices (₹)' },
    { id: 'performance', label: 'Analytics' },
  ];

  const staffNavItems = [
    { id: 'overview', label: 'Staff Dashboard' },
    { id: 'fees', label: 'Fee Ledger & Billing' },
    { id: 'admissions', label: 'Student Admissions' },
    { id: 'tasks', label: 'Administrative Tasks' },
  ];

  const navItems = isAdmin ? principalNavItems : isStaff ? staffNavItems : [];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Wordmark & Affiliation */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter">
              <School className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                ScholaSync Academy
              </span>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
                CBSE Affiliation #2130894
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation (for Principal & Staff) */}
          {navItems.length > 0 && (
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    activeTab === item.id
                      ? 'border-slate-900 text-slate-900 font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Zone 3: Logged-in User Profile & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 py-1 px-2.5 rounded-lg text-xs">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : currentUser.role === 'staff' ? (
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                  ) : currentUser.role === 'teacher' ? (
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize font-medium">
                    {currentUser.role === 'admin'
                      ? 'Principal / Super Administrator'
                      : currentUser.role === 'staff'
                      ? currentUser.designation || 'Administrative Staff'
                      : currentUser.role === 'teacher'
                      ? currentUser.designation || 'Faculty Member'
                      : `Scholar ${currentUser.scholarNo || ''}`}
                  </div>
                </div>
              </div>
            )}

            {/* Reset sample data button (Only visible to Principal/Admin) */}
            {isAdmin && (
              <button
                onClick={onResetData}
                disabled={isResetting}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset Database to Clean CBSE Baseline"
              >
                <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-slate-700' : ''}`} />
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {navItems.length > 0 && (
          <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-slate-100 text-xs">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
