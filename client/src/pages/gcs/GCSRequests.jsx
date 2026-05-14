import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PartnerRequestList from '../../components/gcs/PartnerRequestList';

export default function GCSRequests() {
  return (
    <DashboardLayout roleTitle="Ecosystem Operator / G.C.S">
      <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
          <div className="flex justify-between items-center px-4">
              <h3 className="text-3xl font-serif italic text-ben-text">Incoming <span className="text-indigo-600">Partnership</span> Requests</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">Vetting Phase</span>
          </div>
          <PartnerRequestList />
      </div>
    </DashboardLayout>
  );
}
