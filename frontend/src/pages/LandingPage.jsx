import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Bell,
  CheckCircle2,
  BarChart3,
  Boxes,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Lock,
} from 'lucide-react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async () => {
    try {
      await login('demo@medisync.local', 'DemoPassword123!');
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Medi<span className="text-teal-600">Sync</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-700 rounded-md border border-teal-200">
                BCA Major Project
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleQuickDemoLogin}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Quick Demo Login
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden bg-gradient-to-b from-teal-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800 text-xs sm:text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Smart Medication Management & Adherence Tracking System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Never miss a dose.<br />
            <span className="text-teal-600">Track, organize, and thrive</span> with MediSync.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A comprehensive web application designed for patients, seniors, and caregivers. Schedule daily doses, receive instant browser & in-app audio chime reminders, audit refill stock, and visualize adherence trends.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Start Free Today
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleQuickDemoLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              Explore Demo Account
            </button>
          </div>

          {/* Key Quick Stats Badge */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl font-bold text-teal-600">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Software Web Stack</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl font-bold text-slate-900">0 Re-Doses</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Duplicate Prevention</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl font-bold text-teal-600">Real-Time</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Stock Decrement</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl font-bold text-slate-900">Verified</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Drug Info Source</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-slate-50 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">Project Capabilities</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Engineered with Healthcare Standards & Modern Web Tech
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Built as a BCA major project focusing on database normalization, security, responsive UI, and medical safety principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Smart Reminders & Audio Chimes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Synthesized Web Audio API chimes and browser notifications warn you ahead of scheduled doses with full snooze and duplicate-prevention controls.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">One-Click Dose Actions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mark doses as <strong>Taken</strong>, <strong>Skip</strong>, or <strong>Snooze</strong>. MediSync saves exact timestamps to MySQL and guarantees no duplicate dose entries for the same occurrence.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Inventory Stock & Refill Alerts</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Stock decrements exclusively when a dose is marked <em>Taken</em>. If your inventory drops below your customizable threshold, warning alerts help you refill on time.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Adherence Analytics (Recharts)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Understand your medication habits with daily, weekly, and monthly adherence percentages, streak counts, and medicine breakdown charts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Verified Drug Reference Search</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Honest, pre-verified generic drug information derived from public US FDA / DailyMed labeling. Never fabricates clinical facts and presents clear citations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Role & Ownership Security</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bcrypt password hashing, parameterized SQL queries, JWT authentication, and row-level ownership checks prevent cross-patient data access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Educational Medical Disclaimer Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <MedicalDisclaimer />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
              +
            </div>
            <span className="text-white font-bold text-base">MediSync</span>
            <span className="text-slate-500">&bull; College BCA Major Project 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <button onClick={handleQuickDemoLogin} className="text-teal-400 hover:text-teal-300 transition-colors">
              Demo Patient Account
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

