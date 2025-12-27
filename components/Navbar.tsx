
import React, { useState } from 'react';
import { UserRole, DriverProfile, CustomerProfile } from '../types';
import SideMenu from './SideMenu';

interface NavbarProps {
  currentRole: UserRole | null;
  onLogout: () => void;
  onSwitchRole: () => void;
  currentUser: (DriverProfile | CustomerProfile) | null;
}

const Navbar: React.FC<NavbarProps> = ({ currentRole, onLogout, onSwitchRole, currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-taxi text-xl"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-800 leading-none">InRide</span>
            <div className="flex items-center gap-1 mt-0.5">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Official App</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {currentRole && (
            <>
              <div className="hidden md:flex items-center px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 mr-2 uppercase tracking-widest">Role</span>
                <span className="text-xs font-black text-slate-800 uppercase">{currentRole}</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 transition-all active:scale-95 border border-slate-200"
              >
                <i className="fas fa-bars text-sm"></i>
              </button>
            </>
          )}
        </div>
      </nav>

      <SideMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={currentUser} 
        role={currentRole} 
        onLogout={onLogout} 
        onSwitchRole={onSwitchRole} 
      />
    </>
  );
};

export default Navbar;
