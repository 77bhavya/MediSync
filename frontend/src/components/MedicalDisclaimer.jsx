import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export default function MedicalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
        <AlertCircle className="w-4 h-4 text-teal-600 shrink-0" />
        <span>
          <strong>Educational Notice:</strong> MediSync is a personal reminder and record-keeping tool. It does not prescribe, diagnose, or provide clinical treatment advice.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4 text-slate-700">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold text-teal-900">Medical Safety & Educational Notice</p>
          <p className="text-slate-600 leading-relaxed">
            MediSync is developed as a college BCA major project for medication scheduling, reminder tracking, and adherence logs. It is not an automated medical diagnostic tool, nor does it decide whether medications are safe to combine. Always follow your prescribing clinician’s instructions and consult a licensed pharmacist or physician for any medication questions.
          </p>
        </div>
      </div>
    </div>
  );
}

