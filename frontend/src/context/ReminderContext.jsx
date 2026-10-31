import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { playReminderChime } from '../utils/sound';
import { showBrowserNotification } from '../utils/notifications';

const ReminderContext = createContext(null);

export function ReminderProvider({ children }) {
  const { isAuthenticated, settings } = useAuth();
  const [activeReminders, setActiveReminders] = useState([]);
  const [snoozedUntilMap, setSnoozedUntilMap] = useState({});
  const notifiedKeysRef = useRef(new Set());

  const checkReminders = async () => {
    if (!isAuthenticated) return;

    try {
      const res = await api.getReminders();
      if (res.success && Array.isArray(res.reminders)) {
        const now = Date.now();
        const dueList = [];

        res.reminders.forEach((reminder) => {
          const key = `${reminder.medicineId}_${reminder.scheduledDate}_${reminder.scheduledTime}`;

          // Check if snoozed
          const snoozeExpiry = snoozedUntilMap[key];
          if (snoozeExpiry && now < snoozeExpiry) {
            return; // Still in snooze period
          }

          dueList.push(reminder);

          // Check if already notified
          if (!notifiedKeysRef.current.has(key)) {
            notifiedKeysRef.current.add(key);

            // Play audio chime if sound enabled
            if (res.settings?.soundEnabled) {
              playReminderChime();
            }

            // Display browser notification if enabled
            if (res.settings?.browserNotifications) {
              showBrowserNotification(`MediSync Dose Alert: ${reminder.medicineName}`, {
                body: `Scheduled for ${reminder.scheduledTime}. Dosage: ${reminder.dosage} (${reminder.instructions}).`,
                tag: key,
              });
            }
          }
        });

        setActiveReminders(dueList);
      }
    } catch (err) {
      // Quiet background failure
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveReminders([]);
      notifiedKeysRef.current.clear();
      return;
    }

    checkReminders();
    const interval = setInterval(checkReminders, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, snoozedUntilMap]);

  const snoozeReminder = (medicineId, scheduledDate, scheduledTime, minutes = 15) => {
    const key = `${medicineId}_${scheduledDate}_${scheduledTime}`;
    const expiry = Date.now() + minutes * 60 * 1000;
    setSnoozedUntilMap((prev) => ({ ...prev, [key]: expiry }));
    setActiveReminders((prev) =>
      prev.filter(
        (r) => !(r.medicineId === medicineId && r.scheduledTime === scheduledTime)
      )
    );
  };

  const dismissReminder = (medicineId, scheduledTime) => {
    setActiveReminders((prev) =>
      prev.filter(
        (r) => !(r.medicineId === medicineId && r.scheduledTime === scheduledTime)
      )
    );
  };

  return (
    <ReminderContext.Provider
      value={{
        activeReminders,
        checkReminders,
        snoozeReminder,
        dismissReminder,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}

