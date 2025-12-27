
import React, { useState, useMemo } from 'react';
import { DriverProfile, Booking, BookingStatus, DriverStatus, Location } from '../types';

interface DriverDashboardProps {
  profile: DriverProfile;
  bookings: Booking[];
  onUpdateBooking: (id: string, status: BookingStatus, extra?: any) => void;
  onTopUpWallet: (amount: number) => void;
  onUpdateLocation: (loc: Location) => void;
}

const MIN_BALANCE = 100;

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

const formatDistance = (km: number) => {
  if (km >= 1) return `${km.toFixed(1)} km`;
  return `${(km * 1000).toFixed(0)}m`;
};

const DriverDashboard: React.FC<DriverDashboardProps> = ({ profile, bookings, onUpdateBooking, onTopUpWallet, onUpdateLocation }) => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('500');

  const updateMyLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
       const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
       onUpdateLocation(loc);
    });
  };

  if (profile.status !== DriverStatus.APPROVED) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 animate-fade-in text-center">
        <div className="bg-white rounded-[50px] p-16 shadow-2xl border border-slate-50">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-500 animate-pulse">
            <i className="fas fa-shield-clock text-4xl"></i>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Under Review</h1>
          <p className="text-slate-500 font-medium mb-12">An administrator is currently verifying your documents. This usually takes 2-4 hours.</p>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 text-left">
             <i className="fas fa-info-circle text-indigo-500"></i>
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Status: {profile.status}</p>
          </div>
        </div>
      </div>
    );
  }

  const activeRide = bookings.find(b => b.driverId === profile.id && (b.status === BookingStatus.ASSIGNED || b.status === BookingStatus.IN_PROGRESS));
  const openRequests = bookings.filter(b => b.status === BookingStatus.SEARCHING && !b.offers.some(o => o.driverId === profile.id));

  const distanceToTarget = useMemo(() => {
    if (!activeRide || !profile.location || (profile.location.lat === 0 && profile.location.lng === 0)) return 0.5;
    const target = activeRide.status === BookingStatus.ASSIGNED ? activeRide.pickupCoords : activeRide.destCoords;
    return getDistanceKm(profile.location.lat, profile.location.lng, target.lat, target.lng);
  }, [activeRide, profile.location]);

  const hasLowBalance = profile.balance < MIN_BALANCE;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 ${hasLowBalance ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
              <div className={`w-2 h-2 rounded-full ${hasLowBalance ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{hasLowBalance ? 'Wallet Empty' : 'Online'}</span>
            </div>
            <button onClick={updateMyLocation} className="px-3 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors"><i className="fas fa-location-crosshairs mr-1"></i> Sync GPS</button>
          </div>
        </div>
        <div 
          onClick={() => setShowWalletModal(true)}
          className="bg-slate-900 text-white p-6 rounded-[35px] shadow-xl flex items-center gap-6 cursor-pointer hover:scale-105 transition-all"
        >
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white"><i className="fas fa-wallet"></i></div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Balance</p>
            <p className="text-2xl font-black tracking-tighter">₹{profile.balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeRide ? (
            <div className="bg-white rounded-[50px] p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5 text-9xl"><i className={`fas ${activeRide.status === BookingStatus.ASSIGNED ? 'fa-user' : 'fa-flag-checkered'}`}></i></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{activeRide.status === BookingStatus.ASSIGNED ? 'Heading to Pickup' : 'Trip in Progress'}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ride ID: {activeRide.id.slice(-6)}</span>
                  </div>
                  
                  <div className="mb-12">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Destination</p>
                     <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{activeRide.status === BookingStatus.ASSIGNED ? activeRide.pickup : activeRide.destination}</h2>
                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-location-arrow text-indigo-600"></i>
                          <span className="text-xl font-black text-slate-900">{formatDistance(distanceToTarget)}</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                        <div className="flex items-center gap-2">
                           <i className="fas fa-hand-holding-dollar text-emerald-600"></i>
                           <span className="text-xl font-black text-slate-900">₹{activeRide.fare}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4">
                    {activeRide.status === BookingStatus.ASSIGNED ? (
                       <button onClick={() => onUpdateBooking(activeRide.id, BookingStatus.IN_PROGRESS)} className="flex-grow py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Start Trip</button>
                    ) : (
                       <button onClick={() => onUpdateBooking(activeRide.id, BookingStatus.COMPLETED)} className="flex-grow py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Complete & Collect</button>
                    )}
                    <button onClick={() => onUpdateBooking(activeRide.id, BookingStatus.CANCELLED)} className="px-8 py-6 bg-rose-50 text-rose-600 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all">Issue</button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="bg-white p-24 rounded-[50px] border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[500px]">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-200 animate-pulse"><i className="fas fa-satellite-dish text-4xl"></i></div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Searching for Rides</h3>
               <p className="text-slate-400 font-medium max-w-sm mt-4">We are monitoring your sector for incoming passenger requests. Stay in high-demand areas.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black mb-8 flex items-center justify-between">
                <span>Available Requests</span>
                <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-400">{openRequests.length}</span>
              </h3>
              <div className="space-y-4">
                {openRequests.map(b => (
                   <div key={b.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-600 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-2xl font-black text-indigo-600 tracking-tighter">₹{b.fare}</p>
                        <i className="fas fa-plus-circle text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></i>
                      </div>
                      <p className="text-xs font-black text-slate-900 truncate mb-6">{b.pickup.split(',')[0]}</p>
                      <button 
                        disabled={hasLowBalance}
                        onClick={() => onUpdateBooking(b.id, BookingStatus.SEARCHING, { newOffer: { driverId: profile.id, fare: b.fare, estimatedArrivalMins: 4 } })}
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30"
                      >
                         {hasLowBalance ? 'Top up to Bid' : 'Send Offer'}
                      </button>
                   </div>
                ))}
                {openRequests.length === 0 && <p className="text-center py-12 text-slate-300 font-black uppercase text-[10px] tracking-widest">No local requests</p>}
              </div>
           </div>
        </div>
      </div>

      {showWalletModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Add Credits</h3>
                <button onClick={() => setShowWalletModal(false)} className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors"><i className="fas fa-times"></i></button>
              </div>
              <div className="space-y-8">
                <div className="p-8 bg-slate-900 rounded-[35px] text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Current Balance</p>
                  <p className="text-5xl font-black tracking-tighter">₹{profile.balance.toFixed(2)}</p>
                </div>
                <input 
                  type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-black text-2xl tracking-tighter"
                  placeholder="₹ Amount"
                />
                <button 
                  onClick={() => { onTopUpWallet(parseFloat(topUpAmount)); setShowWalletModal(false); }}
                  className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl hover:bg-indigo-700 transition-all shadow-xl"
                >
                  Confirm & Recharge
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
