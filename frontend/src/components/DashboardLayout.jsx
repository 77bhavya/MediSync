import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ReminderBanner from './ReminderBanner';
import MedicalDisclaimer from './MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying MediSync session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Derive title from pathname
  const getPageTitle = (path) => {
    if (path.startsWith('/schedule')) return 'Medication Schedule';
    if (path.startsWith('/medicines/new')) return 'Add New Medication';
    if (path.startsWith('/medicines/edit')) return 'Edit Medication Profile';
    if (path.startsWith('/medicines')) return 'My Medications Directory';
    if (path.startsWith('/history')) return 'Medication History Log';
    if (path.startsWith('/analytics')) return 'Adherence Analytics & Insights';
    if (path.startsWith('/inventory')) return 'Medicine Inventory & Refills';
    if (path.startsWith('/drugs')) return 'Verified Drug Information';
    if (path.startsWith('/settings')) return 'Account & Reminder Settings';
    return 'Patient Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar navigation */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar
          title={getPageTitle(location.pathname)}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Active Due Medication Alert Banner */}
          <ReminderBanner />

          {/* Child Page Route */}
          <Outlet />

          {/* Educational Disclaimer in footer */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <MedicalDisclaimer compact={true} />
            <p className="text-center text-xs text-slate-400 mt-3">
              MediSync &copy; 2026 BCA Major Project &bull; Smart Medication Management & Reminder System
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

