
import React from 'react';
import { UserRole, DriverProfile, CustomerProfile, DriverStatus } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: (DriverProfile | CustomerProfile) | null;
  role: UserRole | null;
  onLogout: () => void;
  onSwitchRole: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, user, role, onLogout, onSwitchRole }) => {
  if (!user) return null;

  // Generate a consistent color for avatar based on name
  const getAvatarColor = (name: string) => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-violet-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <div 
        className={`fixed top-0 right-0 h-full w-[320px] bg-white z-[160] shadow-2xl transition-transform duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header / Profile Section */}
          <div className="p-8 bg-slate-900 text-white">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-16 h-16 rounded-2xl ${getAvatarColor(user.name)} flex items-center justify-center text-2xl font-black shadow-xl border-2 border-white/10 uppercase`}>
                {user.name.charAt(0)}
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <i className="fas fa-times text-slate-400"></i>
              </button>
            </div>
            <h3 className="text-xl font-black tracking-tight truncate">{user.name}</h3>
            <p className="text-slate-400 text-xs font-bold truncate mb-2">{user.email}</p>
            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-black uppercase tracking-widest">
              {role} Account
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-grow py-6 overflow-y-auto">
            <div className="px-4 space-y-1">
              <MenuButton icon="fa-home" label="Dashboard" onClick={onClose} active />
              <MenuButton icon="fa-history" label="Ride History" onClick={onClose} />
              <MenuButton icon="fa-wallet" label="Payments" onClick={onClose} />
              <MenuButton icon="fa-gear" label="Settings" onClick={onClose} />
              <MenuButton icon="fa-circle-question" label="Help & Support" onClick={onClose} />
            </div>
          </div>

          {/* Bottom Actions / Role Switch */}
          <div className="p-6 border-t border-slate-100 space-y-3">
            <button 
              onClick={() => { onSwitchRole(); onClose(); }}
              className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <i className={`fas ${role === 'CUSTOMER' ? 'fa-taxi' : 'fa-user'}`}></i>
                </div>
                <span className="text-xs font-black uppercase tracking-widest">
                  {role === 'CUSTOMER' ? 'Switch to Driver' : 'Switch to Customer'}
                </span>
              </div>
              <i className="fas fa-arrow-right text-[10px] opacity-40 group-hover:translate-x-1 transition-transform"></i>
            </button>

            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-4 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const MenuButton: React.FC<{ icon: string; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-slate-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
  >
    <i className={`fas ${icon} w-5 text-sm ${active ? 'text-indigo-600' : 'text-slate-400'}`}></i>
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

export default SideMenu;
