import React, { useState, useEffect } from 'react';
import { Menu, Bell, Plus, Clock, ShieldCheck, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReminders } from '../context/ReminderContext';
import { getNotificationPermission, requestNotificationPermission } from '../utils/notifications';

export default function Navbar({ onMenuToggle, title = 'Dashboard' }) {
  const { activeReminders } = useReminders();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotifPerm(perm);
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          </div>
        </div>

        {/* Right: Clock, Notification Pill, Add Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Real-time Clock */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-600">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>{formattedDate}</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-800">{formattedTime}</span>
          </div>

          {/* Browser Notification Permission Button if not granted */}
          {notifPerm === 'default' && (
            <button
              onClick={handleRequestPermission}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              Enable Alerts
            </button>
          )}

          {/* Active Due Reminders Bell */}
          <Link
            to="/schedule"
            className="relative p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Scheduled Doses"
          >
            <Bell className="w-5 h-5" />
            {activeReminders.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {activeReminders.length}
              </span>
            )}
          </Link>

          {/* Add Medicine Quick CTA */}
          <Link
            to="/medicines/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Medicine</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

