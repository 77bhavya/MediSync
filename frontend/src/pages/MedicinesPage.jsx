import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill,
  Plus,
  Search,
  Edit3,
  Trash2,
  Clock,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'lowStock'
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Refill Modal State
  const [refillMed, setRefillMed] = useState(null);
  const [refillQty, setRefillQty] = useState(30);
  const [refillNotes, setRefillNotes] = useState('');
  const [refilling, setRefilling] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.getMedicines();
      if (res.success) {
        setMedicines(res.medicines);
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

  const handleDelete = async (id) => {
    try {
      setDeleting(true);
      await api.deleteMedicine(id);
      setDeleteModalId(null);
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to delete medicine');
    } finally {
      setDeleting(false);
    }
  };

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    if (!refillMed) return;
    try {
      setRefilling(true);
      await api.refillStock(refillMed.id, {
        quantityAdded: refillQty,
        notes: refillNotes,
      });
      setRefillMed(null);
      fetchMedicines();
    } catch (err) {
      alert(err.message || 'Failed to refill stock');
    } finally {
      setRefilling(false);
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.dosage.toLowerCase().includes(search.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab === 'active') return m.is_active;
    if (activeTab === 'lowStock') return m.isLowStock;
    return true;
  });

  if (loading && medicines.length === 0) {
    return <LoadingSpinner message="Loading your medications..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Medications Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your prescriptions, dosage instructions, scheduled reminder times, and stock counts.
          </p>
        </div>

        <Link
          to="/medicines/new"
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add New Medicine
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, dosage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({medicines.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({medicines.filter((m) => m.is_active).length})
          </button>
          <button
            onClick={() => setActiveTab('lowStock')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === 'lowStock'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Low Stock ({medicines.filter((m) => m.isLowStock).length})
          </button>
        </div>
      </div>

      {/* Medicines Grid */}
      {filteredMedicines.length === 0 ? (
        <EmptyState
          title="No medications found"
          description={
            search
              ? `No medicines match "${search}". Try clearing your search.`
              : 'You have not added any medications yet.'
          }
          actionText={search ? undefined : 'Add First Medicine'}
          actionLink={search ? undefined : '/medicines/new'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between ${
                med.isLowStock ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200/80'
              } ${!med.is_active ? 'opacity-60 bg-slate-50/50' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        med.isLowStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {med.name}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {med.dosage} &bull; {med.form}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      med.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {med.is_active ? 'Active' : 'Archived'}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="font-medium text-slate-800">{med.frequency}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Scheduled Times:</span>
                    <div className="flex items-center gap-1">
                      {med.scheduled_times.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Stock Remaining:</span>
                    <span
                      className={`font-bold ${
                        med.isLowStock ? 'text-amber-600' : 'text-slate-800'
                      }`}
                    >
                      {med.quantity} units {med.isLowStock && '(Low Stock!)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Instructions:</span>
                    <span className="font-medium text-slate-800">{med.instructions}</span>
                  </div>

                  {med.notes && (
                    <div className="pt-1 text-slate-500 italic">
                      Note: {med.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setRefillMed(med)}
                  className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  Refill Stock
                </button>

                <div className="flex items-center gap-1">
                  <Link
                    to={`/medicines/edit/${med.id}`}
                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Medicine"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteModalId(med.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Medicine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Remove Medication?</h3>
            <p className="text-xs text-slate-500 mb-5">
              This will permanently remove this medicine and its historical dose records. This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteModalId)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Refill Modal */}
      {refillMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Refill Stock: {refillMed.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current inventory: <strong>{refillMed.quantity} units</strong> &bull; Threshold: {refillMed.refill_threshold}
            </p>

            <form onSubmit={handleRefillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Quantity Added
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={refillQty}
                  onChange={(e) => setRefillQty(parseInt(e.target.value, 10) || 0)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pharmacy / Refill Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., CVS Pharmacy 30-day bottle"
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefillMed(null)}
                  disabled={refilling}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refilling}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
                >
                  {refilling ? 'Updating...' : 'Confirm Refill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

