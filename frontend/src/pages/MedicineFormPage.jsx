import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Pill,
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Boxes,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

export default function MedicineFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('Tablet');
  const [frequency, setFrequency] = useState('Once daily');
  const [scheduledTimes, setScheduledTimes] = useState(['08:00']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(5);
  const [instructions, setInstructions] = useState('After food');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Suggestions from catalog
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isEditing) {
      async function loadMedicine() {
        try {
          setLoading(true);
          const res = await api.getMedicineById(id);
          if (res.success && res.medicine) {
            const m = res.medicine;
            setName(m.name);
            setDosage(m.dosage);
            setForm(m.form || 'Tablet');
            setFrequency(m.frequency || 'Once daily');
            setScheduledTimes(m.scheduled_times?.length ? m.scheduled_times : ['08:00']);
            setStartDate(m.start_date ? m.start_date.split('T')[0] : '');
            setEndDate(m.end_date ? m.end_date.split('T')[0] : '');
            setQuantity(m.quantity ?? 30);
            setRefillThreshold(m.refill_threshold ?? 5);
            setInstructions(m.instructions || 'After food');
            setNotes(m.notes || '');
            setIsActive(m.is_active);
          }
        } catch (err) {
          setError(err.message || 'Failed to load medicine details.');
        } finally {
          setLoading(false);
        }
      }
      loadMedicine();
    }
  }, [id, isEditing]);

  // Drug name autocomplete suggestions
  useEffect(() => {
    if (!isEditing && name.trim().length >= 2) {
      const delay = setTimeout(async () => {
        try {
          const res = await api.searchDrugs(name);
          if (res.success && res.results) {
            setSuggestions(res.results.slice(0, 5));
            setShowSuggestions(true);
          }
        } catch (e) {
          setSuggestions([]);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name, isEditing]);

  const handleSelectSuggestion = (drug) => {
    setName(drug.name);
    if (drug.brandNames && drug.brandNames.length > 0) {
      setNotes((prev) => (prev ? prev : `Generic for ${drug.brandNames.join(', ')}`));
    }
    setShowSuggestions(false);
  };

  const handleAddTime = () => {
    setScheduledTimes((prev) => [...prev, '20:00']);
  };

  const handleRemoveTime = (index) => {
    if (scheduledTimes.length <= 1) return;
    setScheduledTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index, value) => {
    const updated = [...scheduledTimes];
    updated[index] = value;
    setScheduledTimes(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide the medicine name.');
      return;
    }
    if (!dosage.trim()) {
      setError('Please provide the prescribed dosage (e.g. 500 mg, 1 tablet).');
      return;
    }
    if (!startDate) {
      setError('Start date is required.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      dosage: dosage.trim(),
      form,
      frequency,
      scheduled_times: scheduledTimes,
      start_date: startDate,
      end_date: endDate || null,
      quantity: parseInt(quantity, 10) || 0,
      refill_threshold: parseInt(refillThreshold, 10) || 5,
      instructions,
      notes: notes.trim() || null,
      is_active: isActive,
    };

    try {
      if (isEditing) {
        await api.updateMedicine(id, payload);
      } else {
        await api.createMedicine(payload);
      }
      navigate('/medicines');
    } catch (err) {
      setError(err.message || 'Failed to save medicine profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading medication details..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/medicines"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Medication Profile' : 'Add New Medication'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure your medication schedule, dosage instructions, and refill thresholds.
          </p>
        </div>
      </div>

      {/* Prominent Educational Notice */}
      <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <span>
          <strong>Medical Notice:</strong> MediSync does not recommend or prescribe drug dosages. Always enter the exact dosage, administration timing, and instructions prescribed by your licensed healthcare provider.
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Section 1: Identification */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">
            1. Medication Information
          </h3>

          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medicine Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin, Lisinopril, Paracetamol..."
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 border-b">
                  Verified Drug Catalog Suggestions
                </div>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full px-3.5 py-2 text-left text-xs hover:bg-teal-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="text-[11px] text-slate-400">{s.drugClass}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dosage Specification *
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 500 mg, 1 tablet, 10 ml"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dosage Form
              </label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Liquid">Liquid / Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Drops">Eye/Ear Drops</option>
                <option value="Topical">Topical / Cream</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Frequency & Scheduled Times */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">
            2. Schedule & Reminder Timings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value);
                  if (e.target.value === 'Twice daily' && scheduledTimes.length === 1) {
                    setScheduledTimes(['08:00', '20:00']);
                  } else if (e.target.value === 'Three times daily' && scheduledTimes.length <= 2) {
                    setScheduledTimes(['08:00', '14:00', '20:00']);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="Every 8 hours">Every 8 hours</option>
                <option value="As needed">As needed (PRN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meal Instructions
              </label>
              <select
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="After food">After food / With meals</option>
                <option value="Before food">Before food (30 mins prior)</option>
                <option value="With food">With food</option>
                <option value="Empty stomach">Empty stomach</option>
                <option value="At bedtime">At bedtime</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scheduled Daily Dose Times
            </label>
            <div className="space-y-2">
              {scheduledTimes.map((time, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    />
                  </div>
                  {scheduledTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Remove dose time"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {scheduledTimes.length < 5 && (
              <button
                type="button"
                onClick={handleAddTime}
                className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Daily Dose Time
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Leave empty for ongoing/chronic prescriptions
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Inventory Stock & Refills */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">
            3. Inventory & Refill Tracking
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Quantity on Hand
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Decrements by 1 each time you mark a dose as Taken
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Refill Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={refillThreshold}
                onChange={(e) => setRefillThreshold(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Displays warning banner when stock falls at or below this count
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Notes and Status */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-2">
            4. Notes & Active Status
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physician Notes / Personal Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Take with a full glass of water. Avoid taking with grapefruit juice."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="isActiveCheck" className="text-sm font-medium text-slate-700 cursor-pointer">
              Active Prescription (Uncheck to archive without deleting historical logs)
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <Link
            to="/medicines"
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Save Medication'}
          </button>
        </div>
      </form>
    </div>
  );
}

