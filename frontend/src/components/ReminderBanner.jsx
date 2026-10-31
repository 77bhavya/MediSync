import React, { useState } from 'react';
import { Bell, Check, Clock, X, AlertCircle } from 'lucide-react';
import { useReminders } from '../context/ReminderContext';
import { api } from '../services/api';

export default function ReminderBanner() {
  const { activeReminders, snoozeReminder, dismissReminder } = useReminders();
  const [loadingMap, setLoadingMap] = useState({});

  if (!activeReminders || activeReminders.length === 0) return null;

  const currentDose = activeReminders[0]; // Show the most urgent one

  const handleTake = async () => {
    const key = `${currentDose.medicineId}_${currentDose.scheduledTime}`;
    setLoadingMap(prev => ({ ...prev, [key]: true }));
    try {
      await api.recordDoseAction({
        medicine_id: currentDose.medicineId,
        scheduled_date: currentDose.scheduledDate,
        scheduled_time: currentDose.scheduledTime,
        status: 'taken',
        notes: 'Taken via in-app reminder alert',
      });
      dismissReminder(currentDose.medicineId, currentDose.scheduledTime);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSnooze = async () => {
    snoozeReminder(currentDose.medicineId, currentDose.scheduledDate, currentDose.scheduledTime, 15);
    try {
      await api.recordDoseAction({
        medicine_id: currentDose.medicineId,
        scheduled_date: currentDose.scheduledDate,
        scheduled_time: currentDose.scheduledTime,
        status: 'snoozed',
        notes: 'Snoozed 15 mins via in-app reminder alert',
      });
    } catch (e) {
      console.error('Failed to log snooze to server:', e);
    }
  };

  return (
    <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl p-4 shadow-md mb-6 animate-pulse-subtle">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs shrink-0">
            <Bell className="w-5 h-5 text-teal-100 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-base">Medication Due Now: {currentDose.medicineName}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-white/25 text-white font-medium">
                {currentDose.scheduledTime}
              </span>
            </div>
            <p className="text-teal-100 text-xs sm:text-sm mt-0.5">
              Dosage: <strong>{currentDose.dosage}</strong> &bull; {currentDose.instructions || 'Follow prescription instructions'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleTake}
            disabled={loadingMap[`${currentDose.medicineId}_${currentDose.scheduledTime}`]}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-teal-800 hover:bg-teal-50 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-teal-700" />
            Mark Taken
          </button>

          <button
            onClick={handleSnooze}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium backdrop-blur-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            Snooze (15m)
          </button>

          <button
            onClick={() => dismissReminder(currentDose.medicineId, currentDose.scheduledTime)}
            className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

