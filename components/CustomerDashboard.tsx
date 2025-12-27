
import React, { useState, useEffect, useCallback } from 'react';
import { DriverProfile, Booking, BookingStatus, Location, PaymentMethod } from '../types';
import { reverseGeocode, searchLocations } from '../geminiService';

interface CustomerDashboardProps {
  userId: string;
  drivers: DriverProfile[];
  bookings: Booking[];
  onBook: (booking: Booking) => void;
  onAcceptOffer: (bookingId: string, driverId: string, fare: number) => void;
  onCancelBooking: (id: string) => void;
  onRateDriver: (bookingId: string, driverId: string, rating: number) => void;
  balance: number;
  onTopUp: (amount: number) => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ 
  userId, drivers, bookings, onBook, onAcceptOffer, onCancelBooking, balance 
}) => {
  const [pickup, setPickup] = useState('Detecting location...');
  const [dest, setDest] = useState('');
  const [pickupCoords, setPickupCoords] = useState<Location>({ lat: 0, lng: 0 });
  const [destCoords, setDestCoords] = useState<Location | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'PICKUP' | 'DEST' | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setPickup("GPS not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPickupCoords(coords);
        const res = await reverseGeocode(coords.lat, coords.lng);
        setPickup(res.address || "Current Location");
      },
      (err) => {
        console.warn("GPS Access Denied:", err);
        setPickup("Manual Entry Required");
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const query = activeInput === 'PICKUP' ? pickup : dest;
    if (!query || query.length < 3 || query === 'Detecting location...') {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await searchLocations(query);
      setSuggestions(res);
    }, 600);

    return () => clearTimeout(timer);
  }, [pickup, dest, activeInput]);

  const handleSearchChange = (val: string, type: 'PICKUP' | 'DEST') => {
    if (type === 'PICKUP') setPickup(val); else setDest(val);
    setActiveInput(type);
  };

  const selectSuggestion = (s: any) => {
    if (activeInput === 'PICKUP') { 
      setPickup(s.title); 
      setPickupCoords({ lat: s.lat, lng: s.lng }); 
    } else { 
      setDest(s.title); 
      setDestCoords({ lat: s.lat, lng: s.lng }); 
    }
    setSuggestions([]); 
    setActiveInput(null);
  };

  const handleRequestRide = () => {
    if (!destCoords) return;
    const newBooking: Booking = {
      id: `ride_${Date.now()}`,
      customerId: userId,
      pickup,
      pickupCoords,
      destination: dest,
      destCoords,
      fare: 250,
      status: BookingStatus.SEARCHING,
      timestamp: new Date(),
      paymentMethod: 'CASH',
      offers: []
    };
    onBook(newBooking);
  };

  const activeBooking = bookings.find(b => b.status === BookingStatus.SEARCHING || b.status === BookingStatus.ASSIGNED || b.status === BookingStatus.IN_PROGRESS);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#f8f9fa] relative overflow-hidden">
      <div className="flex-grow bg-[#eef1f4] relative overflow-hidden flex items-center justify-center">
         {activeBooking ? (
           <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-[50px] shadow-2xl border border-white max-w-md w-full mx-4">
              <div className="w-24 h-24 bg-indigo-600 rounded-[35px] flex items-center justify-center text-white mx-auto mb-8 shadow-indigo-200 shadow-2xl animate-bounce">
                 <i className={`fas ${activeBooking.status === BookingStatus.SEARCHING ? 'fa-satellite-dish' : 'fa-car-side'} text-3xl`}></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">
                {activeBooking.status === BookingStatus.SEARCHING ? 'Finding Drivers...' : 'Ride in Progress'}
              </h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-8">
                {activeBooking.status === BookingStatus.SEARCHING ? 'Broadcasting your request' : `Trip to ${activeBooking.destination}`}
              </p>
              
              {activeBooking.status === BookingStatus.SEARCHING && activeBooking.offers.length > 0 && (
                <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar p-2">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Driver Offers</p>
                  {activeBooking.offers.map(offer => {
                    const driver = drivers.find(d => d.id === offer.driverId);
                    return (
                      <div key={offer.driverId} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-6 hover:border-indigo-500 transition-all group">
                         <div className="text-left">
                            <p className="font-black text-slate-900">{driver?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{offer.estimatedArrivalMins} mins away</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="font-black text-indigo-600">₹{offer.fare}</span>
                            <button 
                              onClick={() => onAcceptOffer(activeBooking.id, offer.driverId, offer.fare)}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-all"
                            >
                               Accept
                            </button>
                         </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <button onClick={() => onCancelBooking(activeBooking.id)} className="mt-8 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:text-rose-700">Cancel Request</button>
           </div>
         ) : (
           <div className="text-center p-8">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl">
                 <i className="fas fa-map-location-dot text-3xl"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Book a Swift Ride</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Real-time GPS tracking enabled</p>
           </div>
         )}
         
         <div className="absolute top-4 left-4 z-50">
            <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
               <i className="fas fa-satellite animate-pulse"></i> Live Network Feed
            </div>
         </div>
      </div>

      {!activeBooking && (
        <div className="w-full md:w-[450px] bg-white border-l border-slate-100 flex flex-col p-8 space-y-8 animate-slide-left z-50 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black tracking-tighter">Your Journey</h1>
              <div className="px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">₹{balance.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-4 relative">
                <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-slate-100"></div>
                
                <div className="relative pl-12">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-emerald-500 bg-white z-10"></div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Pickup Point</label>
                  <input 
                    type="text" value={pickup} onChange={(e) => handleSearchChange(e.target.value, 'PICKUP')}
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none transition-all"
                    placeholder="Enter Pickup"
                  />
                </div>

                <div className="relative pl-12">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-indigo-500 bg-white z-10"></div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Destination</label>
                  <input 
                    type="text" placeholder="Where are we going?" value={dest} onChange={(e) => handleSearchChange(e.target.value, 'DEST')}
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
            </div>

            {suggestions.length > 0 && (
              <div className="bg-white border-2 border-slate-100 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                 {suggestions.map((s, i) => (
                   <button key={i} onClick={() => selectSuggestion(s)} className="w-full p-5 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-start gap-4 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><i className="fas fa-location-dot text-sm"></i></div>
                      <div>
                        <p className="font-black text-sm text-slate-900">{s.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{s.subtitle}</p>
                      </div>
                   </button>
                 ))}
              </div>
            )}

            <div className="flex-grow"></div>

            <div className="pt-6 border-t border-slate-50">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Fare</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">₹250 - 320</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Method</p>
                    <p className="text-[10px] font-black text-indigo-600 uppercase">Cash</p>
                  </div>
               </div>
               <button 
                  onClick={handleRequestRide}
                  disabled={!destCoords}
                  className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
               >
                  Request Swiftride
               </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
