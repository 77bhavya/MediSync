import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  Pill,
  Calendar,
  History,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';

export default function InventoryPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refill modal
  const [selectedMed, setSelectedMed] = useState(null);
  const [addQty, setAddQty] = useState(30);
  const [refillNotes, setRefillNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.getMedicines();
      if (res.success) {
        setMedicines(res.medicines || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMed) return;
    try {
      setSubmitting(true);
      await api.refillStock(selectedMed.id, {
        quantityAdded: addQty,
        notes: refillNotes,
      });
      setSelectedMed(null);
      setAddQty(30);
      setRefillNotes('');
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && medicines.length === 0) {
    return <LoadingSpinner message="Checking medicine inventory stock levels..." />;
  }

  const lowStockCount = medicines.filter((m) => m.isLowStock).length;
  const totalStockUnits = medicines.reduce((sum, m) => sum + (m.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Inventory & Refill Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time medicine stock tracking. Inventory decrements automatically only when doses are marked Taken.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
            Total Inventory: <strong>{totalStockUnits} units</strong>
          </div>
          {lowStockCount > 0 && (
            <div className="px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              {lowStockCount} Items Low Stock
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Warning Banner if items exist */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-sm block">Refill Alert Notice</span>
            <p className="leading-relaxed">
              You have {lowStockCount} medication(s) currently at or below their designated refill threshold. Order or collect refills from your dispensary/pharmacy to prevent missed treatment doses.
            </p>
          </div>
        </div>
      )}

      {/* Stock Cards Grid */}
      {medicines.length === 0 ? (
        <EmptyState
          title="No inventory records"
          description="Add your first medication to begin tracking stock units and refill thresholds."
          actionText="Add Medicine"
          actionLink="/medicines/new"
          icon={Boxes}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicines.map((med) => {
            const isCritical = med.quantity === 0;
            const isLow = med.isLowStock;
            const pct = Math.min(Math.round((med.quantity / Math.max(med.refill_threshold * 3, 30)) * 100), 100);

            return (
              <div
                key={med.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isCritical
                    ? 'border-rose-400 ring-2 ring-rose-300/40'
                    : isLow
                    ? 'border-amber-300 ring-1 ring-amber-200/50'
                    : 'border-slate-200/80 hover:border-teal-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">{med.name}</h3>
                      <p className="text-xs text-slate-500">{med.dosage} &bull; {med.form}</p>
                    </div>
                    {isCritical ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Out of Stock
                      </span>
                    ) : isLow ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        In Stock
                      </span>
                    )}
                  </div>

                  {/* Stock metric & progress bar */}
                  <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Quantity On Hand:</span>
                      <span className="font-extrabold text-base text-slate-900">
                        {med.quantity} <span className="text-xs font-normal text-slate-400">units</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Refill Threshold: {med.refill_threshold} units</span>
                      <span>Frequency: {med.frequency}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Est. Days Left: <strong>{med.scheduled_times.length > 0 ? Math.floor(med.quantity / med.scheduled_times.length) : 'N/A'}</strong>
                  </span>

                  <button
                    onClick={() => setSelectedMed(med)}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Refill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refill Dialog */}
      {selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Refill Stock: {selectedMed.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Current: {selectedMed.quantity} units &bull; Threshold: {selectedMed.refill_threshold}
                </p>
              </div>
            </div>

            <form onSubmit={handleRefillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Units Added
                </label>
                <div className="flex gap-2 mb-2">
                  {[10, 15, 30, 60, 90].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddQty(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        addQty === preset
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={addQty}
                  onChange={(e) => setAddQty(parseInt(e.target.value, 10) || 0)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pharmacy / Refill Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Local pharmacy 30-day bottle refill"
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedMed(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
                >
                  {submitting ? 'Updating...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

