import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Pill,
  ArrowRight,
  TrendingUp,
  Boxes,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/StatCard';
import DoseActionModal from '../components/DoseActionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { checkReminders } = useReminders();

  const [todayData, setTodayData] = useState(null);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDose, setSelectedDose] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, analyticsRes] = await Promise.all([
        api.getTodaySchedule(),
        api.getAdherenceAnalytics(7),
      ]);

      if (scheduleRes.success) {
        setTodayData(scheduleRes);
      }

      if (analyticsRes.success && analyticsRes.dailyTrend) {
        setWeeklyTrend(analyticsRes.dailyTrend);
      }
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenAction = (doseItem) => {
    setSelectedDose(doseItem);
    setIsModalOpen(true);
  };

  const handleActionSuccess = () => {
    fetchDashboardData();
    checkReminders();
  };

  if (loading && !todayData) {
    return <LoadingSpinner message="Loading your daily schedule & health metrics..." />;
  }

  const summary = todayData?.summary || {
    totalScheduled: 0,
    takenCount: 0,
    skippedCount: 0,
    snoozedCount: 0,
    pendingCount: 0,
    adherenceRate: 0,
  };

  const scheduleList = todayData?.schedule || [];
  const nextReminder = todayData?.nextReminder;
  const lowStockItems = todayData?.lowStockItems || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Patient'}!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here is your daily medication overview and adherence progress for today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/schedule"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            Schedule View
          </Link>
        </div>
      </div>

      {/* Sample Demo Dataset Notice if demo account */}
      {user?.email === 'demo@medisync.local' && (
        <div className="px-4 py-2 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>
              <strong>Sample Demonstration Mode:</strong> Displaying pre-seeded demo records for academic project evaluation.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold text-[11px]">
            Sample Data
          </span>
        </div>
      )}

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Scheduled"
          value={summary.totalScheduled}
          subtitle="Doses planned today"
          icon={Calendar}
          color="teal"
        />
        <StatCard
          title="Taken"
          value={summary.takenCount}
          subtitle="Confirmed taken"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={summary.pendingCount}
          subtitle="Awaiting dose action"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Skipped"
          value={summary.skippedCount}
          subtitle="Logged skipped"
          icon={XCircle}
          color="slate"
        />
        <StatCard
          title="Adherence"
          value={`${summary.adherenceRate}%`}
          subtitle="Today's compliance"
          icon={TrendingUp}
          color={summary.adherenceRate >= 80 ? 'emerald' : summary.adherenceRate >= 50 ? 'amber' : 'rose'}
          badge={summary.adherenceRate >= 80 ? 'Good' : 'Needs attention'}
        />
      </div>

      {/* Next Upcoming Reminder Hero Box */}
      {nextReminder ? (
        <div className="bg-gradient-to-r from-teal-500 to-teal-700 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs text-white">
              <Clock className="w-3.5 h-3.5" />
              Next Scheduled Dose &bull; {nextReminder.scheduledTime}
            </div>
            <h3 className="text-2xl font-extrabold text-white mt-2">
              {nextReminder.medicineName}
            </h3>
            <p className="text-teal-100 text-sm">
              Dosage: <strong>{nextReminder.dosage}</strong> ({nextReminder.form}) &bull; Instructions: {nextReminder.instructions || 'Standard'}
            </p>
            {nextReminder.isOverdue && (
              <p className="text-rose-200 text-xs font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                This scheduled dose time has passed. Please take action.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => handleOpenAction(nextReminder)}
              className="w-full md:w-auto px-6 py-3 bg-white text-teal-800 hover:bg-teal-50 font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Log Dose Action
            </button>
          </div>
        </div>
      ) : scheduleList.length > 0 && summary.pendingCount === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">All doses completed for today!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Great job maintaining 100% adherence today. Your next doses will appear tomorrow.
            </p>
          </div>
        </div>
      ) : null}

      {/* Two Column Layout: Today's Timeline + Analytics / Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Doses List (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Today's Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological dose schedule for today</p>
            </div>
            <Link
              to="/medicines/new"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Medicine
            </Link>
          </div>

          {scheduleList.length === 0 ? (
            <EmptyState
              title="No medications scheduled today"
              description="You have no active medications configured for today. Add a new medication to get started."
              actionText="Add Medication"
              actionLink="/medicines/new"
            />
          ) : (
            <div className="space-y-3">
              {scheduleList.map((item, idx) => {
                const isTaken = item.status === 'taken';
                const isSkipped = item.status === 'skipped';
                const isSnoozed = item.status === 'snoozed';
                const isPending = item.status === 'pending';

                return (
                  <div
                    key={`${item.medicineId}_${item.scheduledTime}_${idx}`}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all gap-3 ${
                      isTaken
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isSkipped
                        ? 'bg-slate-50 border-slate-200 opacity-70'
                        : isSnoozed
                        ? 'bg-amber-50/50 border-amber-200'
                        : item.isOverdue
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-200/80 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs shrink-0 border border-slate-200/60">
                        <Clock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                        <span>{item.scheduledTime}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.medicineName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {item.dosage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.instructions || 'Standard administration'} &bull; Form: {item.form}
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {isTaken ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Taken
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                          <XCircle className="w-3.5 h-3.5" />
                          Skipped
                        </span>
                      ) : isSnoozed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          Snoozed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Pending
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenAction(item)}
                        className="px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors"
                      >
                        {isTaken ? 'Edit' : 'Take Action'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Weekly Adherence Mini-Chart & Low Stock Alerts */}
        <div className="space-y-6">
          {/* Weekly Adherence Mini Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Weekly Adherence</h3>
                <p className="text-xs text-slate-500 mt-0.5">7-Day compliance trend</p>
              </div>
              <Link to="/analytics" className="text-xs font-semibold text-teal-700 hover:underline">
                View All
              </Link>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dayName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Adherence']}
                    labelFormatter={(label, items) => items[0]?.payload?.displayDate || label}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="adherenceRate"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#adherenceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Items Warning Box */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Inventory & Refills</h3>
              </div>
              <Link to="/inventory" className="text-xs font-semibold text-teal-700 hover:underline">
                Manage
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 text-xs text-teal-800">
                All medications are currently above their refill threshold.
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200/70"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{med.name}</span>
                      <span className="text-[11px] text-amber-800">
                        Only <strong>{med.quantity}</strong> remaining (Refill threshold: {med.refill_threshold})
                      </span>
                    </div>
                    <Link
                      to="/inventory"
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Refill
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dose Action Modal */}
      <DoseActionModal
        isOpen={isModalOpen}
        doseItem={selectedDose}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}

