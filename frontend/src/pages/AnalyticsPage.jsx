import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState(7); // 7 | 14 | 30
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAdherenceAnalytics(timeframe);
      if (res.success) {
        setAnalyticsData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  if (loading && !analyticsData) {
    return <LoadingSpinner message="Calculating adherence analytics from stored records..." />;
  }

  const overall = analyticsData?.overall || {
    totalScheduled: 0,
    totalTaken: 0,
    totalSkipped: 0,
    totalMissed: 0,
    adherenceRate: 0,
    currentStreakDays: 0,
  };

  const dailyTrend = analyticsData?.dailyTrend || [];
  const medicineBreakdown = analyticsData?.medicineBreakdown || [];
  const timeOfDayBreakdown = analyticsData?.timeOfDayBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Adherence Analytics & Compliance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data-driven insights calculated from your database records across daily, weekly, and monthly periods.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          {[
            { label: 'Past 7 Days', days: 7 },
            { label: 'Past 14 Days', days: 14 },
            { label: 'Past 30 Days', days: 30 },
          ].map((t) => (
            <button
              key={t.days}
              onClick={() => setTimeframe(t.days)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === t.days
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Adherence"
          value={`${overall.adherenceRate}%`}
          subtitle={`Across past ${timeframe} days`}
          icon={TrendingUp}
          color={overall.adherenceRate >= 80 ? 'emerald' : overall.adherenceRate >= 50 ? 'amber' : 'rose'}
          badge={overall.adherenceRate >= 80 ? 'Optimal' : 'Needs attention'}
        />
        <StatCard
          title="Current Streak"
          value={`${overall.currentStreakDays} Days`}
          subtitle="Consecutive high adherence"
          icon={Award}
          color="teal"
          badge={overall.currentStreakDays >= 3 ? 'Active Streak' : 'Building'}
        />
        <StatCard
          title="Doses Taken"
          value={overall.totalTaken}
          subtitle={`Out of ${overall.totalScheduled} scheduled`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Skipped / Missed"
          value={overall.totalSkipped + overall.totalMissed}
          subtitle="Non-compliance count"
          icon={XCircle}
          color="slate"
        />
      </div>

      {/* Adherence Trend Chart (AreaChart) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Adherence Trend (% Compliance)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily percentage of prescribed doses taken on time
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
            Target: &ge; 80%
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val) => [`${val}%`, 'Adherence']}
                labelFormatter={(label, items) => items[0]?.payload?.date || label}
                contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="adherenceRate"
                stroke="#0d9488"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout: Daily Dose Counts (BarChart) + Medicine Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Taken vs Skipped Stacked / Grouped BarChart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-base">Dose Execution Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Taken doses vs skipped/missed per day</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dayName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="taken" name="Taken" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="skipped" name="Skipped" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="Missed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medicine Compliance Breakdown List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-base">Compliance by Medication</h3>
            <p className="text-xs text-slate-500 mt-0.5">Adherence rate per individual medicine</p>
          </div>

          {medicineBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No active medication history in this period.</p>
          ) : (
            <div className="space-y-4">
              {medicineBreakdown.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {m.name} <span className="font-normal text-slate-400">({m.dosage})</span>
                    </span>
                    <span className="font-bold text-teal-700">
                      {m.adherenceRate}% ({m.taken}/{m.scheduled} doses)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        m.adherenceRate >= 80
                          ? 'bg-emerald-500'
                          : m.adherenceRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${m.adherenceRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time of Day Adherence Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <h3 className="font-bold text-slate-900 text-base mb-1">Time of Day Adherence Patterns</h3>
        <p className="text-xs text-slate-500 mb-4">
          Identifies whether morning, afternoon, evening, or nighttime doses have lower adherence.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {timeOfDayBreakdown.map((slot) => (
            <div
              key={slot.slot}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-600 block">{slot.label}</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {slot.adherenceRate}%
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {slot.taken} taken of {slot.scheduled} scheduled
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

