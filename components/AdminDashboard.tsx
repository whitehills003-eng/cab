
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
  bookings, adminBalance
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MODERATION' | 'STAFF' | 'SECURITY'>('OVERVIEW');
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  
  const isSuperAdmin = currentAdmin?.id === 'admin1' || currentAdmin?.isSuperAdmin;
  const pendingDrivers = drivers.filter(d => d.status === DriverStatus.PENDING || d.status === DriverStatus.MODERATION);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-wrap p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-200 self-start w-fit mb-12 gap-1">
        <TabBtn active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} label="Overview" />
        <TabBtn active={activeTab === 'MODERATION'} onClick={() => setActiveTab('MODERATION')} label={`Queue (${pendingDrivers.length})`} />
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

      {activeTab === 'MODERATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Pending Approval</h3>
            {pendingDrivers.map(driver => (
              <div 
                key={driver.id} 
                onClick={() => setSelectedDriver(driver)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${selectedDriver?.id === driver.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-black text-lg">{driver.name}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedDriver?.id === driver.id ? 'text-indigo-200' : 'text-slate-400'}`}>{driver.vehicleInfo}</p>
                  </div>
                  <i className="fas fa-chevron-right opacity-50"></i>
                </div>
              </div>
            ))}
            {pendingDrivers.length === 0 && <p className="text-slate-400 font-medium py-12 text-center">No pending applications.</p>}
          </div>

          <div>
            {selectedDriver ? (
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl sticky top-24">
                <h3 className="text-2xl font-black mb-6">Verify Documents</h3>
                <div className="space-y-6 mb-8">
                  <InfoItem label="License Number" value={selectedDriver.licenseNumber} />
                  <InfoItem label="Contact" value={selectedDriver.phone} />
                  <InfoItem label="Email" value={selectedDriver.email} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDriver.documents && Object.entries(selectedDriver.documents).map(([key, value]) => (
                      <div key={key} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                         <p className="text-[8px] font-black uppercase text-slate-400 mb-2">{key}</p>
                         <i className="fas fa-file-image text-indigo-400 mb-1"></i>
                         <p className="text-[9px] font-bold text-slate-600">Document Uploaded</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => { onUpdateDriver(selectedDriver.id, DriverStatus.APPROVED, "Verified by Admin"); setSelectedDriver(null); }}
                    className="flex-grow py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-emerald-700 transition-all"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => { onUpdateDriver(selectedDriver.id, DriverStatus.REJECTED, "Application rejected by admin"); setSelectedDriver(null); }}
                    className="flex-grow py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-rose-700 transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-4 border-dashed border-slate-100 rounded-[50px]">
                <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Select a driver to review</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-slate-900 font-bold">{value}</p>
  </div>
);

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
