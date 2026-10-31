import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  ShieldAlert,
  Info,
  CheckCircle2,
  ExternalLink,
  Layers,
  Thermometer,
  AlertTriangle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { api } from '../services/api';

export default function DrugSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [drugs, setDrugs] = useState([]);
  const [dataSource, setDataSource] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDrugs = async (q = '') => {
    try {
      setLoading(true);
      const res = await api.searchDrugs(q);
      if (res.success) {
        setDrugs(res.results || []);
        setDataSource(res.dataSource || 'Verified US FDA / DailyMed Monographs');
        setDisclaimer(res.disclaimer || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchDrugs(searchTerm);
    }, 250);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Verified Drug Reference Library
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800">
              Verified Source
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reference monographs based on official US FDA drug labels and DailyMed open data.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-medium">Source Attribution</span>
          <span className="text-xs font-semibold text-slate-700">FDA Labeling / DailyMed Reference</span>
        </div>
      </div>

      {/* Prominent Educational Notice */}
      <MedicalDisclaimer />

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search generic names, brand names (e.g., Metformin, Lipitor, Amlodipine, Tylenol)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div className="shrink-0 text-xs text-slate-500">
          Showing <strong>{drugs.length}</strong> monographs
        </div>
      </div>

      {/* Drug Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Searching verified drug monograph catalog..." />
      ) : drugs.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No drugs match "{searchTerm}"</p>
          <p className="text-xs text-slate-400 mt-1">
            Try searching standard generic names like Metformin, Amlodipine, Paracetamol, or Omeprazole.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drugs.map((drug) => (
            <div
              key={drug.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {drug.name}
                  </h3>
                  <p className="text-xs font-semibold text-teal-700 mt-0.5">
                    Class: {drug.drugClass}
                  </p>
                </div>
                {drug.brandNames && drug.brandNames.length > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Common Brands
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      {drug.brandNames.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Verified Indications */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-600" />
                  Common Approved Indications
                </span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {drug.commonIndications}
                </p>
              </div>

              {/* General Administration */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  Administration Notes
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {drug.generalAdministration}
                </p>
              </div>

              {/* Side Effects */}
              {drug.typicalSideEffects && drug.typicalSideEffects.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Reported Adverse Reactions
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {drug.typicalSideEffects.map((effect, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 text-[11px] font-medium"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage info & Source attribution */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-slate-400" />
                  <span>{drug.storageInfo}</span>
                </div>
                <span className="font-medium text-teal-800">
                  Source: {drug.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

