import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PartnerList from '../../components/gcs/PartnerList';

export default function GCSPartners() {
  return (
    <DashboardLayout roleTitle="Ecosystem Operator / G.C.S">
      <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
          <div className="flex justify-between items-center px-4">
              <h3 className="text-3xl font-serif italic text-ben-text">Connected <span className="text-blue-600">Hospitality</span> Partners</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-ben-muted">Active Contracts</span>
          </div>
          <PartnerList />
      </div>
    </DashboardLayout>
  );
}
