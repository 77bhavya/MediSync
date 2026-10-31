import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Bell,
  Volume2,
  Lock,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { playReminderChime } from '../utils/sound';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '../utils/notifications';

export default function SettingsPage() {
  const { user, settings, updateUserProfile, updateUserSettings } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Notification Form State
  const [browserNotif, setBrowserNotif] = useState(
    settings ? Boolean(settings.browser_notifications) : true
  );
  const [soundEnabled, setSoundEnabled] = useState(
    settings ? Boolean(settings.sound_enabled) : true
  );
  const [leadTime, setLeadTime] = useState(settings?.lead_time_minutes || 10);
  const [snoozeDuration, setSnoozeDuration] = useState(
    settings?.snooze_duration_minutes || 15
  );
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });

  // Browser Permission
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermission());

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setTimezone(user.timezone || 'Asia/Kolkata');
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      setBrowserNotif(Boolean(settings.browser_notifications));
      setSoundEnabled(Boolean(settings.sound_enabled));
      setLeadTime(settings.lead_time_minutes || 10);
      setSnoozeDuration(settings.snooze_duration_minutes || 15);
    }
  }, [settings]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage({ text: '', type: '' });
    try {
      const res = await api.updateProfile({ name, phone, timezone });
      if (res.success) {
        updateUserProfile(res.user);
        setProfileMessage({ text: 'Profile updated successfully.', type: 'success' });
      }
    } catch (err) {
      setProfileMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage({ text: '', type: '' });
    try {
      const res = await api.updateSettings({
        browser_notifications: browserNotif,
        sound_enabled: soundEnabled,
        lead_time_minutes: leadTime,
        snooze_duration_minutes: snoozeDuration,
      });
      if (res.success) {
        updateUserSettings(res.settings);
        setSettingsMessage({ text: 'Notification preferences saved.', type: 'success' });
      }
    } catch (err) {
      setSettingsMessage({ text: err.message || 'Failed to save settings.', type: 'error' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleRequestBrowserPermission = async () => {
    const result = await requestNotificationPermission();
    setPermissionStatus(result);
    if (result === 'granted') {
      showBrowserNotification('MediSync Notifications Enabled', {
        body: 'You will now receive timely reminders for your scheduled doses.',
      });
    }
  };

  const handleTestSound = () => {
    playReminderChime();
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMessage({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPwMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    setPwSaving(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPwMessage({ text: 'Password changed successfully.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPwMessage({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Account & Notification Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure personal details, alert lead times, audio chimes, and browser notification permissions.
        </p>
      </div>

      {/* Grid: Profile and Notification Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Personal Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b pb-3">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Personal Profile</h3>
          </div>

          {profileMessage.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 text-slate-500 rounded-xl cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Email is tied to your primary authentication identity.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Section 2: Reminder & Notification Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b pb-3">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Alert & Reminder Options</h3>
          </div>

          {settingsMessage.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                settingsMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {settingsMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{settingsMessage.text}</span>
            </div>
          )}

          {/* Browser Permission Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Browser Push Permission</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : permissionStatus === 'denied'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {permissionStatus === 'granted'
                  ? 'Granted'
                  : permissionStatus === 'denied'
                  ? 'Blocked in Browser'
                  : 'Pending Permission'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
              <p>
                Browser alerts require web notifications permission. Keep the MediSync tab open or active to receive real-time notifications.
              </p>
              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                <strong>Background Scope:</strong> Standard W3C Web Notification APIs require the web browser tab to remain open or running in the background. If the browser application is completely closed, reminders resume automatically when you reopen MediSync.
              </p>
            </div>
            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className="w-full py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                Grant Browser Alert Permission
              </button>
            )}
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Browser Desktop Notifications
                </span>
                <span className="text-[11px] text-slate-500">
                  Deliver desktop popups when scheduled doses are due
                </span>
              </div>
              <input
                type="checkbox"
                checked={browserNotif}
                onChange={(e) => setBrowserNotif(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Audio Chimes & Alert Tones
                </span>
                <span className="text-[11px] text-slate-500">
                  Synthesized gentle chime tone upon dose alert
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1"
                  title="Test chime sound"
                >
                  <Volume2 className="w-3 h-3 text-teal-600" />
                  Test
                </button>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Time (Min)
                </label>
                <select
                  value={leadTime}
                  onChange={(e) => setLeadTime(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                >
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Snooze Duration
                </label>
                <select
                  value={snoozeDuration}
                  onChange={(e) => setSnoozeDuration(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={settingsSaving}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {settingsSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Notification Preferences
            </button>
          </form>
        </div>
      </div>

      {/* Security & Password Change */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b pb-3">
          <Lock className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">Security & Password Management</h3>
        </div>

        {pwMessage.text && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              pwMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {pwMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{pwMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={pwSaving}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                {pwSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                Update
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* System Technical Architecture Info (College BCA Project Overview) */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Server className="w-4 h-4 text-teal-600" />
          Technical Stack & Architecture Specs
        </div>
        <p className="leading-relaxed">
          MediSync is configured with a 3-tier REST architecture:
          React.js + Tailwind CSS + Recharts on the frontend client; Express.js + JWT + bcrypt on the Node.js application server; and a normalized MySQL 8.0 relational schema with automatic SQLite fallback for zero-friction evaluation.
        </p>
      </div>
    </div>
  );
}

