import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pill,
  Sparkles,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import DoseActionModal from '../components/DoseActionModal';
import { api } from '../services/api';
import { useReminders } from '../context/ReminderContext';

export default function SchedulePage() {
  const { checkReminders } = useReminders();
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal action
  const [selectedDose, setSelectedDose] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      if (viewMode === 'daily') {
        const res = await api.getTodaySchedule(selectedDate);
        if (res.success) {
          setDailyData(res);
        }
      } else {
        const res = await api.getWeeklySchedule(selectedDate);
        if (res.success) {
          setWeeklyData(res);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedDate, viewMode]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (viewMode === 'weekly' ? 7 : 1));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (viewMode === 'weekly' ? 7 : 1));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenAction = (item) => {
    setSelectedDose({
      ...item,
      scheduledDate: selectedDate,
    });
    setIsModalOpen(true);
  };

  const handleActionSuccess = () => {
    fetchSchedule();
    checkReminders();
  };

  const formattedHeaderDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Medication Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse and log your daily and weekly scheduled dose occurrences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Daily / Weekly View Switch */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'daily'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Timeline
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7-Day Weekly Grid
            </button>
          </div>

          {/* Date controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Banner */}
      <div className="flex items-center justify-between bg-teal-50/70 border border-teal-200/60 px-5 py-3 rounded-xl text-teal-900">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-700" />
          <span className="text-sm font-bold">{formattedHeaderDate}</span>
        </div>
        {viewMode === 'daily' && dailyData?.summary && (
          <span className="text-xs font-semibold bg-white/80 px-2.5 py-1 rounded-lg border border-teal-200">
            {dailyData.summary.takenCount} of {dailyData.summary.totalScheduled} Doses Taken ({dailyData.summary.adherenceRate}%)
          </span>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading schedule records..." />
      ) : viewMode === 'daily' ? (
        /* Daily Timeline View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          {!dailyData?.schedule || dailyData.schedule.length === 0 ? (
            <EmptyState
              title="No medications scheduled for this date"
              description="No active medication records have dose schedules on this date."
              actionText="Add New Medicine"
              actionLink="/medicines/new"
            />
          ) : (
            <div className="space-y-4">
              {dailyData.schedule.map((dose, idx) => {
                const isTaken = dose.status === 'taken';
                const isSkipped = dose.status === 'skipped';
                const isSnoozed = dose.status === 'snoozed';

                return (
                  <div
                    key={`${dose.medicineId}_${dose.scheduledTime}_${idx}`}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border transition-all gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isSkipped
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isSnoozed
                        ? 'bg-amber-50/50 border-amber-200'
                        : dose.isOverdue
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-200/80 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Time pill */}
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-800 font-bold text-sm shrink-0 border border-slate-200/60">
                        <Clock className="w-4 h-4 text-slate-400 mb-0.5" />
                        <span>{dose.scheduledTime}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {dose.medicineName}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                            {dose.dosage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {dose.instructions || 'Standard'} &bull; Form: {dose.form} &bull; Inventory Stock: {dose.quantity}
                        </p>
                        {dose.notes && (
                          <p className="text-xs text-slate-500 italic mt-0.5">
                            Note: {dose.notes}
                          </p>
                        )}
                        {dose.isOverdue && !isTaken && !isSkipped && (
                          <span className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Overdue dose time
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {isTaken ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                          Taken
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                          <XCircle className="w-4 h-4" />
                          Skipped
                        </span>
                      ) : isSnoozed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-4 h-4" />
                          Snoozed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Pending
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenAction(dose)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs"
                      >
                        {isTaken ? 'Change Action' : 'Log Action'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 7-Day Weekly Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {weeklyData?.days?.map((dayObj) => {
            const dayDate = new Date(dayObj.date + 'T00:00:00');
            const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isToday = dayObj.date === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dayObj.date}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between min-h-[320px] ${
                  isToday ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="border-b pb-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      {dayName}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 block">{dayNum}</span>
                    <span className="text-[11px] text-teal-700 font-semibold mt-0.5 block">
                      {dayObj.taken} / {dayObj.total} Taken
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayObj.doses.map((d, dIdx) => (
                      <div
                        key={dIdx}
                        className={`p-2 rounded-xl border text-[11px] ${
                          d.status === 'taken'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                            : d.status === 'skipped'
                            ? 'bg-slate-50 border-slate-200 text-slate-500 line-through'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{d.scheduledTime}</span>
                          <span className="text-[10px] capitalize font-semibold">{d.status}</span>
                        </div>
                        <div className="truncate font-semibold mt-0.5">{d.medicineName}</div>
                      </div>
                    ))}
                    {dayObj.doses.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic text-center py-4">No doses</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDate(dayObj.date);
                    setViewMode('daily');
                  }}
                  className="mt-4 w-full py-1.5 text-center text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                >
                  View Day
                </button>
              </div>
            );
          })}
        </div>
      )}

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

