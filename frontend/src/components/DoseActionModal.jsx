import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useReminders } from '../context/ReminderContext';

export default function DoseActionModal({ doseItem, isOpen, onClose, onSuccess }) {
  const { snoozeReminder } = useReminders();
  const [selectedStatus, setSelectedStatus] = useState('taken');
  const [snoozeMinutes, setSnoozeMinutes] = useState(15);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !doseItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (selectedStatus === 'snoozed') {
        snoozeReminder(doseItem.medicineId, doseItem.scheduledDate, doseItem.scheduledTime, snoozeMinutes);
      }

      const res = await api.recordDoseAction({
        medicine_id: doseItem.medicineId,
        scheduled_date: doseItem.scheduledDate,
        scheduled_time: doseItem.scheduledTime,
        status: selectedStatus,
        notes: selectedStatus === 'snoozed' ? `Snoozed for ${snoozeMinutes} mins. ${notes}` : notes,
      });

      if (res.success) {
        if (onSuccess) onSuccess(res);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to record dose action.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Log Medication Dose</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled for {doseItem.scheduledTime} on {doseItem.scheduledDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medicine summary */}
        <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="font-medium text-slate-900 block">{doseItem.medicineName}</span>
            <span className="text-xs text-slate-500">{doseItem.dosage} &bull; {doseItem.instructions || 'Standard'}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              Stock: {doseItem.quantity ?? 'N/A'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('taken')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedStatus === 'taken'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 mb-1 ${selectedStatus === 'taken' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Taken
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('snooze')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedStatus === 'snooze' || selectedStatus === 'snoozed'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Clock className={`w-5 h-5 mb-1 ${selectedStatus === 'snooze' || selectedStatus === 'snoozed' ? 'text-amber-600' : 'text-slate-400'}`} />
                Snooze
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('skipped')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm font-medium transition-all ${
                  selectedStatus === 'skipped'
                    ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-400/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <XCircle className={`w-5 h-5 mb-1 ${selectedStatus === 'skipped' ? 'text-rose-600' : 'text-slate-400'}`} />
                Skip
              </button>
            </div>
          </div>

          {(selectedStatus === 'snooze' || selectedStatus === 'snoozed') && (
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 animate-in fade-in">
              <label className="block text-xs font-medium text-amber-900 mb-1.5">
                Snooze reminder for:
              </label>
              <div className="flex gap-2">
                {[10, 15, 30, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSnoozeMinutes(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      snoozeMinutes === m
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Optional Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Taken with lunch, slight dizziness, etc."
              maxLength={200}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

