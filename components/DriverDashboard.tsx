
import React, { useState, useMemo } from 'react';
import { DriverProfile, Booking, BookingStatus, DriverStatus } from '../types';

interface DriverDashboardProps {
  profile: DriverProfile;
  bookings: Booking[];
  onUpdateBooking: (id: string, status: BookingStatus, extra?: any) => void;
  onTopUpWallet: (amount: number) => void;
}

const MIN_BALANCE = 100;

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const formatDistance = (km: number) => {
  if (km >= 1) return `${km.toFixed(1)} km`;
  return `${(km * 1000).toFixed(0)}m`;
};

const DriverDashboard: React.FC<DriverDashboardProps> = ({ profile, bookings, onUpdateBooking, onTopUpWallet }) => {
  const [activeTab, setActiveTab] = useState<'RIDES' | 'PROFILE'>('RIDES');
  const [showFullMap, setShowFullMap] = useState(false);
  const [zoom, setZoom] = useState(16000);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');

  if (profile.status !== DriverStatus.APPROVED) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 animate-fade-in text-center">
        <div className="bg-amber-50 rounded-[40px] p-12 border border-white shadow-2xl">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-xl text-amber-600">
            <i className="fas fa-clock text-4xl"></i>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Verification Pending</h1>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">Your profile is currently under administrative review.</p>
        </div>
      </div>
    );
  }

  const activeRide = bookings.find(b => b.driverId === profile.id && (b.status === BookingStatus.ASSIGNED || b.status === BookingStatus.IN_PROGRESS));

  const distanceToTarget = useMemo(() => {
    if (!activeRide || !profile.location) return Infinity;
    const target = activeRide.status === BookingStatus.ASSIGNED ? activeRide.pickupCoords : activeRide.destCoords;
    return getDistanceKm(profile.location.lat, profile.location.lng, target.lat, target.lng);
  }, [activeRide, profile.location]);

  const canEndTrip = activeRide?.status === BookingStatus.IN_PROGRESS && distanceToTarget <= 0.1;
  const canStartTrip = activeRide?.status === BookingStatus.ASSIGNED && distanceToTarget <= 0.1;

  const navInstruction = useMemo(() => {
    if (!activeRide) return "";
    const dist = formatDistance(distanceToTarget);
    if (distanceToTarget <= 0.1) return `Arrived! ${activeRide.status === BookingStatus.ASSIGNED ? 'Awaiting Customer' : 'Ready to drop'}`;
    return `Head straight for ${dist} towards ${activeRide.status === BookingStatus.ASSIGNED ? 'Pickup' : 'Drop point'}`;
  }, [activeRide, distanceToTarget]);

  const hasLowBalance = profile.balance < MIN_BALANCE;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Driver Mode</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${hasLowBalance ? 'bg-rose-500' : 'bg-emerald-500 animate-ping'} rounded-full`}></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                {hasLowBalance ? 'Low Balance - Top up to accept rides' : 'Fleet Active'}
              </p>
            </div>
            <div 
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
            >
              <i className="fas fa-wallet text-indigo-600 text-[10px]"></i>
              <span className="text-xs font-black text-slate-900">₹{profile.balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-200 self-start">
          <button onClick={() => setActiveTab('RIDES')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'RIDES' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>Requests</button>
          <button onClick={() => setActiveTab('PROFILE')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'PROFILE' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}>Stats</button>
        </div>
      </div>

      {activeTab === 'RIDES' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeRide ? (
              <div className={`bg-white rounded-[40px] overflow-hidden shadow-2xl relative transition-all duration-500 ${showFullMap ? 'h-[750px]' : 'h-[600px]'} border-4 border-white`}>
                 <div className="absolute inset-0 bg-slate-100 overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="#f1f5f9" />
                      <defs>
                        <pattern id="road-grid" width={300 * (16000/zoom)} height={300 * (16000/zoom)} patternUnits="userSpaceOnUse">
                          <rect x="0" y="0" width="100%" height="100%" fill="#f8fafc" />
                          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#ffffff" strokeWidth="20" />
                          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#ffffff" strokeWidth="20" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#road-grid)" />
                      {profile.location && (
                        <line 
                          x1="50%" y1="50%" 
                          x2={`${50 + ((activeRide.status === BookingStatus.ASSIGNED ? activeRide.pickupCoords : activeRide.destCoords).lng - profile.location.lng) * zoom}%`}
                          y2={`${50 - ((activeRide.status === BookingStatus.ASSIGNED ? activeRide.pickupCoords : activeRide.destCoords).lat - profile.location.lat) * zoom}%`}
                          stroke="#6366f1" strokeWidth="12" strokeLinecap="round" opacity="0.3"
                        />
                      )}
                    </svg>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                       <div className="w-16 h-16 bg-indigo-600 rounded-3xl shadow-xl flex items-center justify-center border-4 border-white transform rotate-45">
                          <i className="fas fa-location-arrow text-white text-2xl -rotate-45"></i>
                       </div>
                    </div>
                 </div>

                 <div className="absolute top-32 right-8 z-30 flex flex-col gap-2">
                    <button onClick={() => setZoom(prev => Math.min(prev + 4000, 40000))} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-800 hover:bg-white transition-all border border-slate-200"><i className="fas fa-plus"></i></button>
                    <button onClick={() => setZoom(prev => Math.max(prev - 4000, 4000))} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-800 hover:bg-white transition-all border border-slate-200"><i className="fas fa-minus"></i></button>
                 </div>

                 <div className="absolute top-8 left-8 right-8 bg-slate-900/95 backdrop-blur-xl p-6 rounded-[35px] border border-white/10 shadow-2xl flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><i className="fas fa-directions text-2xl"></i></div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Navigation HUD</p>
                          <h3 className="text-white font-black text-lg tracking-tight truncate max-w-[200px]">{navInstruction}</h3>
                       </div>
                    </div>
                    <button onClick={() => setShowFullMap(!showFullMap)} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white border border-white/5 transition-all"><i className={`fas ${showFullMap ? 'fa-compress' : 'fa-expand'} text-sm`}></i></button>
                 </div>

                 <div className="absolute bottom-8 left-8 right-8 bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 flex flex-col gap-6 z-40">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-grow">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Address</p>
                           <h4 className="font-black text-xl text-slate-900 truncate">{activeRide.status === BookingStatus.ASSIGNED ? activeRide.pickup : activeRide.destination}</h4>
                           <div className="flex items-center gap-4 mt-2">
                              <p className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">Fare: ₹{activeRide.fare}</p>
                              <div className={`px-3 py-1 rounded-full border ${distanceToTarget <= 0.1 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                 <p className="text-[9px] font-black uppercase tracking-wider">{formatDistance(distanceToTarget)} to Arrival</p>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                           {activeRide.status === BookingStatus.ASSIGNED ? (
                               <div className="flex flex-col gap-2 w-full">
                                   <button onClick={() => onUpdateBooking(activeRide.id, BookingStatus.ASSIGNED, { driverReachedPickup: true })} disabled={distanceToTarget > 0.1 || activeRide.driverReachedPickup} className={`bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30 ${activeRide.driverReachedPickup ? 'opacity-50 grayscale' : 'hover:bg-amber-600 active:scale-95 transition-all'}`}>{activeRide.driverReachedPickup ? 'Customer Notified' : 'I Have Arrived'}</button>
                                   <button onClick={() => onUpdateBooking(activeRide.id, BookingStatus.IN_PROGRESS)} disabled={!canStartTrip} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl disabled:opacity-30 active:scale-95 transition-all">Start Trip</button>
                               </div>
                           ) : (
                               <button onClick={() => onUpdateBooking(activeRide.id, BookingStatus.COMPLETED)} disabled={!canEndTrip} className={`px-12 py-5 rounded-2xl font-black text-sm uppercase transition-all shadow-xl ${canEndTrip ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>Complete Trip</button>
                           )}
                        </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="bg-white p-24 rounded-[50px] border-4 border-dashed border-slate-100 text-center flex flex-col items-center justify-center h-[600px] shadow-sm">
                 <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200"><i className="fas fa-satellite-dish text-5xl"></i></div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">System Scanning</h3>
                 <p className="text-slate-400 mt-4 font-bold uppercase tracking-[0.2em] text-[10px]">Drivers in your sector are active. Awaiting passenger requests...</p>
                 {hasLowBalance && (
                   <div className="mt-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl animate-bounce">
                      <p className="text-xs font-black text-rose-600 uppercase tracking-widest">Low Wallet Balance (Min ₹100 Required)</p>
                      <button 
                        onClick={() => setShowWalletModal(true)}
                        className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100"
                      >
                         Top Up Wallet
                      </button>
                   </div>
                 )}
              </div>
            )}
          </div>

          <div className="space-y-6">
             <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <h3 className="font-black text-slate-900 mb-10 flex items-center gap-3"><i className="fas fa-bolt text-indigo-600"></i> Open Requests</h3>
                <div className="space-y-5">
                  {bookings.filter(b => b.status === BookingStatus.SEARCHING && !b.offers.some(o => o.driverId === profile.id)).map(b => (
                    <div key={b.id} className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 hover:border-indigo-600 transition-all cursor-pointer animate-fade-in group">
                      <div className="flex justify-between items-start mb-4">
                         <span className="font-black text-indigo-600 text-2xl tracking-tighter">₹{b.fare}</span>
                         <span className="text-[8px] bg-indigo-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">Incoming</span>
                      </div>
                      <div className="space-y-2 mb-6">
                        <p className="text-[11px] font-black text-slate-800 truncate">{b.pickup.split(',')[0]}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">{b.destination.split(',')[0]}</p>
                      </div>
                      <button 
                        disabled={hasLowBalance}
                        onClick={() => onUpdateBooking(b.id, BookingStatus.SEARCHING, { newOffer: { driverId: profile.id, fare: b.fare, estimatedArrivalMins: 5 } })} 
                        className="w-full py-4 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                         {hasLowBalance ? 'Balance Too Low' : 'Send Interest'}
                      </button>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === BookingStatus.SEARCHING && !b.offers.some(o => o.driverId === profile.id)).length === 0 && (
                    <p className="text-[10px] text-slate-300 font-black text-center py-10 uppercase tracking-[0.2em]">Searching local feed...</p>
                  )}
                </div>
             </div>
          </div>
        </div>
      ) : null}

      {/* Driver Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl relative">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Driver Wallet</h3>
                <button onClick={() => setShowWalletModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
              </div>
              <div className="space-y-8">
                <div className="p-8 bg-slate-900 rounded-[35px] text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Available Funds</p>
                  <p className="text-5xl font-black tracking-tighter">₹{profile.balance.toFixed(2)}</p>
                  {hasLowBalance && <p className="text-[9px] text-rose-400 font-black uppercase mt-4">Minimum ₹100 required to work</p>}
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Top-up Amount</label>
                  <input 
                    type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-500 outline-none font-black text-3xl tracking-tighter"
                    placeholder="₹ Amount"
                  />
                </div>
                <button 
                  onClick={() => { onTopUpWallet(parseFloat(topUpAmount)); setShowWalletModal(false); }}
                  className="w-full bg-indigo-600 text-white font-black py-7 rounded-[35px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Add Credits
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
