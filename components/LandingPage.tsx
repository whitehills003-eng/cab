
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight sm:text-6xl mb-6">
            The Future of <span className="text-indigo-600 italic" onClick={() => setShowAdminLogin(!showAdminLogin)}>Urban Transit</span>
          </h1>
          <p className="mt-4 text-xl text-slate-500 max-w-3xl mx-auto">
            Experience seamless bookings, verified professional drivers, and AI-optimized routes. Join the SwiftRide community today.
          </p>
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-8">
          <RoleCard 
            title="Book a Ride" 
            description="Quick, reliable transportation at your fingertips. Safe and affordable."
            icon="fa-user"
            color="bg-indigo-600"
            buttonText="I'm a Customer"
            onClick={() => onSelectRole('CUSTOMER')}
          />
          <RoleCard 
            title="Become a Driver" 
            description="Earn on your own terms. Get verified and start driving with SwiftRide."
            icon="fa-car"
            color="bg-emerald-600"
            buttonText="I'm a Driver"
            onClick={() => onSelectRole('DRIVER')}
          />
          
          {showAdminLogin && (
            <RoleCard 
              title="Admin Portal" 
              description="Restricted area for platform administrators only."
              icon="fa-shield-halved"
              color="bg-slate-800"
              buttonText="Admin Login"
              onClick={() => onSelectRole('ADMIN')}
            />
          )}
        </div>
      </div>
      
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50 z-[-1]"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-3xl opacity-50 z-[-1]"></div>
    </div>
  );
};

const RoleCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  color: string;
  buttonText: string;
  onClick: () => void;
}> = ({ title, description, icon, color, buttonText, onClick }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col hover:border-indigo-200 transition-all group w-full md:w-[350px]">
    <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
      <i className={`fas ${icon} text-2xl`}></i>
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 mb-8 flex-grow leading-relaxed">{description}</p>
    <button 
      onClick={onClick}
      className={`${color} text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md`}
    >
      {buttonText}
    </button>
  </div>
);

export default LandingPage;
