import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Role } from '../../types/index.ts';
import {
  School,
  Lock,
  Mail,
  User,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const [identifier, setIdentifier] = useState('aarav.sharma@scholasync.in');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (role: Role) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await quickDemoLogin(role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* School Crest & Identity */}
        <div className="mx-auto w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 shadow-lg">
          <School className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
          ScholaSync Academy
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          CBSE Affiliated Senior Secondary School · Affiliation No. 2130894
        </p>
        <div className="mt-2 text-[11px] text-emerald-400 font-mono tracking-wider">
          ERP & Unified Student Information Portal
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white text-slate-900 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Sign In to Your School Account
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Access your personalized portal based on assigned institutional credentials.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Authentication Notice: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institutional Email or Scholar / Admission Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. SCH-2024-0101 or aarav.sharma@scholasync.in"
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Account Password</label>
                <span className="text-[11px] text-slate-400">Default: student123 / teacher123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className="w-full border border-slate-300 rounded-lg pl-9 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Persona Demo Access */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Or Try One-Click Role Testing
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Student */}
              <button
                type="button"
                onClick={() => handleDemoClick('student')}
                disabled={isSubmitting}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <GraduationCap className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">Student</span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium truncate">Aarav Sharma</div>
                <div className="text-[10px] text-slate-400 font-mono">Class 10-A</div>
              </button>

              {/* Faculty */}
              <button
                type="button"
                onClick={() => handleDemoClick('teacher')}
                disabled={isSubmitting}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">Faculty</span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium truncate">Prof. Marcus</div>
                <div className="text-[10px] text-slate-400">PGT Physics</div>
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => handleDemoClick('staff')}
                disabled={isSubmitting}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">Staff</span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium truncate">Sunita Roy</div>
                <div className="text-[10px] text-slate-400">Accounts & Bursar</div>
              </button>

              {/* Principal */}
              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                disabled={isSubmitting}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:border-slate-900 hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-xs text-slate-900">Principal</span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium truncate">Dr. Rajeshwar</div>
                <div className="text-[10px] text-slate-400">Head of School</div>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
            Data Privacy & FERPA/DPDP Act 2023 Compliant. Student transcripts and financial ledger vouchers are restricted to authenticated accounts.
          </div>
        </div>
      </div>
    </div>
  );
};
