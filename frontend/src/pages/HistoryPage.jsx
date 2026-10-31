import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  RotateCcw,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (selectedMedId) params.append('medicineId', selectedMedId);

      const [historyRes, medRes] = await Promise.all([
        api.getDoseHistory(params.toString()),
        api.getMedicines(),
      ]);

      if (historyRes.success) {
        setRecords(historyRes.records || []);
      }
      if (medRes.success) {
        setMedicines(medRes.medicines || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate, statusFilter, selectedMedId]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSelectedMedId('');
    setSearchTerm('');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRecords = records.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.medicine_name?.toLowerCase().includes(term) ||
      r.dosage?.toLowerCase().includes(term) ||
      r.notes?.toLowerCase().includes(term)
    );
  });

  const takenCount = filteredRecords.filter((r) => r.status === 'taken').length;
  const skippedCount = filteredRecords.filter((r) => r.status === 'skipped').length;
  const snoozedCount = filteredRecords.filter((r) => r.status === 'snoozed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Medication History Log
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete audit trail of all recorded dose actions, timestamps, and compliance notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Print or export record for doctor appointment"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print / Export Record</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            Filter History
          </span>
          {(startDate || endDate || statusFilter !== 'all' || selectedMedId || searchTerm) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search notes, names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="all">All Action Statuses</option>
              <option value="taken">Taken</option>
              <option value="skipped">Skipped</option>
              <option value="snoozed">Snoozed</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          {/* Medicine filter */}
          <div>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="">All Medications</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-slate-500">Summary:</span>
          <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-700">
            Total Logs: <strong>{filteredRecords.length}</strong>
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium">
            Taken: <strong>{takenCount}</strong>
          </span>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
            Skipped: <strong>{skippedCount}</strong>
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium">
            Snoozed: <strong>{snoozedCount}</strong>
          </span>
        </div>
      </div>

      {/* History Data Table */}
      {loading ? (
        <LoadingSpinner message="Querying medication audit history..." />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title="No history records match criteria"
          description="Try adjusting your date filters, status dropdown, or search term."
          actionText="Clear Filters"
          onAction={handleResetFilters}
          icon={History}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Scheduled Date & Time</th>
                  <th className="py-3 px-4">Medication</th>
                  <th className="py-3 px-4">Dosage & Form</th>
                  <th className="py-3 px-4">Action Status</th>
                  <th className="py-3 px-4">Recorded At</th>
                  <th className="py-3 px-4">Patient / Clinical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((r) => {
                  const isTaken = r.status === 'taken';
                  const isSkipped = r.status === 'skipped';
                  const isSnoozed = r.status === 'snoozed';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.scheduled_date}</span>
                          <span className="text-slate-400">@</span>
                          <span className="text-teal-700">{r.scheduled_time}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {r.medicine_name}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {r.dosage} ({r.form})
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isTaken ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Taken
                          </span>
                        ) : isSkipped ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                            <XCircle className="w-3 h-3" />
                            Skipped
                          </span>
                        ) : isSnoozed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            Snoozed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Missed
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {r.action_timestamp
                          ? new Date(r.action_timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {r.notes || <span className="text-slate-300 italic">None</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

