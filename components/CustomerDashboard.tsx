
import React, { useState, useEffect } from 'react';
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

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ userId, drivers, bookings, onBook, onAcceptOffer, onCancelBooking, balance, onTopUp }) => {
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
        setPickup("Location Access Denied");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSearchChange = (val: string, type: 'PICKUP' | 'DEST') => {
    if (type === 'PICKUP') setPickup(val); else setDest(val);
    setActiveInput(type);
    if (val.length < 3) return setSuggestions([]);
    setTimeout(async () => { const res = await searchLocations(val); setSuggestions(res); }, 500);
  };

  const selectSuggestion = (s: any) => {
    if (activeInput === 'PICKUP') { setPickup(s.title); setPickupCoords({ lat: s.lat, lng: s.lng }); }
    else { setDest(s.title); setDestCoords({ lat: s.lat, lng: s.lng }); }
    setSuggestions([]); setActiveInput(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-[#f8f9fa] relative overflow-hidden">
      <div className="flex-grow bg-[#eef1f4] relative overflow-hidden flex items-center justify-center">
         <div className="text-center p-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl animate-pulse">
               <i className="fas fa-location-crosshairs text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">GPS Active</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Your real-time position is being broadcasted</p>
         </div>
         
         <div className="absolute top-4 left-4 z-50">
            <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
               <i className="fas fa-satellite animate-pulse"></i> Real-time Feed
            </div>
         </div>
      </div>

      <div className="w-full md:w-[400px] bg-white border-l border-slate-100 flex flex-col p-6 space-y-6">
          <h1 className="text-2xl font-black">Where to?</h1>
          <div className="space-y-4">
              <input 
                type="text" value={pickup} onChange={(e) => handleSearchChange(e.target.value, 'PICKUP')}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium"
              />
              <input 
                type="text" placeholder="Destination" value={dest} onChange={(e) => handleSearchChange(e.target.value, 'DEST')}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium"
              />
          </div>
          {suggestions.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
               {suggestions.map((s, i) => (
                 <button key={i} onClick={() => selectSuggestion(s)} className="w-full p-4 text-left hover:bg-slate-50 border-b last:border-0">
                    <p className="font-bold text-sm">{s.title}</p>
                    <p className="text-xs text-slate-400">{s.subtitle}</p>
                 </button>
               ))}
            </div>
          )}
          <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest">Find Cabs</button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
