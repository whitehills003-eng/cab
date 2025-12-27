
import React, { useState } from 'react';
import { DriverProfile, DriverStatus, AdminProfile, Booking, BankDetails } from '../types';

interface AdminDashboardProps {
  currentAdmin: any;
  drivers: DriverProfile[];
  admins: AdminProfile[];
  onAddAdmin: (data: Partial<AdminProfile>) => void;
  onUpdateDriver: (id: string, status: DriverStatus, note: string) => void;
  onDeleteDriver: (id: string) => void;
  bookings: Booking[];
  adminBalance: number;
  onAdminPayout: (amount: number) => void;
  adminBankDetails?: BankDetails;
  onUpdateAdminBank: (details: BankDetails) => void;
  onUpdateSuperAdminCredentials: (email: string, pass: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentAdmin, drivers, admins, onAddAdmin, onUpdateDriver, onDeleteDriver, 
  bookings, adminBalance, onAdminPayout, adminBankDetails, onUpdateAdminBank, 
  onUpdateSuperAdminCredentials
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MODERATION' | 'STAFF' | 'SECURITY'>('OVERVIEW');
  const isSuperAdmin = currentAdmin?.id === 'admin1' || currentAdmin?.isSuperAdmin;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-wrap p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-200 self-start w-fit mb-12 gap-1">
        <TabBtn active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} label="Overview" />
        <TabBtn active={activeTab === 'MODERATION'} onClick={() => setActiveTab('MODERATION')} label="Queue" />
        <TabBtn active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} label="Staff" />
        {isSuperAdmin && <TabBtn active={activeTab === 'SECURITY'} onClick={() => setActiveTab('SECURITY')} label="Security" />}
      </div>

      {activeTab === 'OVERVIEW' && (
         <div className="space-y-8 animate-slide-up">
            <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8">
               <div>
                  <h2 className="text-4xl font-black tracking-tighter mb-2">Platform Overview</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total revenue: ₹{adminBalance.toFixed(2)}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Total Drivers" value={drivers.length.toString()} icon="fa-car" />
                <MetricCard title="Completed Rides" value={bookings.filter(b => b.status === 'COMPLETED').length.toString()} icon="fa-check-double" />
                <MetricCard title="Active Bookings" value={bookings.filter(b => ['ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length.toString()} icon="fa-clock" />
            </div>
         </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{title: string, value: string, icon: string}> = ({title, value, icon}) => (
  <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100">
    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
      <i className={`fas ${icon}`}></i>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-3xl font-black text-slate-900">{value}</p>
  </div>
);

const TabBtn: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${active ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500'}`}>
    {label}
  </button>
);

export default AdminDashboard;
